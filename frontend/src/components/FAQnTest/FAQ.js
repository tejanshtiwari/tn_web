
"use client";

import React, { useState } from "react";
import "./FAQ.css";

const faqs = [
  {
    question: "What is TechNeeds?",
    answer:
      "TechNeeds is a platform that provides technology solutions and support for various needs.",
  },
  {
    question: "How can I contact support?",
    answer:
      "You can contact support via our official WhatsApp group or email us at techneedsigdtuw@gmail.com.",
  },
  {
    question: "What services do you offer?",
    answer:
      "We offer a range of services including hackathon, tech introductory sessions, mentorship programs, tech engagement competition and speaker sessions.",
  },
  {
    question: "Where is TechNeeds located?",
    answer:
      "TechNeeds is based in the heart of IGDTUW founded in 2023.",
  },
  {
    question: "Can I track my mentorship journey?",
    answer:
      "Yes, you can track your journey through our online portal.",
  },
];

export default function Faq() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex((currentIndex) =>
      currentIndex === index ? null : index
    );
  };

  return (
    <section className="faq-container">
      <div className="faq-heading">
        <span className="faq-eyebrow">GOT QUESTIONS?</span>
        <h2 className="faq-title">Frequently Asked Questions</h2>
        <p className="faq-subtitle">
          Everything you need to know about TechNeeds.
        </p>
      </div>

      <div className="faq-list">
        {faqs.map((faq, index) => {
          const isActive = activeIndex === index;

          return (
            <div
              key={index}
              className={`faq-item ${isActive ? "active" : ""}`}
            >
              <button
                type="button"
                className="faq-question"
                onClick={() => toggleFAQ(index)}
                aria-expanded={isActive}
                aria-controls={`faq-answer-${index}`}
              >
                <span>{faq.question}</span>
                <span className="faq-icon" aria-hidden="true">
                  {isActive ? "−" : "+"}
                </span>
              </button>

              {isActive && (
                <div
                  className="faq-answer"
                  id={`faq-answer-${index}`}
                >
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
