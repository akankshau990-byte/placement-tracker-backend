const cron = require("node-cron");
const Application = require("../models/Application");
const User = require("../models/User");

const sendReminderEmail = async (toEmail, userName, companyName, role, interviewDate) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !toEmail) return;

  const formattedDate = new Date(interviewDate).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Placement Tracker <onboarding@resend.dev>",
        to: [toEmail],
        subject: `⏰ Interview Tomorrow: ${companyName} (${role})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #0d6efd;">🚀 Interview Reminder!</h2>
            <p>Hi <strong>${userName || "Candidate"}</strong>,</p>
            <p>You have an upcoming interview scheduled for <strong>tomorrow (${formattedDate})</strong>:</p>
            <div style="background: #f8f9fa; padding: 14px; border-left: 4px solid #0d6efd; margin: 16px 0;">
              <p style="margin: 0;"><strong>Company:</strong> ${companyName}</p>
              <p style="margin: 6px 0 0;"><strong>Role:</strong> ${role}</p>
            </div>
            <p><strong>Quick Last-Minute Checklist:</strong></p>
            <ul>
              <li>Review your saved <strong>Company Prep Vault</strong> notes & key DSA patterns.</li>
              <li>Prepare a crisp 2-minute walkthrough of your MERN projects.</li>
              <li>Test your mic, camera, and stable internet 15 minutes early.</li>
            </ul>
            <p style="color: #555; font-size: 13px; margin-top: 20px;">Best of luck! — Placement Tracker Automated Reminders</p>
          </div>
        `,
      }),
    });

    if (response.ok) {
      console.log(`Reminder email sent to ${toEmail} for ${companyName}`);
    } else {
      const errData = await response.json();
      console.error("Resend API error:", errData);
    }
  } catch (err) {
    console.error("Failed to send reminder email:", err.message);
  }
};

const startReminderCron = () => {
  // Runs every day at 9:00 AM IST (3:30 AM UTC)
  cron.schedule("30 3 * * *", async () => {
    console.log("Running daily interview reminder check...");
    try {
      const tomorrowStart = new Date();
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      tomorrowStart.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrowStart);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const upcomingApps = await Application.find({
        interviewDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
        status: { $nin: ["Rejected", "Selected"] },
      }).populate("user", "name email");

      for (const app of upcomingApps) {
        if (app.user && app.user.email) {
          await sendReminderEmail(
            app.user.email,
            app.user.name,
            app.companyName,
            app.role,
            app.interviewDate
          );
        }
      }
    } catch (error) {
      console.error("Cron job error:", error.message);
    }
  });

  console.log("Daily Interview Reminder Cron Job scheduled (9:00 AM IST).");
};

module.exports = { startReminderCron, sendReminderEmail };