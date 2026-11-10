
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import "./leaderboard.css";

export default function Leaderboard() {
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLeaderboard = async () => {
    try {
      setError("");

      const res = await axios.get(
        "https://tn-backend-1.onrender.com/api/m/leaderboard"
      );

      setMentees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
      setError("Unable to load rankings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="leaderboard-state">
        <div className="leaderboard-spinner"></div>
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-state">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={fetchLeaderboard}>Try again</button>
      </div>
    );
  }

  const topThree = mentees.slice(0, 3);

  return (
    <main className="leaderboard">
      <header className="leaderboard-header">
        <div>
          <p className="leaderboard-eyebrow">THE LEARNING ARENA</p>
          <h1>Mentee Leaderboard</h1>
          <p>Celebrate progress, consistency and learning achievements.</p>
        </div>

        <button
          className="leaderboard-refresh"
          onClick={fetchLeaderboard}
        >
          ↻ Refresh
        </button>
      </header>

      <section className="leaderboard-summary">
        <div>
          <span>Participating mentees</span>
          <strong>{mentees.length}</strong>
        </div>
        <div>
          <span>Highest score</span>
          <strong>
            {mentees.length
              ? Math.max(...mentees.map((m) => Number(m.totalScore) || 0))
              : 0}
          </strong>
        </div>
        <div>
          <span>Top performer</span>
          <strong>{mentees[0]?.name || "—"}</strong>
        </div>
      </section>

      {topThree.length > 0 && (
        <section className="leaderboard-top">
          <div className="leaderboard-section-title">
            <div>
              <p className="leaderboard-eyebrow">CURRENT STANDINGS</p>
              <h2>Top performers</h2>
            </div>
            <span>{mentees.length} participants</span>
          </div>

          <div className="top-performers">
            {topThree.map((mentee, index) => (
              <article
                className={`top-performer rank-${index + 1}`}
                key={mentee._id || mentee.enrollmentNumber || index}
              >
                <span className="top-rank">
                  {["🥇", "🥈", "🥉"][index]}
                </span>
                <div className="top-avatar">
                  {mentee.name?.charAt(0)?.toUpperCase() || "M"}
                </div>
                <h3>{mentee.name || "Mentee"}</h3>
                <strong>{mentee.totalScore ?? 0} points</strong>
                <span className="top-streak">
                  🔥 {mentee.streak ?? 0} day streak
                </span>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="leaderboard-rankings">
        <div className="leaderboard-section-title">
          <div>
            <p className="leaderboard-eyebrow">FULL RANKINGS</p>
            <h2>All mentees</h2>
          </div>
        </div>

        {mentees.length === 0 ? (
          <div className="leaderboard-empty">
            <h3>No rankings available yet</h3>
            <p>Rankings will appear here as mentees earn points.</p>
          </div>
        ) : (
          <div className="responsive-table-wrapper">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Mentee</th>
                  <th>Total score</th>
                  <th>Streak</th>
                </tr>
              </thead>

              <tbody>
                {mentees.map((mentee, index) => (
                  <tr key={mentee._id || mentee.enrollmentNumber || index}>
                    <td>
                      <span className="rank-number">
                        #{mentee.rank ?? index + 1}
                      </span>
                    </td>
                    <td>
                      <div className="table-mentee">
                        <span className="table-avatar">
                          {mentee.name?.charAt(0)?.toUpperCase() || "M"}
                        </span>
                        <strong>{mentee.name || "Mentee"}</strong>
                      </div>
                    </td>
                    <td>
                      <strong className="score-value">
                        {mentee.totalScore ?? 0}
                      </strong>
                      <span className="score-unit"> points</span>
                    </td>
                    <td>🔥 {mentee.streak ?? 0} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
