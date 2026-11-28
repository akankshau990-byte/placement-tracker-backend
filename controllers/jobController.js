const DOMAIN_SYNONYMS = {
  cybersecurity: ["cyber", "security", "infosec", "soc", "penetration", "vulnerability", "network security"],
  "full stack": ["full stack", "fullstack", "mern", "mean", "software engineer", "web developer"],
  mern: ["mern", "react", "node", "mongodb", "express", "full stack"],
  frontend: ["frontend", "front-end", "react", "vue", "angular", "ui", "javascript", "css"],
  backend: ["backend", "back-end", "node", "express", "python", "django", "java", "spring", "api"],
  react: ["react", "reactjs", "next.js", "nextjs", "frontend"],
  python: ["python", "django", "flask", "fastapi", "data"],
  data: ["data", "analyst", "analytics", "machine learning", "ai", "sql"],
};

const searchJobsByDomain = async (req, res) => {
  const rawDomain = (req.query.domain || "").trim().toLowerCase();

  if (!rawDomain) {
    return res.status(400).json({ message: "Domain query is required" });
  }

  try {
    // 1. Remotive API se jobs fetch karein
    const apiRes = await fetch(
      `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(rawDomain)}&limit=50`
    );
    const data = await apiRes.json();
    const allJobs = data.jobs || [];

    // 2. Domain ke synonyms aur keywords nikalein
    const keywords = DOMAIN_SYNONYMS[rawDomain] || [rawDomain];

    // 3. Strict filtering: Job title, category, ya tags mein keyword match hona chahiye
    const matchedJobs = allJobs.filter((job) => {
      const title = (job.title || "").toLowerCase();
      const category = (job.category || "").toLowerCase();
      const tags = Array.isArray(job.tags) ? job.tags.join(" ").toLowerCase() : "";
      const searchableText = `${title} ${category} ${tags}`;

      return keywords.some((kw) => searchableText.includes(kw));
    });

    // 4. Clean frontend format mein map karein
    let formattedJobs = matchedJobs.slice(0, 12).map((job) => ({
      externalId: String(job.id),
      role: job.title,
      company: job.company_name,
      location: job.candidate_required_location || "Remote",
      jobType: job.job_type ? job.job_type.replace("_", " ") : "Full Time",
      applyUrl: job.url,
      description: `${job.title} - ${job.category} ${(job.tags || []).join(", ")}`,
    }));

    // 5. Agar niche domain (jaise cybersecurity) ke liye remote listings kam hain,
    // toh direct India-focused domain-filtered job links add karein
    if (formattedJobs.length < 3) {
      const encoded = encodeURIComponent(req.query.domain.trim());
      const fallbacks = [
        {
          externalId: `li-${rawDomain}-1`,
          role: `${req.query.domain.trim()} Intern / Developer`,
          company: "LinkedIn Jobs (Live)",
          location: "India / Remote",
          jobType: "Internship / Full-time",
          applyUrl: `https://www.linkedin.com/jobs/search/?keywords=${encoded}&location=India`,
          description: `${req.query.domain} roles in India`,
        },
        {
          externalId: `in-${rawDomain}-2`,
          role: `${req.query.domain.trim()} Internship`,
          company: "Internshala (Live)",
          location: "India / Work From Home",
          jobType: "Internship",
          applyUrl: `https://internshala.com/internships/keywords-${encoded}/`,
          description: `${req.query.domain} internships`,
        },
        {
          externalId: `wf-${rawDomain}-3`,
          role: `${req.query.domain.trim()} Engineer`,
          company: "Wellfound Startups",
          location: "Bengaluru / Remote",
          jobType: "Startup Role",
          applyUrl: `https://wellfound.com/jobs?q=${encoded}`,
          description: `${req.query.domain} startup openings`,
        },
      ];
      formattedJobs = [...formattedJobs, ...fallbacks];
    }

    res.status(200).json(formattedJobs);
  } catch (error) {
    console.error("Error searching jobs:", error);
    res.status(500).json({ message: "Server error searching jobs" });
  }
};

module.exports = { searchJobsByDomain };