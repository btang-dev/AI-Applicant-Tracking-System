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
  const [messagePrefix, setMessagePrefix] = useState<string | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [isError, setIsError] = useState(false);

  const auth = usePuterStore((s) => s.auth);
  const init = usePuterStore((s) => s.init);
  const clearError = usePuterStore((s) => s.clearError);

  const showNotification = (prefix: string | null, body: string, error = false) => {
    setMessagePrefix(prefix);
    setMessageBody(body);
    setIsError(error);
    setVisible(true);
  };

  // detect adblock on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const blocked = detectAdBlock();
    if (blocked) {
      showNotification(null, ADBLOCK_MESSAGE, false);
    }
  }, []);

  // show when user signs out (auth transition true -> false)
  useEffect(() => {
    let prev = auth.isAuthenticated;
    const unsub = usePuterStore.subscribe((s) => {
      const next = s.auth.isAuthenticated;
      if (prev && !next) {
        showNotification(null, SIGNED_OUT_MESSAGE, false);
      }
      prev = next;
    });

    return () => unsub();
  }, [auth]);

  // show when store reports an error
  useEffect(() => {
    let prevErr: string | null = null;
    const unsubErr = usePuterStore.subscribe((s) => {
      const nextErr = s.error;
      if (nextErr && nextErr !== prevErr) {
        const signInPrefix = /^sign in failed\.?/i.test(nextErr)
          ? "Sign in failed."
          : null;

        const body = signInPrefix
          ? " Check the browser console (DevTools) for details or disable any popup/ad blocker."
          : `${nextErr} Check the browser console (DevTools) for details or disable any popup/ad blocker.`;

        showNotification(signInPrefix, body, true);
      }
      prevErr = nextErr;
    });

    return () => unsubErr();
  }, []);

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
      hideTimer = window.setTimeout(() => setVisible(false), 6000);
    } else {
      gsap.killTweensOf(node);
      gsap.to(node, { y: -10, autoAlpha: 0, duration: 0.36, ease: "power2.in" });
    }

    return () => {
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [visible, messagePrefix, messageBody, isError]);

  if (!messagePrefix && !messageBody) return null;

  const onRetry = async () => {
    clearError();
    try {
      init();
      await auth.signIn();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("TopNotice retry sign-in failed", e);
    }
    setVisible(false);
  };

  const onDismiss = () => {
    clearError();
    setVisible(false);
  };

  return (
    <div ref={el} className="top-notice" aria-live="polite">
      <div className="top-notice-inner">
        <span className="top-notice-text">
          {messagePrefix ? <strong>{messagePrefix}</strong> : null}
          {messageBody}
        </span>
        <div className="top-notice-actions">
          {isError ? (
            <>
              <button className="top-notice-retry" onClick={onRetry}>
                Retry
              </button>
              <button className="top-notice-dismiss" onClick={onDismiss} aria-label="Dismiss notification">
                ×
              </button>
            </>
          ) : (
            <button className="top-notice-dismiss" onClick={onDismiss} aria-label="Dismiss notification">
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
