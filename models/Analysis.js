const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resumeText: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
      default: "",
    },
    result: {
      ats_score: Number,
      overall_score: Number,
      candidate_name: String,
      target_role: String,
      extracted_skills: [String],
      strengths: [String],
      weaknesses: [String],
      skill_gaps: [String],
      job_matches: [
        {
          title: String,
          match: Number,
          company_type: String,
        },
      ],
      roadmap: [
        {
          week: String,
          focus: String,
          resources: [String],
        },
      ],
      resume_improvements: [String],
      interview_questions: [String],
      summary: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Analysis", analysisSchema);
