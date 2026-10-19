const Application = require("../models/Application");

// 1. Add New Application
const addApplication = async (req, res) => {
  try {
    const { companyName, role, status, appliedDate, interviewDate, notes } = req.body;
    const userId = req.user.userId;

    const newApp = await Application.create({
      companyName,
      role,
      status,
      userId,
      appliedDate: appliedDate || Date.now(),
      interviewDate: interviewDate || null,
      notes: notes || "",
    });

    res.status(201).json({ message: "Application added!", application: newApp });
  } catch (error) {
    console.log("🔥 Add Application Error:", error);
    res.status(500).json({ error: "Failed to add application" });
  }
};

// 2. Get All User Applications
const getApplications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const application = await Application.find({ userId: userId }).sort({ createdAt: -1 });
    res.status(200).json(application);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};

// 3. Update Existing Application (For Notes & Date Edits)
const updateApplication = async (req, res) => {
  try {
    const { companyName, role, status, appliedDate, interviewDate, notes } = req.body;

    const updatedApp = await Application.findByIdAndUpdate(
      req.params.id,
      {
        companyName,
        role,
        status,
        appliedDate,
        interviewDate: interviewDate || null,
        notes: notes || "",
      },
      { new: true }
    );

    if (!updatedApp) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.status(200).json({ message: "Application updated!", application: updatedApp });
  } catch (error) {
    console.log("🔥 Update Application Error:", error);
    res.status(500).json({ error: "Failed to update application" });
  }
};

// 4. Delete Application
const deleteApplication = async (req, res) => {
  try {
    const deletedApp = await Application.findByIdAndDelete(req.params.id);
    
    if (!deletedApp) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.status(200).json({ message: "Application deleted successfully!" });
  } catch (error) {
    console.log("🔥 Delete Application Error:", error);
    res.status(500).json({ error: "Failed to delete application" });
  }
};

module.exports = {
  addApplication,
  getApplications,
  updateApplication,
  deleteApplication,
};