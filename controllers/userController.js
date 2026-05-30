const User = require("../models/User");

// GET /api/user/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "analyses",
      select: "result.ats_score result.overall_score result.target_role createdAt",
      options: { sort: { createdAt: -1 }, limit: 5 },
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        totalAnalyses: user.analyses.length,
        recentAnalyses: user.analyses,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Could not fetch profile." });
  }
};

// PATCH /api/user/profile
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required." });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    );

    res.json({
      message: "Profile updated!",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Could not update profile." });
  }
};

module.exports = { getProfile, updateProfile };
