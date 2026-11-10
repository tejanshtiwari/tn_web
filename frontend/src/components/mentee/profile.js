
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function MenteeProfile() {
  const [mentee, setMentee] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('menteeToken');

      if (!token) {
        router.push('/mentee');
        return;
      }

      try {
        const res = await axios.get(
          'https://tn-backend-1.onrender.com/api/m/dashboard',
          {
            headers: { 'x-auth-token': token }
          }
        );

        setMentee(res.data);
      } catch (error) {
        localStorage.removeItem('menteeToken');
        router.push('/mentee');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('menteeToken');
    router.push('/mentee');
  };

  if (loading) {
    return (
      <div className="profile-message">
        <div className="loading-spinner" />
        <p>Preparing your learning profile...</p>

        <style jsx>{`
          .profile-message {
            min-height: 70vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 16px;
            color: #526174;
            font-family: Inter, sans-serif;
          }

          .loading-spinner {
            width: 36px;
            height: 36px;
            border: 3px solid #e5edf5;
            border-top-color: #28649b;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!mentee) {
    return (
      <div className="profile-message">
        <p>Unable to load your profile.</p>
        <button onClick={() => router.push('/dashboard')}>
          Back to dashboard
        </button>
        <style jsx>{`
          .profile-message {
            min-height: 60vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 14px;
            font-family: Inter, sans-serif;
          }
          button {
            padding: 10px 18px;
            border: 0;
            border-radius: 7px;
            background: #245b8d;
            color: white;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  // Collect all resources from the mentee's programmes.
  const programs = mentee.programs || [];

  const resources = programs.flatMap(
    program => program.resources || []
  );

  const completedResources = resources.filter(
    resource => resource.completed
  );

  const pendingResources = resources.filter(
    resource => !resource.completed
  );

  const completed = completedResources.length;
  const total = resources.length;

  const progress = total > 0
    ? Math.round((completed / total) * 100)
    : 0;

  // Create badges using actual learning activity.
  const skillBadges = [];

  if (completed >= 1) {
    skillBadges.push({
      icon: '🚀',
      title: 'Getting Started',
      description: 'Completed your first resource'
    });
  }

  if (completedResources.some(resource => resource.type === 'quiz')) {
    skillBadges.push({
      icon: '🧠',
      title: 'Quiz Explorer',
      description: 'Completed a quiz'
    });
  }

  if (completedResources.some(resource => resource.type === 'project')) {
    skillBadges.push({
      icon: '🛠️',
      title: 'Project Builder',
      description: 'Submitted a project'
    });
  }

  if ((mentee.streak || 0) >= 3) {
    skillBadges.push({
      icon: '🔥',
      title: 'Consistent Learner',
      description: 'Maintained a 3-day learning streak'
    });
  }

  if (progress === 100 && total > 0) {
    skillBadges.push({
      icon: '🏆',
      title: 'Programme Finisher',
      description: 'Completed all assigned resources'
    });
  }

  // Derive interest tags from programme and resource names.
  const interestTags = [
    ...new Set([
      ...programs.map(program => program.name),
      ...resources.map(resource => resource.type)
    ].filter(Boolean))
  ];

  // Generate a performance summary from real activity.
  let performanceSummary;

  if (total === 0) {
    performanceSummary =
      'Your learning journey is ready to begin. Once your mentor assigns resources, your progress and achievements will appear here.';
  } else if (completed === 0) {
    performanceSummary =
      `You have ${total} learning resources waiting for you. Start with one resource and build your learning momentum.`;
  } else if (progress === 100) {
    performanceSummary =
      `Excellent work! You have completed all ${total} assigned resources and earned ${mentee.totalScore || 0} points. Keep challenging yourself with advanced topics.`;
  } else {
    performanceSummary =
      `You have completed ${completed} out of ${total} resources (${progress}%). Your current score is ${mentee.totalScore || 0} points. Keep going to make further progress.`;
  }

  // Suggest next steps based on incomplete work.
  const recommendations = [];

  if (completed === 0 && total > 0) {
    recommendations.push({
      icon: '📚',
      title: 'Start learning',
      description: 'Begin with one of your assigned resources to start building your progress.'
    });
  }

  if (pendingResources.some(resource => resource.type === 'quiz')) {
    recommendations.push({
      icon: '🧩',
      title: 'Practise your knowledge',
      description: 'Try an available quiz to check your understanding.'
    });
  }

  if (pendingResources.some(resource => resource.type === 'project')) {
    recommendations.push({
      icon: '💻',
      title: 'Build something practical',
      description: 'Work on an assigned project to apply what you have learned.'
    });
  }

  if (pendingResources.length > 0 && recommendations.length < 3) {
    recommendations.push({
      icon: '🎯',
      title: 'Continue your programme',
      description: `${pendingResources.length} resource(s) are still waiting for completion.`
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      icon: '🌟',
      title: 'Explore further',
      description: 'You have completed your assigned resources. Ask your mentor about advanced learning opportunities.'
    });
  }

  return (
    <main className="profile-page">
      <div className="profile-container">

        {/* Profile heading */}
        <section className="profile-header">
          <div className="profile-heading">
            <p className="eyebrow">YOUR LEARNING SPACE</p>
            <h1>My Profile</h1>
            <p className="header-description">
              Track your progress, celebrate achievements and discover your next learning goals.
            </p>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            Log out <span>↗</span>
          </button>
        </section>

        {/* Welcome card */}
        <section className="welcome-card">
          <div className="avatar">
            {mentee.name?.charAt(0)?.toUpperCase() || 'M'}
          </div>

          <div className="welcome-details">
            <p className="welcome-label">WELCOME BACK</p>
            <h2>{mentee.name}</h2>
            <span>TechNeeds Mentee</span>
          </div>

          <div className="welcome-rank">
            <span>LEADERBOARD RANK</span>
            <strong>#{mentee.rank ?? '—'}</strong>
          </div>
        </section>

        {/* Statistics */}
        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">🏅</span>
            <p>Leaderboard Rank</p>
            <h3>#{mentee.rank ?? '—'}</h3>
          </div>

          <div className="stat-card">
            <span className="stat-icon">⭐</span>
            <p>Total Score</p>
            <h3>{mentee.totalScore ?? 0}</h3>
          </div>

          <div className="stat-card">
            <span className="stat-icon">🔥</span>
            <p>Learning Streak</p>
            <h3>{mentee.streak ?? 0} days</h3>
          </div>

          <div className="stat-card">
            <span className="stat-icon">📖</span>
            <p>Resources Completed</p>
            <h3>{completed}<small> / {total}</small></h3>
          </div>
        </section>

        {/* Learning progress */}
        <section className="profile-section progress-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR JOURNEY</p>
              <h2>Learning Progress</h2>
            </div>
            <strong className="progress-percentage">{progress}%</strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="progress-footer">
            <span>{completed} completed</span>
            <span>{pendingResources.length} remaining</span>
          </div>
        </section>

        {/* Skill badges */}
        <section className="profile-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR ACHIEVEMENTS</p>
              <h2>Skill Badges</h2>
            </div>
          </div>

          {skillBadges.length === 0 ? (
            <div className="empty-state">
              <span>🎖️</span>
              <p>Your badges will appear here as you complete learning activities.</p>
            </div>
          ) : (
            <div className="badge-grid">
              {skillBadges.map(badge => (
                <div className="achievement-card" key={badge.title}>
                  <span className="achievement-icon">{badge.icon}</span>
                  <div>
                    <h3>{badge.title}</h3>
                    <p>{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Interest tags */}
        <section className="profile-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">WHAT YOU ARE EXPLORING</p>
              <h2>Interest Areas</h2>
            </div>
          </div>

          {interestTags.length === 0 ? (
            <p className="muted-text">
              Interest areas will appear when a programme or resource is assigned.
            </p>
          ) : (
            <div className="interest-tags">
              {interestTags.map(tag => (
                <span className="interest-tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Performance summary */}
        <section className="profile-section performance-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ACTIVITY OVERVIEW</p>
              <h2>Your Performance</h2>
            </div>
            <span className="insight-label">Activity-based insight</span>
          </div>

          <p className="performance-text">{performanceSummary}</p>
        </section>

        {/* Recommendations */}
        <section className="profile-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">NEXT STEPS</p>
              <h2>Recommended For You</h2>
            </div>
          </div>

          <div className="recommendation-list">
            {recommendations.map((item, index) => (
              <div className="recommendation-card" key={item.title}>
                <span className="recommendation-icon">{item.icon}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <span className="recommendation-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Programmes */}
        <section className="profile-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR COURSES</p>
              <h2>My Learning Programmes</h2>
            </div>
          </div>

          {programs.length === 0 ? (
            <div className="empty-state">
              <span>📚</span>
              <p>No programmes have been assigned to you yet.</p>
            </div>
          ) : (
            <div className="program-grid">
              {programs.map(program => {
                const programResources = program.resources || [];
                const programCompleted = programResources.filter(
                  resource => resource.completed
                ).length;

                const programProgress = programResources.length > 0
                  ? Math.round(
                      (programCompleted / programResources.length) * 100
                    )
                  : 0;

                return (
                  <div className="program-card" key={program._id}>
                    <div className="program-top">
                      <span className="program-icon">📘</span>
                      <span className="program-status">
                        {programProgress === 100 && programResources.length > 0
                          ? 'Completed'
                          : 'In progress'}
                      </span>
                    </div>

                    <h3>{program.name}</h3>

                    <p>
                      {programCompleted} of {programResources.length} resources completed
                    </p>

                    <div className="program-progress-track">
                      <div
                        className="program-progress-fill"
                        style={{ width: `${programProgress}%` }}
                      />
                    </div>

                    <span className="program-percentage">
                      {programProgress}% complete
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      <style jsx>{`
        .profile-page {
          min-height: 100vh;
          background: #f5f7fa;
          padding: 55px 24px 80px;
          color: #172b42;
          font-family: Inter, Arial, sans-serif;
        }

        .profile-container {
          max-width: 1160px;
          margin: 0 auto;
        }

        .profile-header,
        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .profile-header {
          margin-bottom: 30px;
        }

        .eyebrow {
          margin: 0 0 9px;
          color: #3975a8;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.7px;
        }

        .profile-heading h1 {
          margin: 0;
          font-size: clamp(30px, 4vw, 40px);
          letter-spacing: -1.2px;
          font-weight: 750;
        }

        .header-description {
          color: #718096;
          font-size: 14px;
          line-height: 1.7;
          margin: 10px 0 0;
          max-width: 580px;
        }

        .logout-button {
          background: #fff;
          color: #34516d;
          border: 1px solid #dce4ec;
          border-radius: 8px;
          padding: 11px 17px;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          transition: background .2s, border-color .2s;
        }

        .logout-button:hover {
          background: #edf3f8;
          border-color: #b8cbdc;
        }

        .logout-button span {
          margin-left: 8px;
        }

        .welcome-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 27px 30px;
          background: #fff;
          border: 1px solid #e4eaf0;
          border-radius: 14px;
          margin-bottom: 22px;
          box-shadow: 0 4px 15px rgba(25, 47, 70, .035);
        }

        .avatar {
          width: 65px;
          height: 65px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e8f0f7;
          color: #285e8c;
          border-radius: 50%;
          font-size: 27px;
          font-weight: 750;
        }

        .welcome-details {
          flex: 1;
        }

        .welcome-label {
          color: #7b8b9b;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          margin: 0 0 5px;
        }

        .welcome-details h2 {
          font-size: 23px;
          margin: 0 0 5px;
          font-weight: 700;
        }

        .welcome-details > span {
          color: #77889a;
          font-size: 13px;
        }

        .welcome-rank {
          padding-left: 28px;
          border-left: 1px solid #e8edf2;
          text-align: right;
        }

        .welcome-rank span {
          display: block;
          color: #7b8b9b;
          font-size: 10px;
          letter-spacing: 1px;
          font-weight: 700;
        }

        .welcome-rank strong {
          display: block;
          font-size: 27px;
          margin-top: 5px;
          color: #285e8c;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .stat-card {
          background: #fff;
          border: 1px solid #e4eaf0;
          border-radius: 12px;
          padding: 21px;
          min-width: 0;
          box-shadow: 0 4px 15px rgba(25, 47, 70, .025);
        }

        .stat-icon {
          font-size: 21px;
        }

        .stat-card p {
          color: #718096;
          font-size: 12px;
          margin: 14px 0 6px;
        }

        .stat-card h3 {
          font-size: 26px;
          color: #172b42;
          margin: 0;
          font-weight: 750;
        }

        .stat-card h3 small {
          color: #8b99a8;
          font-size: 15px;
          font-weight: 500;
        }

        .profile-section {
          background: #fff;
          border: 1px solid #e4eaf0;
          border-radius: 13px;
          padding: 26px;
          margin-bottom: 20px;
          box-shadow: 0 4px 15px rgba(25, 47, 70, .025);
        }

        .section-heading {
          margin-bottom: 21px;
        }

        .section-heading .eyebrow {
          margin-bottom: 6px;
        }

        .section-heading h2 {
          font-size: 21px;
          margin: 0;
          font-weight: 700;
          letter-spacing: -.3px;
        }

        .progress-percentage {
          font-size: 25px;
          color: #28649b;
        }

        .progress-track,
        .program-progress-track {
          height: 9px;
          background: #eaf0f5;
          border-radius: 20px;
          overflow: hidden;
        }

        .progress-fill,
        .program-progress-fill {
          height: 100%;
          background: #3979ac;
          border-radius: inherit;
          transition: width .4s ease;
        }

        .progress-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 11px;
          color: #7b8b9b;
          font-size: 12px;
        }

        .badge-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 13px;
        }

        .achievement-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border: 1px solid #e8edf2;
          background: #fbfcfd;
          border-radius: 10px;
        }

        .achievement-icon {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          background: #edf3f8;
          border-radius: 10px;
          font-size: 21px;
          flex-shrink: 0;
        }

        .achievement-card h3,
        .recommendation-card h3 {
          margin: 0 0 5px;
          font-size: 14px;
          font-weight: 700;
        }

        .achievement-card p,
        .recommendation-card p {
          color: #7a8999;
          font-size: 12px;
          line-height: 1.6;
          margin: 0;
        }

        .interest-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .interest-tag {
          background: #edf3f8;
          color: #315f85;
          border: 1px solid #dce8f1;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .performance-section {
          background: #f9fbfd;
        }

        .insight-label {
          color: #63816d;
          background: #edf5ef;
          padding: 7px 10px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
        }

        .performance-text {
          color: #586b7e;
          font-size: 14px;
          line-height: 1.9;
          margin: 0;
        }

        .recommendation-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recommendation-card {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 17px;
          border: 1px solid #e8edf2;
          border-radius: 10px;
          background: #fff;
        }

        .recommendation-icon {
          width: 43px;
          height: 43px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          background: #f0f4f8;
          border-radius: 10px;
          font-size: 20px;
        }

        .recommendation-card > div {
          flex: 1;
        }

        .recommendation-number {
          color: #a2afbb;
          font-size: 12px;
          font-weight: 700;
        }

        .program-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .program-card {
          padding: 20px;
          border: 1px solid #e5ebf1;
          border-radius: 11px;
          background: #fbfcfd;
          min-width: 0;
        }

        .program-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 17px;
        }

        .program-icon {
          font-size: 23px;
        }

        .program-status {
          font-size: 10px;
          color: #547a61;
          background: #edf5ef;
          padding: 6px 9px;
          border-radius: 5px;
          font-weight: 650;
        }

        .program-card h3 {
          font-size: 16px;
          margin: 0 0 8px;
          overflow-wrap: anywhere;
        }

        .program-card > p {
          color: #7b8b9b;
          font-size: 12px;
          margin: 0 0 15px;
        }

        .program-progress-track {
          height: 6px;
        }

        .program-progress-fill {
          background: #5d8db5;
        }

        .program-percentage {
          display: block;
          text-align: right;
          color: #718096;
          font-size: 11px;
          margin-top: 8px;
        }

        .empty-state {
          text-align: center;
          padding: 27px 15px;
          border: 1px dashed #dce5ed;
          border-radius: 10px;
          background: #fbfcfd;
        }

        .empty-state span {
          font-size: 25px;
        }

        .empty-state p,
        .muted-text {
          color: #7b8b9b;
          font-size: 13px;
          line-height: 1.7;
        }

        @media (max-width: 850px) {
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .profile-page {
            padding: 32px 15px 55px;
          }

          .profile-header {
            align-items: flex-start;
          }

          .header-description {
            font-size: 13px;
          }

          .logout-button {
            padding: 9px 11px;
            white-space: nowrap;
          }

          .welcome-card {
            padding: 19px;
            gap: 12px;
          }

          .avatar {
            width: 49px;
            height: 49px;
            font-size: 21px;
          }

          .welcome-details h2 {
            font-size: 18px;
          }

          .welcome-rank {
            padding-left: 12px;
          }

          .welcome-rank span {
            font-size: 8px;
          }

          .welcome-rank strong {
            font-size: 22px;
          }

          .stats-grid {
            gap: 10px;
          }

          .stat-card {
            padding: 15px;
          }

          .stat-card h3 {
            font-size: 22px;
          }

          .profile-section {
            padding: 19px;
          }

          .section-heading h2 {
            font-size: 18px;
          }

          .badge-grid,
          .program-grid {
            grid-template-columns: 1fr;
          }

          .insight-label {
            font-size: 9px;
          }
        }

        @media (max-width: 380px) {
          .welcome-rank {
            display: none;
          }

          .profile-heading h1 {
            font-size: 29px;
          }

          .stat-card p {
            font-size: 11px;
          }

          .stat-card h3 {
            font-size: 20px;
          }
        }
      `}</style>
    </main>
  );
}
