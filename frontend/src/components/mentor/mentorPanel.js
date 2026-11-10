
"use client";

import { useState, useEffect } from "react";
import {
  mentorLogin,
  addMentee,
  addResource,
  getAllPrograms,
  getProgramMentees,
  getProgramResources,
} from "../../lib/api";

import UnverifiedProjects from "./projects";
import "./mentor.css";

export default function MentorPanel() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState("");

  const [mentees, setMentees] = useState([]);
  const [resources, setResources] = useState([]);

  const [menteeName, setMenteeName] = useState("");
  const [menteeEmail, setMenteeEmail] = useState("");
  const [enrollmentNumber, setEnrollmentNumber] = useState("");

  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceURL, setResourceURL] = useState("");
  const [resourceType, setResourceType] = useState("video");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [revealScores, setRevealScores] = useState(false);
  const [questions, setQuestions] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isAddingMentee, setIsAddingMentee] = useState(false);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [isLoadingProgram, setIsLoadingProgram] = useState(false);

  const getId = (item) => {
    return item?._id || item;
  };

  // Load mentees and resources for the selected programme
  const loadProgramData = async (programId, authToken) => {
    if (!programId || !authToken) return;

    setIsLoadingProgram(true);

    try {
      const [menteesData, resourcesData] = await Promise.all([
        getProgramMentees(programId, authToken),
        getProgramResources(programId, authToken),
      ]);

      setMentees(Array.isArray(menteesData) ? menteesData : []);
      setResources(Array.isArray(resourcesData) ? resourcesData : []);
    } catch (error) {
      console.error("Failed to load programme data:", error);
      alert("Unable to load programme data. Please try again.");
    } finally {
      setIsLoadingProgram(false);
    }
  };

  // Restore mentor session after refresh
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem("token");
      const savedMentorText = localStorage.getItem("mentor");
      const savedProgram = localStorage.getItem("selectedProgram");

      if (!savedToken || !savedMentorText) return;

      try {
        const savedMentor = JSON.parse(savedMentorText);

        setToken(savedToken);
        setLoggedIn(true);

        const allPrograms = await getAllPrograms();

        const mentorPrograms = allPrograms.filter((program) =>
          (savedMentor.programs || []).some(
            (programId) =>
              String(getId(programId)) === String(program._id)
          )
        );

        setPrograms(mentorPrograms);

        const programExists = mentorPrograms.some(
          (program) => String(program._id) === String(savedProgram)
        );

        if (savedProgram && programExists) {
          setSelectedProgram(savedProgram);
          await loadProgramData(savedProgram, savedToken);
        } else {
          localStorage.removeItem("selectedProgram");
        }
      } catch (error) {
        console.error("Could not restore mentor session:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("mentor");
        localStorage.removeItem("selectedProgram");
        setToken("");
        setLoggedIn(false);
      }
    };

    restoreSession();
  }, []);

  // Mentor login
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      alert("Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await mentorLogin(email.trim(), password);
      const { token: newToken, mentor } = result;

      if (!newToken || !mentor) {
        throw new Error("Mentor login response is incomplete.");
      }

      setToken(newToken);
      setLoggedIn(true);

      localStorage.setItem("token", newToken);
      localStorage.setItem("mentor", JSON.stringify(mentor));

      const allPrograms = await getAllPrograms();

      const mentorPrograms = allPrograms.filter((program) =>
        (mentor.programs || []).some(
          (programId) =>
            String(getId(programId)) === String(program._id)
        )
      );

      setPrograms(mentorPrograms);

      if (mentorPrograms.length === 0) {
        alert("No programmes have been assigned to your account yet.");
      }
    } catch (error) {
      alert(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Select a programme
  const handleProgramSelect = async (programId) => {
    setSelectedProgram(programId);
    setMentees([]);
    setResources([]);

    if (!programId) {
      localStorage.removeItem("selectedProgram");
      return;
    }

    localStorage.setItem("selectedProgram", programId);
    await loadProgramData(programId, token);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("mentor");
    localStorage.removeItem("selectedProgram");

    setToken("");
    setLoggedIn(false);
    setPrograms([]);
    setSelectedProgram("");
    setMentees([]);
    setResources([]);
    setEmail("");
    setPassword("");
  };

  // Add a mentee
  const handleAddMentee = async () => {
    if (!selectedProgram) {
      alert("Please select a programme first.");
      return;
    }

    if (!menteeName.trim() || !menteeEmail.trim() || !enrollmentNumber.trim()) {
      alert("Please fill in all mentee details.");
      return;
    }

    setIsAddingMentee(true);

    try {
      await addMentee(token, {
        email: menteeEmail.trim(),
        name: menteeName.trim(),
        enrollmentNumber: enrollmentNumber.trim(),
        programId: selectedProgram,
      });

      alert("Mentee added successfully!");

      setMenteeName("");
      setMenteeEmail("");
      setEnrollmentNumber("");

      await loadProgramData(selectedProgram, token);
    } catch (error) {
      alert(error.message || "Unable to add mentee.");
    } finally {
      setIsAddingMentee(false);
    }
  };

  // Add a new quiz question
  const addQuestion = () => {
    setQuestions((previous) => [
      ...previous,
      {
        questionText: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        marks: 1,
      },
    ]);
  };

  // Update question fields
  const updateQuestion = (index, field, value) => {
    setQuestions((previous) =>
      previous.map((question, i) =>
        i === index ? { ...question, [field]: value } : question
      )
    );
  };

  // Update question options
  const updateOption = (questionIndex, optionIndex, value) => {
    setQuestions((previous) =>
      previous.map((question, i) => {
        if (i !== questionIndex) return question;

        const updatedOptions = [...question.options];
        updatedOptions[optionIndex] = value;

        return { ...question, options: updatedOptions };
      })
    );
  };

  // Add a resource
  const handleAddResource = async () => {
    if (!selectedProgram) {
      alert("Please select a programme first.");
      return;
    }

    if (!resourceTitle.trim()) {
      alert("Please enter a resource title.");
      return;
    }

    if (resourceType !== "quiz" && !resourceURL.trim()) {
      alert("Please enter the resource URL.");
      return;
    }

    if (resourceType === "quiz") {
      if (questions.length === 0) {
        alert("Please add at least one quiz question.");
        return;
      }

      const invalidQuestion = questions.some(
        (question) =>
          !question.questionText.trim() ||
          question.options.some((option) => !option.trim()) ||
          question.marks < 1
      );

      if (invalidQuestion) {
        alert("Please complete all questions, options and marks.");
        return;
      }

      if (
        questions.some(
          (question) =>
            question.correctOptionIndex < 0 ||
            question.correctOptionIndex > 3
        )
      ) {
        alert("Please select a valid correct option for every question.");
        return;
      }

      if (!startTime || !endTime || new Date(endTime) <= new Date(startTime)) {
        alert("Please select a valid quiz start and end time.");
        return;
      }
    }

    setIsAddingResource(true);

    try {
      let resourceData = {
        title: resourceTitle.trim(),
        type: resourceType,
        program: selectedProgram,
      };

      const isQuiz = resourceType === "quiz";

      if (isQuiz) {
        const maxScore = questions.reduce(
          (sum, question) => sum + Number(question.marks || 1),
          0
        );

        resourceData = {
          ...resourceData,
          questions,
          startTime,
          endTime,
          revealScores,
          maxScore,
        };
      } else {
        resourceData.url = resourceURL.trim();
      }

      await addResource(token, resourceData, isQuiz);

      alert("Resource added successfully!");

      setResourceTitle("");
      setResourceURL("");
      setResourceType("video");
      setQuestions([]);
      setStartTime("");
      setEndTime("");
      setRevealScores(false);

      await loadProgramData(selectedProgram, token);
    } catch (error) {
      alert(error.message || "Unable to add resource.");
    } finally {
      setIsAddingResource(false);
    }
  };

  // Login screen
  if (!loggedIn) {
    return (
      <div className="mentor-panel">
        <div className="login-container">
          <div className="login-card">
            <p className="mentor-eyebrow">TECHNEEDS • MENTOR PORTAL</p>

            <h1 className="login-title">Welcome back</h1>

            <p className="login-subtitle">
              Sign in to manage your programmes and guide your mentees.
            </p>

            <label className="mentor-label">Email address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-field"
            />

            <label className="mentor-label">Password</label>

            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-field"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((previous) => !previous)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="login-button"
            >
              {isLoading ? "Signing in..." : "Sign in to dashboard"}
            </button>

            <p className="login-footnote">
              Access is available to registered TechNeeds mentors.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Mentor dashboard
  return (
    <div className="mentor-panel">
      <header className="mentor-dashboard-header">
        <div>
          <p className="mentor-eyebrow">TECHNEEDS • MENTOR PORTAL</p>
          <h1>Mentor Dashboard</h1>
          <p>Manage your programmes, mentees and learning resources.</p>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          Log out
        </button>
      </header>

      {/* Programme selection */}
      <section className="section">
        <div className="mentor-section-heading">
          <div>
            <p className="mentor-section-kicker">YOUR WORKSPACE</p>
            <h2>Choose a programme</h2>
            <p>Select a programme to view and manage its details.</p>
          </div>
        </div>

        <select
          value={selectedProgram}
          onChange={(event) => handleProgramSelect(event.target.value)}
        >
          <option value="">Select your programme</option>

          {programs.map((program) => (
            <option key={program._id} value={program._id}>
              {program.name}
            </option>
          ))}
        </select>

        {programs.length === 0 && (
          <p>No programmes have been assigned to your account.</p>
        )}
      </section>

      {selectedProgram && (
        <>
          {/* Quick overview */}
          <div className="mentor-overview">
            <div className="mentor-overview-card">
              <span className="mentor-overview-icon">👥</span>
              <div>
                <p>Enrolled mentees</p>
                <h3>{mentees.length}</h3>
              </div>
            </div>

            <div className="mentor-overview-card">
              <span className="mentor-overview-icon">📚</span>
              <div>
                <p>Learning resources</p>
                <h3>{resources.length}</h3>
              </div>
            </div>

            <div className="mentor-overview-card">
              <span className="mentor-overview-icon">🧩</span>
              <div>
                <p>Quiz resources</p>
                <h3>
                  {resources.filter((resource) => resource.type === "quiz").length}
                </h3>
              </div>
            </div>
          </div>

          {isLoadingProgram && (
            <p className="mentor-loading">Loading programme information...</p>
          )}

          {/* Add mentee */}
          <section className="section">
            <p className="mentor-section-kicker">BUILD YOUR COMMUNITY</p>
            <h2>Add a mentee</h2>
            <p>
              Enter the mentee's details to enrol them in this programme.
            </p>

            <div className="mentor-form-grid">
              <input
                type="text"
                placeholder="Mentee full name"
                value={menteeName}
                onChange={(event) => setMenteeName(event.target.value)}
              />

              <input
                type="email"
                placeholder="Mentee email address"
                value={menteeEmail}
                onChange={(event) => setMenteeEmail(event.target.value)}
              />

              <input
                type="text"
                placeholder="Enrollment number"
                value={enrollmentNumber}
                onChange={(event) => setEnrollmentNumber(event.target.value)}
              />
            </div>

            <button onClick={handleAddMentee} disabled={isAddingMentee}>
              {isAddingMentee ? "Adding mentee..." : "+ Add mentee"}
            </button>
          </section>

          {/* Add resource */}
          <section className="section">
            <p className="mentor-section-kicker">LEARNING MATERIAL</p>
            <h2>Create a resource</h2>
            <p>
              Add a video, quiz or project for your selected programme.
            </p>

            <label className="mentor-label">Resource title</label>
            <input
              type="text"
              placeholder="e.g. Introduction to React"
              value={resourceTitle}
              onChange={(event) => setResourceTitle(event.target.value)}
            />

            <label className="mentor-label">Resource type</label>
            <select
              value={resourceType}
              onChange={(event) => setResourceType(event.target.value)}
            >
              <option value="video">Video</option>
              <option value="quiz">Quiz</option>
              <option value="project">Project</option>
            </select>

            {resourceType !== "quiz" && (
              <>
                <label className="mentor-label">Resource URL</label>
                <input
                  type="url"
                  placeholder="Paste video or project instructions URL"
                  value={resourceURL}
                  onChange={(event) => setResourceURL(event.target.value)}
                />
              </>
            )}

            {resourceType === "quiz" && (
              <div className="quiz-section">
                <h3>Quiz settings</h3>

                <div className="mentor-form-grid">
                  <div>
                    <label className="mentor-label">Start time</label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mentor-label">End time</label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                    />
                  </div>
                </div>

                <label className="mentor-checkbox-label">
                  <input
                    type="checkbox"
                    checked={revealScores}
                    onChange={(event) => setRevealScores(event.target.checked)}
                  />
                  Reveal scores to mentees
                </label>

                <div className="mentor-questions-heading">
                  <h3>Questions</h3>
                  <span>{questions.length} added</span>
                </div>

                {questions.map((question, index) => (
                  <div key={index} className="question-block">
                    <h4>Question {index + 1}</h4>

                    <input
                      type="text"
                      placeholder="Enter your question"
                      value={question.questionText}
                      onChange={(event) =>
                        updateQuestion(index, "questionText", event.target.value)
                      }
                    />

                    {question.options.map((option, optionIndex) => (
                      <input
                        key={optionIndex}
                        type="text"
                        placeholder={`Option ${optionIndex + 1}`}
                        value={option}
                        onChange={(event) =>
                          updateOption(index, optionIndex, event.target.value)
                        }
                      />
                    ))}

                    <div className="mentor-form-grid">
                      <div>
                        <label className="mentor-label">
                          Correct option (0–3)
                        </label>
                        <select
                          value={question.correctOptionIndex}
                          onChange={(event) =>
                            updateQuestion(
                              index,
                              "correctOptionIndex",
                              Number(event.target.value)
                            )
                          }
                        >
                          <option value={0}>Option 1</option>
                          <option value={1}>Option 2</option>
                          <option value={2}>Option 3</option>
                          <option value={3}>Option 4</option>
                        </select>
                      </div>

                      <div>
                        <label className="mentor-label">Marks</label>
                        <input
                          type="number"
                          min="1"
                          value={question.marks}
                          onChange={(event) =>
                            updateQuestion(
                              index,
                              "marks",
                              Number(event.target.value)
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button type="button" onClick={addQuestion}>
                  + Add question
                </button>
              </div>
            )}

            <button
              onClick={handleAddResource}
              disabled={isAddingResource}
            >
              {isAddingResource ? "Creating resource..." : "Create resource"}
            </button>
          </section>

          {/* Mentee list */}
          <section className="section">
            <p className="mentor-section-kicker">YOUR COMMUNITY</p>
            <h2>Enrolled mentees</h2>

            {mentees.length > 0 ? (
              <div className="mentor-table-wrapper">
                <table className="responstable">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Enrollment number</th>
                      <th>Password</th>
                    </tr>
                  </thead>

                  <tbody>
                    {mentees.map((mentee) => (
                      <tr key={mentee._id}>
                        <td>{mentee.name}</td>
                        <td>{mentee.enrollmentNumber}</td>
                        <td>{mentee.password || "Not available"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No mentees have been added to this programme yet.</p>
            )}
          </section>

          {/* Resource list */}
          <section className="section">
            <p className="mentor-section-kicker">PROGRAMME CONTENT</p>
            <h2>Learning resources</h2>

            {resources.length > 0 ? (
              <div className="mentor-table-wrapper">
                <table className="responstable">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>URL</th>
                    </tr>
                  </thead>

                  <tbody>
                    {resources.map((resource) => (
                      <tr key={resource._id}>
                        <td>{resource.title}</td>
                        <td>
                          <span className="mentor-type-label">
                            {resource.type}
                          </span>
                        </td>
                        <td>
                          {resource.url ? (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View resource
                            </a>
                          ) : (
                            "Not applicable"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No resources have been added to this programme yet.</p>
            )}
          </section>
        </>
      )}

      {/* Existing project review component */}
      <UnverifiedProjects />
    </div>
  );
}
