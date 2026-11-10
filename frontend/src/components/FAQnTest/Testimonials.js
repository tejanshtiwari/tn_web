
import React from "react";
import "./Testimonials.css";

const testimonials = [
  {
    name: "Kanika Chauhan",
    rating: 5,
    feedback:
      "TechNeeds has been my go-to platform for staying updated on the latest tech trends. The community is incredibly supportive, and the content is top-notch. It’s a must-visit for anyone passionate about technology!",
  },
  {
    name: "Khushi Sharma",
    rating: 5,
    feedback:
      "The learning experience at TechNeeds is exceptional. The senior mentors offer detailed explanations and practical advice that make complex tech topics easier to grasp. The supportive community is an added bonus.",
  },
  {
    name: "Komal Maurya",
    rating: 5,
    feedback:
      "TechNeeds offers a wealth of information and a supportive community. The senior-led mentorship has been particularly valuable, providing me with expert advice and helping me navigate my tech career path.",
  },
  {
    name: "Chahal Jain",
    rating: 5,
    feedback:
      "Joining TechNeeds has been a rewarding experience. The community is welcoming, and the seniors are genuinely invested in helping you succeed. The courses are comprehensive and cater to all levels of expertise.",
  },
  {
    name: "Mansi Solanki",
    rating: 4,
    feedback:
      "I've been using TechNeeds for several months now, and it's been an excellent resource. The courses are well-structured, and the senior mentors are always ready to help with any questions.",
  },
  {
    name: "Sagar",
    rating: 5,
    feedback:
      "I love how TechNeeds brings together tech enthusiasts from all backgrounds. The guidance from senior members has been instrumental in helping me understand complex topics and apply them effectively.",
  },
  {
    name: "Julie",
    rating: 4,
    feedback:
      "TechNeeds stands out for its dedication to empowering individuals with tech knowledge. The senior mentors are approachable and provide valuable insights that have helped me advance in my tech career.",
  },
  {
    name: "Tanishka Manwal",
    rating: 4,
    feedback:
      "Joining TechNeeds was one of the best decisions I made for my tech career. The seniors offer insights that you can't get from textbooks alone, and the community vibe is both supportive and motivating.",
  },
];

const Testimonials = () => {
  return (
    <section className="testimonials-section" id="Test">
      <div className="testimonials-heading">
        <span className="testimonials-eyebrow">STUDENT EXPERIENCES</span>
        <h2>What Our Students Say</h2>
        <p>
          Real experiences from students who have been part of the
          TechNeeds community.
        </p>
      </div>

      <div className="testimonials">
        {testimonials.map((testimonial, index) => (
          <article className="testimonial-card" key={index}>
            <div className="testimonial-top">
              <div className="testimonial-avatar">
                {testimonial.name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div className="testimonial-person">
                <h3 className="student-name">{testimonial.name}</h3>
                <span className="testimonial-label">
                  TechNeeds Student
                </span>
              </div>
            </div>

            <div
              className="testimonial-stars"
              aria-label={`${testimonial.rating} out of 5 stars`}
            >
              {"★".repeat(testimonial.rating)}
              <span className="empty-stars">
                {"★".repeat(5 - testimonial.rating)}
              </span>
            </div>

            <p className="student-review">
              “{testimonial.feedback}”
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
