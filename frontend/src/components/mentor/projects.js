
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://tn-backend-1.onrender.com";

const UnverifiedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState("");
  const [error, setError] = useState("");

  const fetchProjects = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please log in as a mentor to view submissions.");
        return;
      }

      const res = await axios.get(
        `${API_URL}/api/unverified-projects`,
        {
          headers: { "x-auth-token": token },
        }
      );

      const projectList = res.data.unverifiedProjects || [];

      setProjects(projectList);

      const initialScores = {};

      projectList.forEach((project) => {
        const key = `${project.menteeId}-${project.resourceId}`;
        initialScores[key] = project.score ?? "";
      });

      setScores(initialScores);
    } catch (err) {
      console.error("Failed to fetch project submissions:", err);
      setError(
        err.response?.data?.error ||
        "Unable to load project submissions. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (key, value) => {
    if (value === "") {
      setScores((previous) => ({
        ...previous,
        [key]: "",
      }));
      return;
    }

    const numericValue = Number(value);

    if (!Number.isInteger(numericValue) || numericValue < 0) {
      return;
    }

    setScores((previous) => ({
      ...previous,
      [key]: numericValue,
    }));
  };

  const handleVerify = async (project) => {
    const token = localStorage.getItem("token");
    const key = `${project.menteeId}-${project.resourceId}`;
    const score = scores[key];

    if (!token) {
      alert("Your mentor session has expired. Please log in again.");
      return;
    }

    if (score === "" || score === undefined || Number(score) < 0) {
      alert("Please enter a valid score.");
      return;
    }

    setVerifying(key);

    try {
      await axios.patch(
        `${API_URL}/api/${project.menteeId}/resources/${project.resourceId}/verify`,
        { score: Number(score) },
        {
          headers: { "x-auth-token": token },
        }
      );

      setProjects((previous) =>
        previous.filter(
          (item) =>
            !(
              item.menteeId === project.menteeId &&
              item.resourceId === project.resourceId
            )
        )
      );

      alert("Project verified successfully!");
    } catch (err) {
      console.error("Project verification failed:", err);

      alert(
        err.response?.data?.error ||
        "Unable to verify this project. Please try again."
      );
    } finally {
      setVerifying("");
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <section className="mentor-projects-section">
      <div className="mentor-projects-header">
        <div>
          <p className="mentor-section-kicker">SUBMISSION REVIEW</p>
          <h2>Project submissions</h2>
          <p>Review mentee work and award scores for completed projects.</p>
        </div>

        <button
          type="button"
          className="mentor-refresh-button"
          onClick={fetchProjects}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="mentor-projects-message">
          <div className="mentor-projects-spinner"></div>
          <p>Loading project submissions...</p>
        </div>
      ) : error ? (
        <div className="mentor-projects-message mentor-projects-error">
          <p>{error}</p>
          <button type="button" onClick={fetchProjects}>
            Try again
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="mentor-projects-empty">
          <span>✓</span>
          <h3>All caught up!</h3>
          <p>There are no unverified project submissions right now.</p>
        </div>
      ) : (
        <div className="mentor-projects-list">
          {projects.map((project) => {
            const key = `${project.menteeId}-${project.resourceId}`;
            const isVerifying = verifying === key;

            return (
              <article
                key={key}
                className="mentor-project-card"
              >
                <div className="mentor-project-card-header">
                  <div>
                    <span className="mentor-pending-label">
                      Pending review
                    </span>
                    <h3>{project.resourceTitle}</h3>
                  </div>
                </div>

                <div className="mentor-project-details">
                  <p>
                    <strong>Mentee:</strong> {project.menteeName}
                  </p>

                  <p>
                    <strong>Submitted:</strong>{" "}
                    {project.submittedOn
                      ? new Date(project.submittedOn).toLocaleString()
                      : "Date unavailable"}
                  </p>
                </div>

                <div className="mentor-project-links">
                  {project.githubLink && (
                    <a
                      href={project.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View GitHub submission ↗
                    </a>
                  )}

                  {project.deployedLink && (
                    <a
                      href={project.deployedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View live project ↗
                    </a>
                  )}
                </div>

                <div className="mentor-project-description">
                  <h4>Project description</h4>
                  <p>
                    {project.description || "No description provided."}
                  </p>
                </div>

                <div className="mentor-project-review">
                  <div>
                    <label htmlFor={`score-${key}`}>
                      Award score
                    </label>

                    <input
                      id={`score-${key}`}
                      type="number"
                      min="0"
                      step="1"
                      value={scores[key] ?? ""}
                      onChange={(event) =>
                        handleScoreChange(key, event.target.value)
                      }
                      placeholder="Enter score"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleVerify(project)}
                    disabled={isVerifying}
                  >
                    {isVerifying ? "Verifying..." : "Verify project ✓"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default UnverifiedProjects;
