const searchJobsByDomain = async (req, res) => {
  try {
    const { domain } = req.query;
    if (!domain || !domain.trim()) {
      return res.status(400).json({ message: "Please enter a job domain" });
    }

    const query = encodeURIComponent(domain.trim());
    const response = await fetch(
      `https://remotive.com/api/remote-jobs?search=${query}&limit=12`
    );

    if (!response.ok) {
      throw new Error("External Job API failed");
    }

    const data = await response.json();

    const formattedJobs = (data.jobs || []).map((job) => ({
      externalId: job.id,
      company: job.company_name,
      role: job.title,
      location: job.candidate_required_location || "Remote",
      jobType: job.job_type || "Full-time",
      applyUrl: job.url,
      postedDate: job.publication_date,
    }));

    res.status(200).json(formattedJobs);
  } catch (error) {
    console.error("Job Search Error:", error);
    res.status(500).json({ message: "Failed to fetch jobs for this domain" });
  }
};

module.exports = { searchJobsByDomain };