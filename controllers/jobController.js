import { useState } from "react";
import axios from "axios";

const JobFinder = ({ onJobAdded }) => {
  const [domain, setDomain] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appliedIds, setAppliedIds] = useState([]);
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `${API_URL}/api/jobs/search?domain=${encodeURIComponent(domain.trim())}`
      );
      setJobs(res.data);
      if (res.data.length === 0) {
        setError("Is domain ke liye koi job nahi mili. Koi aur keyword try karein.");
      }
    } catch (err) {
      console.error("Job search error:", err);
      setError("Jobs fetch karne mein error aaya.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAndTrack = async (job) => {
    // 1. Official apply page naye tab mein kholein
    window.open(job.applyUrl, "_blank", "noopener,noreferrer");

    // 2. Placement Tracker database mein save karein (exact companyName field ke saath)
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/api/applications`,
        {
          companyName: job.company,
          role: job.role,
          status: "Applied",
          appliedDate: new Date().toISOString().split("T")[0],
          notes: `Location: ${job.location} | Link: ${job.applyUrl}`,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAppliedIds((prev) => [...prev, job.externalId]);

      // KanbanBoard ko refresh karne ke liye
      if (onJobAdded) {
        onJobAdded();
      }
    } catch (err) {
      console.error("Error saving application:", err);
      alert("Apply link khul gaya hai, par board mein save nahi ho paya.");
    }
  };

  return (
    <div className="card shadow-sm p-4 mb-4 mx-2">
      <h5 className="fw-bold mb-3">Find & Apply Jobs by Domain</h5>

      <form onSubmit={handleSearch} className="d-flex gap-2 mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Enter domain (e.g. React, Full Stack, Node.js, Frontend)..."
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />
        <button type="submit" className="btn btn-primary px-4" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p className="text-danger small mb-2">{error}</p>}

      <div className="row g-3">
        {jobs.map((job) => {
          const isApplied = appliedIds.includes(job.externalId);
          return (
            <div key={job.externalId} className="col-md-6 col-lg-4">
              <div className="card h-100 p-3 border">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="fw-bold mb-0">{job.role}</h6>
                  <span className="badge bg-light text-dark border">
                    {job.jobType}
                  </span>
                </div>
                <p className="text-primary fw-semibold mb-1">{job.company}</p>
                <small className="text-muted mb-3">{job.location}</small>

                <button
                  type="button"
                  className={`btn btn-sm mt-auto w-100 ${
                    isApplied ? "btn-success" : "btn-outline-primary"
                  }`}
                  onClick={() => handleApplyAndTrack(job)}
                  disabled={isApplied}
                >
                  {isApplied ? "Applied & Added to Board ✓" : "Apply & Track"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default JobFinder;