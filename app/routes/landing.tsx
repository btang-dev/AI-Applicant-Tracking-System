import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { SITE_NAME } from "~/lib/brand";
import { usePuterStore } from "~/lib/puter";
import type { Route } from "./+types/landing";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const benefits = [
  {
    number: "01",
    title: "Match the role",
    description:
      "Compare your resume with the job you want and focus on the experience that matters most.",
  },
  {
    number: "02",
    title: "Strengthen ATS signals",
    description:
      "Find missing skills, vague language, and formatting gaps before they cost you an interview.",
  },
  {
    number: "03",
    title: "Apply with clarity",
    description:
      "Turn detailed feedback into a practical shortlist of improvements you can make right away.",
  },
];

const steps = [
  ["Upload", "Add your resume and the job description you are targeting."],
  ["Understand", "See a clear ATS score with focused feedback by category."],
  ["Improve", "Refine your resume, track each version, and apply with confidence."],
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: `${SITE_NAME} | Resume clarity for every role` },
    {
      name: "description",
      content:
        "Understand how your resume fits the role, improve its ATS signals, and take the next step with confidence.",
    },
  ];
}

const getSafeNextPath = (search: string) => {
  const requestedPath = new URLSearchParams(search).get("next");

  return requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
    ? requestedPath
    : "/home";
};

export default function Landing() {
  const page = useRef<HTMLElement>(null);
  const { auth, error, isLoading, puterReady, init, clearError } = usePuterStore();
  const location = useLocation();
  const navigate = useNavigate();
  const nextPath = getSafeNextPath(location.search);

  useEffect(() => {
    if (!isLoading && auth.isAuthenticated) {
      navigate(nextPath, { replace: true });
    }
  }, [auth.isAuthenticated, isLoading, navigate, nextPath]);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from("[data-hero-nav]", { y: -18, autoAlpha: 0, duration: 0.7 })
          .from(
            "[data-hero-copy] > *",
            { y: 28, autoAlpha: 0, duration: 0.8, stagger: 0.1 },
            "-=0.35",
          )
          .from(
            "[data-hero-visual]",
            { x: 30, scale: 0.97, autoAlpha: 0, duration: 1 },
            "-=0.75",
          )
          .from(
            "[data-proof-item]",
            { y: 14, autoAlpha: 0, duration: 0.55, stagger: 0.08 },
            "-=0.5",
          );

        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((section) => {
          gsap.from(section, {
            y: 42,
            autoAlpha: 0,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "clamp(top 82%)",
              once: true,
            },
          });
        });

        gsap.from("[data-benefit-card]", {
          y: 34,
          autoAlpha: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "[data-benefits-grid]",
            start: "clamp(top 78%)",
            once: true,
          },
        });
      });

      return () => media.revert();
    },
    { scope: page },
  );

  const handleSignIn = async () => {
    await auth.signIn();
  };

  return (
    <main ref={page} className="landing-page !pt-0">
      <header className="landing-header" data-hero-nav>
        <a className="landing-brand" href="#top" aria-label={`${SITE_NAME} home`}>
          <img
            className="landing-brand-mark"
            src="/favicon.svg?v=2"
            alt=""
            aria-hidden="true"
          />
          <span>
            <strong>{SITE_NAME}</strong>
            <small>Illuminate your fit.</small>
          </span>
        </a>

        <nav className="landing-nav" aria-label="Primary navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#why-rolelume">Why RoleLume</a>
          <button
            type="button"
            className="landing-sign-in"
            onClick={() => void handleSignIn()}
            disabled={isLoading || !puterReady}
          >
            {isLoading ? "Checking…" : "Sign in"}
            <span aria-hidden="true">↗</span>
          </button>
        </nav>
      </header>

      {error ? (
        <div className="landing-auth-alert" role="alert">
          <div className="landing-auth-error">
            <strong>Sign in failed</strong>
            <div className="landing-auth-error-text">{error}</div>
          </div>
          <div className="landing-auth-actions">
            <button
              type="button"
              className="landing-text-link"
              onClick={async () => {
                clearError();
                try {
                  init();
                  await auth.signIn();
                } catch (e) {
                  // allow store to record the error; also log for DevTools
                  // eslint-disable-next-line no-console
                  console.error('[Landing] Retry sign-in failed', e);
                }
              }}
              disabled={isLoading}
            >
              Retry sign in
            </button>
            <button
              type="button"
              className="landing-text-link"
              onClick={() => clearError()}
            >
              Dismiss
            </button>
          </div>
          <small className="landing-auth-hint">
            Check the browser console (DevTools) for details or disable any popup
            blocker.
          </small>
        </div>
      ) : null}

      <section id="top" className="landing-hero" aria-labelledby="hero-title">
        <div className="landing-hero-copy" data-hero-copy>
          <p className="landing-eyebrow">
            <span aria-hidden="true" />
            Your next role, made clearer
          </p>
          <h1 id="hero-title">
            Make your resume <em>impossible to overlook.</em>
          </h1>
          <p className="landing-intro">
            See how your resume performs against the role before you apply.
            RoleLume turns ATS signals into clear, practical next steps.
          </p>
          <div className="landing-hero-actions">
            <button
              type="button"
              className="landing-primary-cta"
              onClick={() => void handleSignIn()}
              disabled={isLoading || !puterReady}
            >
              {isLoading ? "Checking your account…" : "Check my resume"}
              <span aria-hidden="true">→</span>
            </button>
            <a className="landing-text-link" href="#how-it-works">
              See how it works
            </a>
          </div>
        </div>

        <div className="landing-visual" data-hero-visual>
          <div className="landing-image-frame">
            <img
              src="/images/rolelume-hero.png"
              alt="A confident job seeker holding a resume portfolio"
              fetchPriority="high"
            />
          </div>
          <div className="landing-score-card" aria-label="Example role match score">
            <span>Role match</span>
            <strong>84%</strong>
            <div aria-hidden="true">
              <i />
            </div>
            <small>Strong foundation</small>
          </div>
          <p className="landing-visual-note">
            <span aria-hidden="true">✓</span>
            Clear feedback. No guesswork.
          </p>
        </div>

        <div className="landing-proof-strip" aria-label="RoleLume workflow">
          {["Scan the fit", "Find the gaps", "Strengthen your story"].map(
            (item, index) => (
              <div key={item} data-proof-item>
                <span>0{index + 1}</span>
                <p>{item}</p>
              </div>
            ),
          )}
        </div>
      </section>

      <section id="why-rolelume" className="landing-benefits">
        <div className="landing-section-heading" data-reveal>
          <p className="landing-kicker">Built for better applications</p>
          <h2>A stronger resume, one clear step at a time.</h2>
          <p>
            Focus your effort where it counts instead of rewriting blindly for
            every application.
          </p>
        </div>

        <div className="landing-benefits-grid" data-benefits-grid>
          {benefits.map((benefit) => (
            <article key={benefit.number} data-benefit-card>
              <span>{benefit.number}</span>
              <div className="landing-benefit-icon" aria-hidden="true">
                {benefit.number === "01" ? "↗" : benefit.number === "02" ? "◎" : "✓"}
              </div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="landing-process" data-reveal>
        <div className="landing-process-intro">
          <p className="landing-kicker">How it works</p>
          <h2>From upload to a sharper application.</h2>
          <p>
            RoleLume keeps the process simple so you can spend less time
            second-guessing and more time applying.
          </p>
        </div>
        <ol className="landing-steps">
          {steps.map(([title, description], index) => (
            <li key={title}>
              <span>0{index + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-final-cta" data-reveal>
        <p className="landing-kicker">Ready when you are</p>
        <h2>Give your next application a brighter start.</h2>
        <button
          type="button"
          className="landing-primary-cta landing-primary-cta-light"
          onClick={() => void handleSignIn()}
          disabled={isLoading || !puterReady}
        >
          Sign in and upload your resume
          <span aria-hidden="true">→</span>
        </button>
      </section>

      <footer className="landing-footer">
        <a className="landing-brand" href="#top">
          <img
            className="landing-brand-mark"
            src="/favicon.svg?v=2"
            alt=""
            aria-hidden="true"
          />
          <strong>{SITE_NAME}</strong>
        </a>
        <p>Clarity for every resume. Confidence for every role.</p>
      </footer>
    </main>
  );
}
