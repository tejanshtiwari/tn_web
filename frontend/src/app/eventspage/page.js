
"use client";

import ParticleAnimation from "@/components/heroanimation/hero";

export default function ComingSoon() {
  return (
    <main className="events-coming-soon">
      <ParticleAnimation />

      <div className="events-content">
        <span className="events-label">WHAT'S HAPPENING AT TECHNEEDS</span>

        <div className="events-icon">✦</div>

        <h1>
          Something exciting
          <br />
          is on its way.
        </h1>

        <p>
          We're preparing new events, hackathons, workshops and
          opportunities to help you learn, connect and grow.
        </p>

        <div className="events-divider" />

        <span className="events-footer">
          STAY CURIOUS. STAY CONNECTED.
        </span>
      </div>

      <style jsx>{`
        .events-coming-soon {
          position: relative;
          min-height: 85vh;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          padding: 70px 7%;
          background: #f5f8fc;
          text-align: center;
          color: #142b43;
        }

        .events-content {
          position: relative;
          z-index: 2;
          max-width: 720px;
        }

        .events-label {
          color: #2877a9;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .events-icon {
          margin: 28px 0 12px;
          color: #2877a9;
          font-size: 3rem;
          animation: float 3s ease-in-out infinite;
        }

        h1 {
          margin: 0;
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -2px;
        }

        p {
          max-width: 590px;
          margin: 22px auto 0;
          color: #68788a;
          font-size: 1.08rem;
          line-height: 1.8;
        }

        .events-divider {
          width: 55px;
          height: 3px;
          margin: 32px auto 22px;
          border-radius: 5px;
          background: #2877a9;
        }

        .events-footer {
          color: #8090a0;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 2px;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-9px); }
        }

        @media (max-width: 600px) {
          .events-coming-soon {
            min-height: 75vh;
            padding: 55px 6%;
          }

          h1 {
            letter-spacing: -1px;
          }

          p {
            font-size: 0.96rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .events-icon {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
