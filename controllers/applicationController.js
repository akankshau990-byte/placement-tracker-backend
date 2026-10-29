const Application = require("../models/Application");

// 1. GET ALL APPLICATIONS FOR LOGGED-IN USER
const getApplications = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id || req.user?.id;
    const applications = await Application.find({ userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: "Server error fetching applications" });
  }
};

// 2. ADD NEW APPLICATION
const addApplication = async (req, res) => {
  try {
    const { companyName, role, status, appliedDate, interviewDate, notes } =
      req.body;

    if (!companyName || !role) {
      return res
        .status(400)
        .json({ message: "Company Name and Role are required!" });
    }

    const userId = req.user?.userId || req.user?._id || req.user?.id;

    const newApp = await Application.create({
      userId,
      companyName: companyName.trim(),
      role: role.trim(),
      status: status || "Applied",
      appliedDate: appliedDate || Date.now(),
      interviewDate: interviewDate || null,
      notes: notes || "",
    });

    res.status(201).json(newApp);
  } catch (error) {
    console.error("Error adding application:", error);
    res.status(500).json({ message: "Server error adding application" });
  }
};

// 3. UPDATE APPLICATION (FULL EDIT)
const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?._id || req.user?.id;

    const updatedApp = await Application.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedApp) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.status(200).json(updatedApp);
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).json({ message: "Server error updating application" });
  }
};

// 4. UPDATE APPLICATION STATUS (PATCH FOR KANBAN DRAG & DROP)
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Applied", "Interviewing", "Selected", "Rejected"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const userId = req.user?.userId || req.user?._id || req.user?.id;

    const application = await Application.findOneAndUpdate(
      { _id: id, userId },
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.status(200).json(application);
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Server error updating status" });
  }
};

// 5. DELETE APPLICATION
const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?._id || req.user?.id;

    const deletedApp = await Application.findOneAndDelete({ _id: id, userId });

    if (!deletedApp) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.status(200).json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(500).json({ message: "Server error deleting application" });
  }
};

module.exports = {
  getApplications,
  addApplication,
  updateApplication,
  updateStatus,
  deleteApplication,
};