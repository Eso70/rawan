"use client";
import { Button } from "../../../components/ui/controls";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { IconBrandGoogle, IconMail } from "@tabler/icons-react";
import { BrandMark } from "../../../components/shared/brand-mark";
import { LoginScene } from "./login-scene";
import { LoginHeading } from "./login-heading";
import { LoginLanguage } from "./login-language";
import { DISCORD_INVITE } from "../../../components/shared/site-links";
import { useGooglePopup } from "../hooks/use-google-popup";
import { EmailSignin } from "./email-signin";
import styles from "./login.module.css";

const colors = ["#f3e6d0", "#f4b23e", "#d94a33", "#b18bd4", "#2c4a68"];
export function LoginPage({ error = "" }: { error?: string }) {
  const [desktop, setDesktop] = useState(false);
  const [copied, setCopied] = useState("");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const reduced = useReducedMotion();
  const [signup, setSignup] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const [emailChallenge, setEmailChallenge] = useState(false);
  const [notice, setNotice] = useState(error);
  const { pending, start, cancel } = useGooglePopup(setNotice);
  useEffect(() => {
    const media = matchMedia("(min-width: 768px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
      clearTimeout(copyTimer.current);
    };
  }, []);
  const copyColor = async (swatch: string) => {
    try {
      await navigator.clipboard.writeText(swatch);
      setCopied(swatch);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(""), 1600);
    } catch {
      setNotice(`Color: ${swatch}`);
    }
  };
  return (
    <main className={styles.page}>
      <div className={styles.art}>
        <div className={styles.colorShape} />
        {desktop && <LoginScene />}
        <div className={styles.palette} aria-label="Artwork color palette">
          {colors.map((swatch) => (
            <Button
              key={swatch}
              style={{ background: swatch }}
              aria-label={`Copy ${swatch} color`}
              onClick={() => {
                void copyColor(swatch);
              }}
            >
              {copied === swatch && (
                <span className={styles.copyTip} role="status">
                  COPIED!
                </span>
              )}
            </Button>
          ))}
        </div>
        <a
          className={styles.credit}
          href="https://sketchfab.com/3d-models/dragonspire-library-monk-daeea1bd4bfc4cb6bd7142a5711458b2"
          target="_blank"
          rel="noreferrer"
          title="Dragonspire Library Monk by Miniature Collectors Club · CC BY 4.0"
        >
          Miniature Collectors Club
        </a>
        <span className={styles.year}>2026</span>
      </div>
      <section className={styles.panel} aria-labelledby="login-title">
        <a href="/" className={styles.logo} aria-label="Rawan home">
          <BrandMark priority />
        </a>
        <motion.div
          layout
          className={styles.content}
          transition={{ duration: reduced ? 0 : 0.3 }}
        >
          {!emailChallenge && (
            <LoginHeading key={signup ? "signup" : "login"} signup={signup} />
          )}
          {emailMode ? (
            <EmailSignin
              signup={signup}
              onSwitch={() => setSignup(!signup)}
              onBack={() => {
                setEmailMode(false);
                setEmailChallenge(false);
              }}
              onChallengeChange={setEmailChallenge}
            />
          ) : (
            <>
              <div className={styles.providers}>
                <Button
                  className={styles.provider}
                  disabled={pending}
                  onClick={start}
                >
                  <IconBrandGoogle size={17} aria-hidden="true" />
                  Continue with Google
                </Button>
                <Button
                  className={styles.provider}
                  disabled={pending}
                  onClick={() => {
                    setNotice("");
                    setEmailMode(true);
                  }}
                >
                  <IconMail size={17} aria-hidden="true" />
                  Continue with Email
                </Button>
              </div>
              {pending && (
                <p className={styles.signup}>
                  <Button onClick={cancel}>Cancel sign-in</Button>
                </p>
              )}
              <p className={styles.signup}>
                {signup ? "Already have an account?" : "New to Rawan?"}{" "}
                <Button onClick={() => setSignup(!signup)}>
                  {signup ? "Log in" : "Sign up"}
                </Button>
              </p>
            </>
          )}
          {notice && (
            <p className={styles.notice} role="status">
              {notice}
            </p>
          )}
        </motion.div>
        <footer className={styles.footer}>
          <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
            Help
          </a>
          <span>|</span>
          <a href="/terms">Terms</a>
          <span>|</span>
          <a href="/privacy">Privacy</a>
          <span>|</span>
          <LoginLanguage />
        </footer>
      </section>
    </main>
  );
}
