
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./techboard.css";

const Techboard = () => {
  const router = useRouter();

  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const menteeToken = localStorage.getItem("menteeToken");
    const mentorToken = localStorage.getItem("token");

    if (menteeToken) {
      router.replace("/dashboard");
    } else if (mentorToken) {
      router.replace("/mentor");
    } else {
      setShowRoleSelection(true);
      setIsChecking(false);
    }
  }, [router]);

  const handleRoleSelection = (selectedRole) => {
    if (selectedRole === "mentee") {
      router.push("/mentee");
    } else if (selectedRole === "mentor") {
      router.push("/mentor");
    } else if (selectedRole === "new") {
      router.push("/home");
    }
  };

  if (isChecking) {
    return (
      <div className="tech-loading">
        <div className="tech-loader"></div>
        <p>Preparing your TechNeeds experience...</p>
      </div>
    );
  }

  if (!showRoleSelection) return null;

  return (
    <main className="tech-container">
      <section className="techboard">
        <div className="techboard-content">
          <span className="tech-tag">WELCOME TO TECHNEEDS</span>

          <h1 className="heading">
            Your next step in
            <span> technology starts here.</span>
          </h1>

          <p className="subheading">
            Whether you're here to learn, mentor, or explore,
            choose how you'd like to continue.
          </p>

          <div className="role-options">
            <button
              type="button"
              className="role-button"
              onClick={() => handleRoleSelection("mentee")}
            >
              <span className="role-number">01</span>
              <span className="role-details">
                <strong>I'm a Mentee</strong>
                <small>Access your learning programme and resources.</small>
              </span>
              <span className="role-arrow">↗</span>
            </button>

            <button
              type="button"
              className="role-button"
              onClick={() => handleRoleSelection("mentor")}
            >
              <span className="role-number">02</span>
              <span className="role-details">
                <strong>I'm a Mentor</strong>
                <small>Guide learners and manage your programmes.</small>
              </span>
              <span className="role-arrow">↗</span>
            </button>

            <button
              type="button"
              className="role-button"
              onClick={() => handleRoleSelection("new")}
            >
              <span className="role-number">03</span>
              <span className="role-details">
                <strong>I'm New Here</strong>
                <small>Discover TechNeeds and what it offers.</small>
              </span>
              <span className="role-arrow">↗</span>
            </button>
          </div>

          <p className="techboard-footer">
            Learn. Build. Grow. Together.
          </p>
        </div>

        <div className="techboard-side">
          <div className="side-decoration">
            <span className="decoration-line"></span>
            <span className="decoration-dot"></span>
            <span className="decoration-line"></span>
          </div>

          <p className="side-label">YOUR JOURNEY</p>
          <h2>
            Find your place.
            <br />
            Make your impact.
          </h2>
          <p className="side-description">
            A space to connect knowledge, build skills and turn
            curiosity into progress.
          </p>

          <div className="side-index">
            <span>TECHNEEDS</span>
            <span>01 — 03</span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Techboard;
