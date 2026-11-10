
"use client";

import { useEffect, useState } from "react";
import {
  createProgram,
  createMentor,
  addMentorToProgram,
  getAllPrograms,
  getAllMentors,
} from "../lib/api";

export default function AdminPanel() {
  const [programName, setProgramName] = useState("");
  const [mentorData, setMentorData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [programs, setPrograms] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    try {
      setError("");
      const [programRes, mentorRes] = await Promise.all([
        getAllPrograms(),
        getAllMentors(),
      ]);

      setPrograms(Array.isArray(programRes) ? programRes : []);
      setMentors(Array.isArray(mentorRes) ? mentorRes : []);
    } catch (err) {
      console.error("Admin data loading failed:", err);
      setError("Unable to load programmes and mentors. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProgramSubmit = async (e) => {
    e.preventDefault();
    if (!programName.trim()) return;

    try {
      setSaving("program");
      setError("");
      setSuccess("");

      await createProgram(programName.trim());
      setProgramName("");
      setSuccess("Programme created successfully.");
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Could not create programme.");
    } finally {
      setSaving("");
    }
  };

  const handleMentorSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving("mentor");
      setError("");
      setSuccess("");

      await createMentor(mentorData);
      setMentorData({ name: "", email: "", password: "" });
      setSuccess("Mentor added successfully.");
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Could not add mentor.");
    } finally {
      setSaving("");
    }
  };

  const handleAssignMentor = async (programId, mentorId) => {
    try {
      setSaving(mentorId);
      setError("");
      setSuccess("");

      await addMentorToProgram(programId, mentorId);
      setSuccess("Mentor assigned successfully.");
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Could not assign mentor.");
    } finally {
      setSaving("");
    }
  };

  const getAssignedMentors = (program) =>
    mentors.filter((mentor) =>
      mentor.programs?.some((p) => {
        const id = p?._id || p;
        return id?.toString() === program._id?.toString();
      })
    );

  const unassignedMentors = mentors.filter(
    (mentor) => !mentor.programs || mentor.programs.length === 0
  );

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="admin-loading">Loading admin dashboard...</div>
        <style jsx>{`
          .admin-panel {
            min-height: 70vh;
            display: grid;
            place-items: center;
            color: #526174;
            font-family: Arial, sans-serif;
          }
        `}</style>
      </div>
    );
  }

  return (
    <main className="admin-panel">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">MANAGEMENT CONSOLE</p>
          <h1>Admin Dashboard</h1>
          <p className="admin-subtitle">
            Manage programmes, mentors and their assignments.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={fetchData}
          disabled={saving !== ""}
        >
          ↻ Refresh
        </button>
      </header>

      <section className="admin-stats">
        <div className="stat-card">
          <span>Total programmes</span>
          <strong>{programs.length}</strong>
        </div>
        <div className="stat-card">
          <span>Total mentors</span>
          <strong>{mentors.length}</strong>
        </div>
        <div className="stat-card">
          <span>Unassigned mentors</span>
          <strong>{unassignedMentors.length}</strong>
        </div>
      </section>

      {error && <div className="admin-message error-message">{error}</div>}
      {success && (
        <div className="admin-message success-message">{success}</div>
      )}

      <section className="admin-forms">
        <form className="admin-card" onSubmit={handleProgramSubmit}>
          <div className="card-heading">
            <span className="card-icon">01</span>
            <div>
              <h2>Create a programme</h2>
              <p>Start a new learning programme.</p>
            </div>
          </div>

          <label htmlFor="program-name">Programme name</label>
          <input
            id="program-name"
            type="text"
            placeholder="e.g. Web Development"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            required
          />

          <button type="submit" disabled={saving !== ""}>
            {saving === "program" ? "Creating..." : "Create programme"}
          </button>
        </form>

        <form className="admin-card" onSubmit={handleMentorSubmit}>
          <div className="card-heading">
            <span className="card-icon">02</span>
            <div>
              <h2>Add a mentor</h2>
              <p>Create mentor login credentials.</p>
            </div>
          </div>

          <label htmlFor="mentor-name">Full name</label>
          <input
            id="mentor-name"
            type="text"
            placeholder="Mentor name"
            value={mentorData.name}
            onChange={(e) =>
              setMentorData({ ...mentorData, name: e.target.value })
            }
            required
          />

          <label htmlFor="mentor-email">Email address</label>
          <input
            id="mentor-email"
            type="email"
            placeholder="mentor@example.com"
            value={mentorData.email}
            onChange={(e) =>
              setMentorData({ ...mentorData, email: e.target.value })
            }
            required
          />

          <label htmlFor="mentor-password">Password</label>
          <input
            id="mentor-password"
            type="password"
            placeholder="Create a password"
            value={mentorData.password}
            onChange={(e) =>
              setMentorData({ ...mentorData, password: e.target.value })
            }
            required
          />

          <button type="submit" disabled={saving !== ""}>
            {saving === "mentor" ? "Adding..." : "Add mentor"}
          </button>
        </form>
      </section>

      <section className="programs-section">
        <div className="section-heading">
          <div>
            <p className="admin-eyebrow">PROGRAMME OVERVIEW</p>
            <h2>Programmes and mentor assignments</h2>
          </div>
          <span className="count-label">{programs.length} programmes</span>
        </div>

        {programs.length === 0 ? (
          <div className="admin-empty">
            <h3>No programmes yet</h3>
            <p>Create your first programme using the form above.</p>
          </div>
        ) : (
          <div className="program-grid">
            {programs.map((program) => {
              const assignedMentors = getAssignedMentors(program);

              return (
                <article className="program-card" key={program._id}>
                  <div className="program-card-heading">
                    <div>
                      <span className="program-label">PROGRAMME</span>
                      <h3>{program.name}</h3>
                    </div>
                    <span className="mentor-count">
                      {assignedMentors.length} assigned
                    </span>
                  </div>

                  <div className="assigned-area">
                    <h4>Assigned mentors</h4>

                    {assignedMentors.length === 0 ? (
                      <p className="muted-text">
                        No mentors assigned to this programme.
                      </p>
                    ) : (
                      assignedMentors.map((mentor) => (
                        <div className="mentor-row" key={mentor._id}>
                          <div className="mentor-avatar">
                            {mentor.name?.charAt(0)?.toUpperCase() || "M"}
                          </div>
                          <div className="mentor-info">
                            <strong>{mentor.name}</strong>
                            <span>{mentor.email}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="assignment-area">
                    <h4>Assign a mentor</h4>

                    {unassignedMentors.length === 0 ? (
                      <p className="muted-text">
                        No unassigned mentors available.
                      </p>
                    ) : (
                      unassignedMentors.map((mentor) => (
                        <div className="assignment-row" key={mentor._id}>
                          <div>
                            <strong>{mentor.name}</strong>
                            <span>{mentor.email}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleAssignMentor(program._id, mentor._id)
                            }
                            disabled={saving !== ""}
                          >
                            {saving === mentor._id ? "Adding..." : "+ Assign"}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <style jsx>{`
        .admin-panel {
          min-height: 100vh;
          padding: 38px clamp(18px, 5vw, 65px) 60px;
          background: #f5f7fa;
          color: #172b43;
          font-family: Arial, sans-serif;
        }

        .admin-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 30px;
        }

        .admin-eyebrow {
          margin: 0 0 8px;
          color: #296c9e;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
        }

        .admin-header h1 {
          margin: 0;
          font-size: clamp(27px, 4vw, 36px);
          color: #172b43;
        }

        .admin-subtitle {
          margin: 9px 0 0;
          color: #667589;
          font-size: 15px;
        }

        .admin-panel button {
          border: 0;
          border-radius: 8px;
          padding: 11px 17px;
          background: #296c9e;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .admin-panel button:hover {
          background: #20577f;
        }

        .admin-panel button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .admin-panel .refresh-button {
          background: white;
          border: 1px solid #dce4ed;
          color: #296c9e;
        }

        .admin-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 26px;
        }

        .stat-card,
        .admin-card,
        .program-card {
          background: white;
          border: 1px solid #e4eaf1;
          border-radius: 13px;
          box-shadow: 0 4px 14px rgba(23, 43, 67, 0.035);
        }

        .stat-card {
          padding: 20px 22px;
        }

        .stat-card span {
          display: block;
          color: #718096;
          font-size: 13px;
        }

        .stat-card strong {
          display: block;
          margin-top: 8px;
          font-size: 29px;
          color: #172b43;
        }

        .admin-forms {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 42px;
        }

        .admin-card {
          padding: 25px;
        }

        .card-heading {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 22px;
        }

        .card-icon {
          display: grid;
          place-items: center;
          width: 39px;
          height: 39px;
          border-radius: 10px;
          background: #eaf2f9;
          color: #296c9e;
          font-size: 13px;
          font-weight: 700;
        }

        .card-heading h2 {
          margin: 0;
          font-size: 19px;
        }

        .card-heading p {
          margin: 5px 0 0;
          color: #78869a;
          font-size: 13px;
        }

        .admin-card label {
          display: block;
          margin: 13px 0 7px;
          color: #43546a;
          font-size: 13px;
          font-weight: 600;
        }

        .admin-card input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 13px;
          border: 1px solid #dce4ed;
          border-radius: 8px;
          outline: none;
          color: #172b43;
          background: white;
          font-size: 14px;
        }

        .admin-card input:focus {
          border-color: #5592bd;
          box-shadow: 0 0 0 3px rgba(41, 108, 158, 0.1);
        }

        .admin-card button {
          width: 100%;
          margin-top: 19px;
        }

        .admin-message {
          margin-bottom: 20px;
          padding: 13px 16px;
          border-radius: 8px;
          font-size: 14px;
        }

        .error-message {
          background: #fff0f0;
          color: #a53333;
        }

        .success-message {
          background: #edf8f1;
          color: #23734a;
        }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 20px;
        }

        .section-heading h2 {
          margin: 0;
          font-size: 23px;
        }

        .count-label {
          padding: 7px 12px;
          border-radius: 20px;
          background: #eaf2f9;
          color: #296c9e;
          font-size: 12px;
          font-weight: 700;
        }

        .program-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 19px;
        }

        .program-card {
          padding: 22px;
          min-width: 0;
        }

        .program-card-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          padding-bottom: 17px;
          border-bottom: 1px solid #edf0f4;
        }

        .program-label {
          color: #8290a2;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .program-card h3 {
          margin: 7px 0 0;
          font-size: 19px;
          overflow-wrap: anywhere;
        }

        .mentor-count {
          flex-shrink: 0;
          padding: 6px 9px;
          border-radius: 20px;
          background: #edf6f1;
          color: #28734d;
          font-size: 11px;
          font-weight: 700;
        }

        .assigned-area,
        .assignment-area {
          padding-top: 18px;
        }

        .assigned-area h4,
        .assignment-area h4 {
          margin: 0 0 13px;
          font-size: 14px;
        }

        .mentor-row {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 12px;
        }

        .mentor-avatar {
          display: grid;
          place-items: center;
          width: 35px;
          height: 35px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #eaf2f9;
          color: #296c9e;
          font-weight: 700;
        }

        .mentor-info,
        .assignment-row > div {
          display: flex;
          flex-direction: column;
          min-width: 0;
          gap: 4px;
        }

        .mentor-info strong,
        .assignment-row strong {
          font-size: 13px;
        }

        .mentor-info span,
        .assignment-row span {
          color: #78869a;
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .muted-text {
          color: #8793a3;
          font-size: 13px;
        }

        .assignment-area {
          margin-top: 8px;
          padding-top: 17px;
          border-top: 1px solid #edf0f4;
        }

        .assignment-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 0;
        }

        .assignment-row button {
          flex-shrink: 0;
          padding: 8px 12px;
          font-size: 12px;
        }

        .admin-empty {
          padding: 35px;
          border: 1px dashed #cbd5e1;
          border-radius: 12px;
          text-align: center;
          background: white;
        }

        .admin-empty h3 {
          margin: 0 0 8px;
        }

        .admin-empty p {
          margin: 0;
          color: #78869a;
          font-size: 14px;
        }

        .admin-loading {
          color: #526174;
        }

        @media (max-width: 850px) {
          .admin-forms,
          .program-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 560px) {
          .admin-panel {
            padding: 25px 15px 40px;
          }

          .admin-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .admin-stats {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .stat-card {
            padding: 15px 18px;
          }

          .stat-card strong {
            font-size: 24px;
          }

          .admin-card,
          .program-card {
            padding: 18px;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .assignment-row {
            align-items: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
