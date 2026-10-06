"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  IconBrandGoogle,
  IconBrandDiscord,
  IconBrandApple,
  IconMail,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { BrandMark } from "../brand-mark";
import { LoginScene } from "./login-scene";
import { LoginHeading } from "./login-heading";
import { LoginLanguage } from "./login-language";
import { DISCORD_INVITE } from "../site-links";
import styles from "./login.module.css";

const colors = ["#f3e6d0", "#f4b23e", "#d94a33", "#b18bd4", "#2c4a68"];
const providers = [
  { name: "Google", Icon: IconBrandGoogle },
  { name: "Discord", Icon: IconBrandDiscord },
  { name: "Apple", Icon: IconBrandApple },
  { name: "Email", Icon: IconMail },
];

export function LoginPage() {
  const [desktop, setDesktop] = useState(false);
  const [copied, setCopied] = useState("");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [lastProvider, setLastProvider] = useState("");
  const reduced = useReducedMotion();
  const [emailMode, setEmailMode] = useState(false);
  const [signup, setSignup] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const media = matchMedia("(min-width: 768px)");
    const update = () => setDesktop(media.matches);
    update();
    try {
      setLastProvider(localStorage.getItem("rawan-login-method") ?? "");
    } catch {
      /* Storage may be unavailable in private browser contexts. */
    }
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
  const unavailable = (name: string) =>
    setNotice(`${name} is not available yet.`);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(
      recovery
        ? "Password recovery is not connected yet. No email was sent."
        : signup
          ? "Account registration is not connected yet."
          : "Email sign-in will be connected to your Rawan account in the next step.",
    );
  };
  return (
    <main className={styles.page}>
      <div className={styles.art}>
        <div className={styles.colorShape} />
        {desktop && <LoginScene />}
        <div className={styles.palette} aria-label="Artwork color palette">
          {colors.map((swatch) => (
            <button
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
            </button>
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
          <LoginHeading key={signup ? "signup" : "login"} signup={signup} />
          <AnimatePresence mode="wait" initial={false}>
            {!emailMode ? (
              <motion.div
                key="providers"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: reduced ? 0 : 0.18 }}
              >
                <div className={styles.providers}>
                  {[...providers]
                    .sort(
                      (a, b) =>
                        Number(b.name === lastProvider) -
                        Number(a.name === lastProvider),
                    )
                    .map(({ name, Icon }) => (
                      <div key={name}>
                        <button
                          className={`${styles.provider} ${name === lastProvider ? styles.lastProvider : ""}`}
                          onClick={() => {
                            setNotice("");
                            if (name === "Email") {
                              setEmailMode(true);
                              setRecovery(false);
                              setShowPassword(false);
                              setLastProvider(name);
                              try {
                                localStorage.setItem(
                                  "rawan-login-method",
                                  name,
                                );
                              } catch {
                                /* Optional preference only. */
                              }
                            } else unavailable(`${name} sign-in`);
                          }}
                        >
                          <Icon size={17} stroke={1.7} aria-hidden="true" />
                          Continue with {name}
                        </button>
                        {name === lastProvider && (
                          <p className={styles.lastHint}>
                            Last selected method: {name}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
                <p className={styles.signup}>
                  {signup ? "Already have an account?" : "New to Rawan?"}{" "}
                  <button
                    onClick={() => {
                      setSignup(!signup);
                      setNotice("");
                    }}
                  >
                    {signup ? "Log in" : "Sign up"}
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={recovery ? "recovery" : signup ? "signup" : "email"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: reduced ? 0 : 0.18 }}
              >
                <form className={styles.form} onSubmit={submit}>
                  <label className={styles.srOnly} htmlFor="login-email">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    maxLength={254}
                    required
                  />
                  {!recovery && (
                    <div className={styles.password}>
                      <label className={styles.srOnly} htmlFor="login-password">
                        Password
                      </label>
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autoComplete={
                          signup ? "new-password" : "current-password"
                        }
                        maxLength={128}
                        required
                      />
                      <button
                        type="button"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <IconEyeOff size={16} />
                        ) : (
                          <IconEye size={16} />
                        )}
                      </button>
                    </div>
                  )}
                  <button className={styles.submit} type="submit">
                    {recovery
                      ? "Send Reset Email"
                      : signup
                        ? "Create Account"
                        : "Sign In"}
                  </button>
                </form>
                {!signup && !recovery && (
                  <button
                    className={styles.forgot}
                    onClick={() => {
                      setRecovery(true);
                      setNotice("");
                    }}
                  >
                    Forgot your password?
                  </button>
                )}
                {recovery ? (
                  <button
                    className={styles.forgot}
                    onClick={() => {
                      setRecovery(false);
                      setNotice("");
                    }}
                  >
                    Back to sign in
                  </button>
                ) : (
                  <p className={styles.signup}>
                    {signup
                      ? "Already have an account?"
                      : "Don’t have an account?"}{" "}
                    <button
                      onClick={() => {
                        setSignup(!signup);
                        setNotice("");
                      }}
                    >
                      {signup ? "Log in" : "Sign up"}
                    </button>
                  </p>
                )}
                <button
                  className={styles.back}
                  onClick={() => {
                    setEmailMode(false);
                    setRecovery(false);
                    setNotice("");
                  }}
                >
                  Back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
