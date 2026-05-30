const pdfParse = require("pdf-parse");
const Analysis = require("../models/Analysis");
const User = require("../models/User");

// POST /api/resume/analyze
const analyzeResume = async (req, res) => {
  try {
    let resumeText = req.body.resumeText || "";
    const jobDescription = req.body.jobDescription || "";

    // If a PDF was uploaded, extract text from it
    if (req.file) {
      try {
        const pdfData = await pdfParse(req.file.buffer);
        resumeText = pdfData.text;
      } catch (pdfErr) {
        return res.status(400).json({ error: "Could not read PDF. Try pasting the text instead." });
      }
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ error: "Resume text is too short or missing." });
    }

    const prompt = `You are ResuMind AI, a career intelligence system. Analyze this resume and return a comprehensive JSON analysis.

RESUME:
${resumeText}

${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription}` : ""}

Return ONLY valid JSON (no markdown, no backticks) in this exact format:
{
  "ats_score": <number 0-100>,
  "overall_score": <number 0-100>,
  "candidate_name": "<name or 'Candidate'>",
  "target_role": "<best matching role title>",
  "extracted_skills": ["skill1", "skill2"],
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "skill_gaps": ["gap1", "gap2", "gap3", "gap4"],
  "job_matches": [
    {"title": "Role Title", "match": <0-100>, "company_type": "Company type"},
    {"title": "Role Title", "match": <0-100>, "company_type": "Company type"},
    {"title": "Role Title", "match": <0-100>, "company_type": "Company type"}
  ],
  "roadmap": [
    {"week": "Week 1-2", "focus": "Topic", "resources": ["Resource1", "Resource2"]},
    {"week": "Week 3-4", "focus": "Topic", "resources": ["Resource1", "Resource2"]},
    {"week": "Week 5-8", "focus": "Topic", "resources": ["Resource1", "Resource2"]}
  ],
  "resume_improvements": ["improvement1", "improvement2", "improvement3"],
  "interview_questions": ["Question 1?", "Question 2?", "Question 3?"],
  "summary": "<2-3 sentence honest career summary>"
}`;

    // Call Gemini API
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.ANTHROPIC_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
        })
      }
    );

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error("Gemini error:", geminiData);
      return res.status(502).json({ error: "AI service error. Please try again." });
    }

    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    // Save to database
    const analysis = await Analysis.create({
      user: req.user._id,
      resumeText: resumeText.slice(0, 5000),
      jobDescription: jobDescription.slice(0, 2000),
      result,
    });

    // Link analysis to user
    await User.findByIdAndUpdate(req.user._id, {
      $push: { analyses: analysis._id },
    });

    res.status(201).json({
      message: "Analysis complete!",
      analysisId: analysis._id,
      result,
    });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(502).json({ error: "AI returned unexpected format. Please try again." });
    }
    console.error("Analysis error:", err);
    res.status(500).json({ error: "Analysis failed. Please try again." });
  }
};

// GET /api/resume/history
const getHistory = async (req, res) => {
  try {
    const analyses = await Analysis.find({ user: req.user._id })
      .select("result.candidate_name result.ats_score result.overall_score result.target_role createdAt")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ analyses });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Could not fetch history." });
  }
};

// GET /api/resume/:id
const getAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found." });
    }

    res.json({ analysis });
  } catch (err) {
    console.error("Get analysis error:", err);
    res.status(500).json({ error: "Could not fetch analysis." });
  }
};

// DELETE /api/resume/:id
const deleteAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found." });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { analyses: analysis._id },
    });

    res.json({ message: "Analysis deleted." });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Could not delete analysis." });
  }
};

module.exports = { analyzeResume, getHistory, getAnalysis, deleteAnalysis };
