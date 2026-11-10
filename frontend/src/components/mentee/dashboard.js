
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import QuizAttempt from './QuizAttempt';
import ProjectSubmissionForm from './ProjectSubmission';

export default function MenteeDashboard() {
  const [mentee, setMentee] = useState(null);
  const [activeQuizResource, setActiveQuizResource] = useState(null);
  const [completingResource, setCompletingResource] = useState(null);
  const router = useRouter();

  const API_URL = 'https://tn-backend-1.onrender.com';

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('menteeToken');

      if (!token) {
        router.push('/mentee');
        return;
      }

      try {
        const res = await axios.get(
          `${API_URL}/api/m/dashboard`,
          {
            headers: { 'x-auth-token': token }
          }
        );

        setMentee(res.data);
      } catch (err) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('menteeToken');
        router.push('/mentee');
      }
    };

    fetchDashboard();
  }, [router]);

  const updateResource = (resourceId, score) => {
    setMentee(previous => {
      if (!previous) return previous;

      return {
        ...previous,
        programs: (previous.programs || []).map(program => ({
          ...program,
          resources: (program.resources || []).map(resource =>
            resource._id === resourceId
              ? {
                  ...resource,
                  completed: true,
                  score,
                  completedOn: new Date().toISOString()
                }
              : resource
          )
        }))
      };
    });
  };

  const handleComplete = async (resourceId) => {
    try {
      const token = localStorage.getItem('menteeToken');

      setCompletingResource(resourceId);

      const res = await axios.post(
        `${API_URL}/api/m/resources/${resourceId}/complete`,
        {},
        {
          headers: { 'x-auth-token': token }
        }
      );

      updateResource(resourceId, res.data.score);
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setCompletingResource(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('menteeToken');
    router.push('/mentee');
  };

  const formatDate = (date) => {
    if (!date) return 'No deadline';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date unavailable';
    }

    return parsedDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!mentee) {
    return (
      <div className="md-loading">
        <div className="md-spinner" />
        <p>Preparing your learning dashboard...</p>

        <style jsx>{`
          .md-loading {
            min-height: 70vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            color: #718096;
            font-family: Inter, Arial, sans-serif;
          }

          .md-spinner {
            width: 38px;
            height: 38px;
            border: 3px solid #e3eaf0;
            border-top-color: #28649b;
            border-radius: 50%;
            animation: spin .8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const programs = mentee.programs || [];
  const allResources = programs.flatMap(
    program => program.resources || []
  );

  const completedCount = allResources.filter(
    resource => resource.completed
  ).length;

  const totalResources = allResources.length;

  const overallProgress = totalResources > 0
    ? Math.round((completedCount / totalResources) * 100)
    : 0;

  return (
    <main className="md-page">
      <div className="md-container">

        {/* Header */}
        <header className="md-header">
          <div>
            <p className="md-eyebrow">TECHNEEDS LEARNING SPACE</p>
            <h1>Welcome back, {mentee.name} <span>👋</span></h1>
            <p className="md-subtitle">
              Keep learning, keep building and make every day count.
            </p>
          </div>

          <div className="md-header-actions">
            <button
              className="md-profile-button"
              onClick={() => router.push('/profile')}
            >
              My Profile
            </button>

            <button
              className="md-logout-button"
              onClick={handleLogout}
            >
              Log out ↗
            </button>
          </div>
        </header>

        {/* Statistics */}
        <section className="md-stats-grid">

          <div className="md-stat-card">
            <div className="md-stat-top">
              <span className="md-stat-icon">🏅</span>
              <span className="md-stat-label">LEADERBOARD</span>
            </div>
            <h2>#{mentee.rank ?? '—'}</h2>
            <p>Your current rank</p>
          </div>

          <div className="md-stat-card">
            <div className="md-stat-top">
              <span className="md-stat-icon">⭐</span>
              <span className="md-stat-label">TOTAL SCORE</span>
            </div>
            <h2>{mentee.totalScore ?? 0}</h2>
            <p>Points earned</p>
          </div>

          <div className="md-stat-card">
            <div className="md-stat-top">
              <span className="md-stat-icon">🔥</span>
              <span className="md-stat-label">LEARNING STREAK</span>
            </div>
            <h2>{mentee.streak ?? 0}<small> days</small></h2>
            <p>Keep the momentum going</p>
          </div>

          <div className="md-stat-card">
            <div className="md-stat-top">
              <span className="md-stat-icon">📚</span>
              <span className="md-stat-label">COMPLETED</span>
            </div>
            <h2>{completedCount}<small> / {totalResources}</small></h2>
            <p>Resources completed</p>
          </div>

        </section>

        {/* Overall progress */}
        <section className="md-progress-panel">
          <div className="md-progress-heading">
            <div>
              <p className="md-eyebrow">YOUR LEARNING JOURNEY</p>
              <h2>Overall Progress</h2>
            </div>

            <strong>{overallProgress}%</strong>
          </div>

          <div className="md-progress-track">
            <div
              className="md-progress-fill"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          <div className="md-progress-footer">
            <span>{completedCount} completed</span>
            <span>{totalResources - completedCount} remaining</span>
          </div>
        </section>

        {/* Programmes */}
        <section className="md-programs-section">
          <div className="md-section-heading">
            <div>
              <p className="md-eyebrow">YOUR LEARNING PATH</p>
              <h2>My Programmes</h2>
            </div>

            <span className="md-program-count">
              {programs.length} {programs.length === 1 ? 'Programme' : 'Programmes'}
            </span>
          </div>

          {programs.length === 0 ? (
            <div className="md-empty-state">
              <span>📚</span>
              <h3>No programmes assigned yet</h3>
              <p>Your mentor's assigned programmes will appear here.</p>
            </div>
          ) : (
            <div className="md-program-list">

              {programs.map(program => {
                const resources = program.resources || [];

                const completed = resources.filter(
                  resource => resource.completed
                ).length;

                const progress = resources.length > 0
                  ? Math.round((completed / resources.length) * 100)
                  : 0;

                return (
                  <article className="md-program-card" key={program._id}>

                    <div className="md-program-heading">
                      <div className="md-program-icon">📘</div>

                      <div className="md-program-title">
                        <h3>{program.name}</h3>
                        <p>
                          {completed} of {resources.length} resources completed
                        </p>
                      </div>

                      <span className="md-program-percentage">
                        {progress}%
                      </span>
                    </div>

                    <div className="md-small-progress">
                      <div
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {resources.length === 0 ? (
                      <p className="md-no-resources">
                        Your mentor hasn't added resources yet.
                      </p>
                    ) : (
                      <div className="md-resource-list">

                        {resources.map(resource => {
                          const isCompleted = resource.completed;
                          const isLocked = resource.isLocked;
                          const isActiveQuiz =
                            activeQuizResource === resource._id;

                          return (
                            <div
                              className={`md-resource-card ${
                                isCompleted ? 'is-completed' : ''
                              }`}
                              key={resource._id}
                            >

                              <div className="md-resource-main">

                                <div className="md-resource-icon">
                                  {resource.type === 'video'
                                    ? '▶️'
                                    : resource.type === 'quiz'
                                      ? '🧠'
                                      : '💻'}
                                </div>

                                <div className="md-resource-details">
                                  <h4>{resource.title}</h4>

                                  <div className="md-resource-meta">
                                    <span className="md-type">
                                      {resource.type}
                                    </span>

                                    <span>
                                      Max score: {resource.maxScore ?? 0}
                                    </span>

                                    <span>
                                      Due: {formatDate(resource.deadline)}
                                    </span>
                                  </div>
                                </div>

                                <div className={`md-status ${
                                  isCompleted
                                    ? 'status-completed'
                                    : isLocked
                                      ? 'status-locked'
                                      : 'status-pending'
                                }`}>
                                  {isCompleted
                                    ? '✓ Completed'
                                    : isLocked
                                      ? '🔒 Locked'
                                      : 'Available'}
                                </div>

                              </div>

                              <div className="md-resource-actions">

                                {resource.url && (
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="md-resource-link"
                                  >
                                    View resource ↗
                                  </a>
                                )}

                                {isCompleted ? (
                                  <div className="md-completed-details">
                                    <span>
                                      Score: <strong>{resource.score ?? 0}</strong>
                                    </span>

                                    {resource.completedOn && (
                                      <span>
                                        Completed on {formatDate(resource.completedOn)}
                                      </span>
                                    )}
                                  </div>
                                ) : isLocked ? (
                                  <span className="md-locked-message">
                                    This resource is currently locked.
                                  </span>
                                ) : (
                                  <div className="md-action-area">

                                    {resource.type === 'quiz' && (
                                      isActiveQuiz ? (
                                        <QuizAttempt
                                          resourceId={resource._id}
                                          onComplete={(score) => {
                                            updateResource(resource._id, score);
                                            setActiveQuizResource(null);
                                          }}
                                        />
                                      ) : (
                                        <button
                                          className="md-action-button"
                                          onClick={() => setActiveQuizResource(resource._id)}
                                        >
                                          Attempt Quiz →
                                        </button>
                                      )
                                    )}

                                    {resource.type === 'project' && (
                                      <ProjectSubmissionForm
                                        resourceId={resource._id}
                                        onSubmitted={(score) => {
                                          updateResource(resource._id, score);
                                        }}
                                      />
                                    )}

                                    {resource.type !== 'quiz' &&
                                      resource.type !== 'project' && (
                                        <button
                                          className="md-complete-button"
                                          disabled={completingResource === resource._id}
                                          onClick={() => handleComplete(resource._id)}
                                        >
                                          {completingResource === resource._id
                                            ? 'Saving...'
                                            : 'Mark as completed ✓'}
                                        </button>
                                      )}

                                  </div>
                                )}

                              </div>

                            </div>
                          );
                        })}

                      </div>
                    )}

                  </article>
                );
              })}

            </div>
          )}
        </section>

      </div>

      <style jsx>{`
        .md-page {
          min-height: 100vh;
          background: #f5f7fa;
          padding: 48px 24px 80px;
          color: #172b42;
          font-family: Inter, Arial, sans-serif;
        }

        .md-container {
          max-width: 1160px;
          margin: 0 auto;
        }

        .md-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
        }

        .md-eyebrow {
          color: #3975a8;
          font-size: 10px;
          letter-spacing: 1.6px;
          font-weight: 750;
          margin: 0 0 9px;
        }

        .md-header h1 {
          font-size: clamp(27px, 4vw, 38px);
          letter-spacing: -1px;
          margin: 0;
          font-weight: 750;
        }

        .md-header h1 span {
          font-size: 25px;
        }

        .md-subtitle {
          color: #718096;
          font-size: 14px;
          margin: 9px 0 0;
          line-height: 1.6;
        }

        .md-header-actions {
          display: flex;
          gap: 10px;
          flex-shrink: 0;
        }

        .md-profile-button,
        .md-logout-button {
          padding: 11px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          transition: .2s ease;
        }

        .md-profile-button {
          background: #285f8d;
          color: #fff;
          border: 1px solid #285f8d;
        }

        .md-profile-button:hover {
          background: #19496f;
        }

        .md-logout-button {
          background: #fff;
          color: #4e6073;
          border: 1px solid #dce4ec;
        }

        .md-logout-button:hover {
          background: #edf3f8;
        }

        .md-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .md-stat-card {
          background: #fff;
          border: 1px solid #e4eaf0;
          border-radius: 12px;
          padding: 20px;
          min-width: 0;
          box-shadow: 0 4px 14px rgba(25, 47, 70, .025);
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .md-stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(25, 47, 70, .07);
        }

        .md-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .md-stat-icon {
          font-size: 21px;
        }

        .md-stat-label {
          color: #8593a2;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1px;
        }

        .md-stat-card h2 {
          margin: 17px 0 4px;
          font-size: 29px;
          font-weight: 750;
          color: #172b42;
        }

        .md-stat-card h2 small {
          font-size: 14px;
          color: #7c8c9d;
          font-weight: 500;
        }

        .md-stat-card > p {
          margin: 0;
          font-size: 12px;
          color: #8190a0;
        }

        .md-progress-panel {
          padding: 24px 26px;
          background: #fff;
          border: 1px solid #e4eaf0;
          border-radius: 12px;
          margin-bottom: 35px;
        }

        .md-progress-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .md-progress-heading .md-eyebrow {
          margin-bottom: 5px;
        }

        .md-progress-heading h2 {
          font-size: 19px;
          margin: 0;
        }

        .md-progress-heading strong {
          color: #28649b;
          font-size: 25px;
        }

        .md-progress-track,
        .md-small-progress {
          height: 8px;
          background: #eaf0f5;
          border-radius: 20px;
          overflow: hidden;
        }

        .md-progress-fill {
          height: 100%;
          background: #3979ac;
          border-radius: inherit;
          transition: width .4s ease;
        }

        .md-progress-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          color: #8492a1;
          font-size: 11px;
        }

        .md-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 20px;
        }

        .md-section-heading .md-eyebrow {
          margin-bottom: 5px;
        }

        .md-section-heading h2 {
          font-size: 23px;
          margin: 0;
          letter-spacing: -.4px;
        }

        .md-program-count {
          color: #6d7e90;
          font-size: 11px;
          font-weight: 650;
          background: #eaf0f5;
          padding: 8px 12px;
          border-radius: 7px;
        }

        .md-program-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .md-program-card {
          background: #fff;
          border: 1px solid #e3eaf0;
          border-radius: 13px;
          padding: 24px;
          box-shadow: 0 4px 15px rgba(25, 47, 70, .025);
        }

        .md-program-heading {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 17px;
        }

        .md-program-icon {
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          background: #edf3f8;
          border-radius: 10px;
          font-size: 22px;
          flex-shrink: 0;
        }

        .md-program-title {
          flex: 1;
          min-width: 0;
        }

        .md-program-title h3 {
          font-size: 17px;
          margin: 0 0 5px;
          overflow-wrap: anywhere;
        }

        .md-program-title p {
          color: #8291a0;
          font-size: 11px;
          margin: 0;
        }

        .md-program-percentage {
          color: #28649b;
          font-size: 18px;
          font-weight: 750;
        }

        .md-small-progress {
          height: 5px;
          margin-bottom: 20px;
        }

        .md-small-progress > div {
          height: 100%;
          background: #5b8bb2;
          border-radius: inherit;
          transition: width .4s ease;
        }

        .md-resource-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .md-resource-card {
          padding: 17px;
          background: #fbfcfd;
          border: 1px solid #e8edf2;
          border-radius: 10px;
          transition: border-color .2s ease, background .2s ease;
        }

        .md-resource-card:hover {
          border-color: #cbdbe8;
          background: #fff;
        }

        .md-resource-card.is-completed {
          background: #f8fbf9;
          border-color: #e0ebe3;
        }

        .md-resource-main {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .md-resource-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          background: #edf2f7;
          border-radius: 9px;
          flex-shrink: 0;
          font-size: 18px;
        }

        .md-resource-details {
          flex: 1;
          min-width: 0;
        }

        .md-resource-details h4 {
          font-size: 14px;
          margin: 0 0 7px;
          overflow-wrap: anywhere;
        }

        .md-resource-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 14px;
          color: #8492a1;
          font-size: 10px;
        }

        .md-type {
          text-transform: capitalize;
          color: #35698f;
          font-weight: 700;
        }

        .md-status {
          font-size: 10px;
          font-weight: 700;
          padding: 7px 9px;
          border-radius: 6px;
          white-space: nowrap;
        }

        .status-completed {
          color: #477553;
          background: #eaf4ec;
        }

        .status-locked {
          color: #866c42;
          background: #f7f0e4;
        }

        .status-pending {
          color: #35698f;
          background: #eaf1f7;
        }

        .md-resource-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: 14px;
          margin-top: 14px;
          border-top: 1px solid #e9eef2;
        }

        .md-resource-link {
          color: #356e9b;
          font-size: 11px;
          font-weight: 650;
          text-decoration: none;
        }

        .md-resource-link:hover {
          text-decoration: underline;
        }

        .md-action-area {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .md-action-button,
        .md-complete-button {
          border: 0;
          border-radius: 7px;
          padding: 10px 15px;
          background: #285f8d;
          color: #fff;
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
          transition: background .2s ease, transform .2s ease;
        }

        .md-action-button:hover,
        .md-complete-button:hover:not(:disabled) {
          background: #19496f;
          transform: translateY(-1px);
        }

        .md-complete-button:disabled {
          opacity: .6;
          cursor: wait;
        }

        .md-completed-details {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          color: #65806c;
          font-size: 11px;
        }

        .md-locked-message {
          color: #927b55;
          font-size: 11px;
        }

        .md-no-resources {
          color: #8593a2;
          font-size: 13px;
          padding: 12px 0 0;
        }

        .md-empty-state {
          text-align: center;
          padding: 55px 20px;
          background: #fff;
          border: 1px dashed #dce5ed;
          border-radius: 12px;
        }

        .md-empty-state > span {
          font-size: 32px;
        }

        .md-empty-state h3 {
          margin: 12px 0 7px;
          font-size: 17px;
        }

        .md-empty-state p {
          margin: 0;
          color: #8492a1;
          font-size: 13px;
        }

        @media (max-width: 850px) {
          .md-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .md-page {
            padding: 30px 14px 55px;
          }

          .md-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .md-header-actions {
            width: 100%;
          }

          .md-profile-button,
          .md-logout-button {
            flex: 1;
          }

          .md-stat-card {
            padding: 15px;
          }

          .md-stat-card h2 {
            font-size: 24px;
          }

          .md-stat-label {
            font-size: 8px;
          }

          .md-program-card {
            padding: 16px;
          }

          .md-resource-card {
            padding: 13px;
          }

          .md-resource-main {
            flex-wrap: wrap;
          }

          .md-status {
            margin-left: 53px;
          }

          .md-resource-actions {
            align-items: flex-start;
            flex-direction: column;
          }

          .md-section-heading h2 {
            font-size: 20px;
          }
        }

        @media (max-width: 380px) {
          .md-stats-grid {
            gap: 9px;
          }

          .md-stat-card {
            padding: 12px;
          }

          .md-stat-card h2 {
            font-size: 21px;
          }

          .md-stat-label {
            letter-spacing: .5px;
          }

          .md-program-percentage {
            font-size: 15px;
          }
        }
      `}</style>
    </main>
  );
}
