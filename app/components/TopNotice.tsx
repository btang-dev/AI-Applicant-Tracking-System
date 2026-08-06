import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { usePuterStore } from "~/lib/puter";

const ADBLOCK_MESSAGE = "Ad blocker detected — this may interfere with sign-in.";
const SIGNED_OUT_MESSAGE = "You have been signed out.";

const detectAdBlock = (): boolean => {
  try {
    const bait = document.createElement("div");
    bait.className = "adsbox";
    bait.style.width = "1px";
    bait.style.height = "1px";
    bait.style.position = "absolute";
    bait.style.left = "-9999px";
    document.body.appendChild(bait);
    const blocked = getComputedStyle(bait).display === "none" || bait.offsetParent === null;
    document.body.removeChild(bait);
    return blocked;
  } catch (e) {
    return false;
  }
};

export default function TopNotice() {
  const el = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState("");

  const auth = usePuterStore((s) => s.auth);

  // detect adblock on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const blocked = detectAdBlock();
    if (blocked) {
      setText(ADBLOCK_MESSAGE);
      setVisible(true);
    }
  }, []);

  // show when user signs out (auth transition true -> false)
  useEffect(() => {
    let prev = auth.isAuthenticated;
    const unsub = usePuterStore.subscribe(
      (s) => s.auth.isAuthenticated,
      (next) => {
        if (prev && !next) {
          setText(SIGNED_OUT_MESSAGE);
          setVisible(true);
        }
        prev = next;
      }
    );

    return () => unsub();
  }, [auth]);

  useEffect(() => {
    if (!el.current) return;
    const node = el.current;
    let hideTimer: number | undefined;

    if (visible) {
      gsap.killTweensOf(node);
      gsap.fromTo(
        node,
        { y: -18, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.45, ease: "power2.out" }
      );
      hideTimer = window.setTimeout(() => setVisible(false), 4200);
    } else {
      gsap.killTweensOf(node);
      gsap.to(node, { y: -10, autoAlpha: 0, duration: 0.36, ease: "power2.in" });
    }

    return () => {
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [visible, text]);

  if (!text) return null;

  return (
    <div ref={el} className="top-notice" aria-live="polite">
      <div className="top-notice-inner">
        <span>{text}</span>
        <button
          className="top-notice-dismiss"
          onClick={() => setVisible(false)}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
