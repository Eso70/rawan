"use client";
import {
  Button,
  IconButton,
  TextInput,
  FieldError,
} from "../../../components/ui/controls";

import { useEffect, useRef, useState } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import {
  assessSignupPassword,
  type PasswordAssessment,
} from "@rawan/types/password";
import styles from "./login.module.css";
import { safeReturnTo } from "../../onboarding/routing";

type Challenge = {
  verificationId: string;
  expiresIn: number;
  resendAfter: number;
};
export function EmailSignin({
  signup,
  onSwitch,
  onBack,
  onChallengeChange,
}: {
  signup: boolean;
  onSwitch: () => void;
  onBack: () => void;
  onChallengeChange: (active: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [assessment, setAssessment] = useState<PasswordAssessment | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const busy = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    setAssessment(null);
    if (!signup || !password || challenge) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void assessSignupPassword(password, email)
        .then((result) => {
          if (!cancelled) setAssessment(result);
        })
        .catch(() => {
          // Submission retries the check; never bypass validation on a loading error.
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [signup, password, email, challenge]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!challenge) return;
    const tick = () =>
      setRemaining(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [challenge, resendAt]);
  const request = async (action: string, values: Record<string, string>) => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setNotice("");
    try {
      if (action === "signup") {
        const result = await assessSignupPassword(
          values.password,
          values.email,
        );
        if (!alive.current) return;
        setAssessment(result);
        if (result.error) return;
      }
      const response = await fetch("/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...values }),
      });
      const result = await response.json();
      if (!alive.current) return;
      if (!response.ok) {
        setNotice(result.message ?? "Please try again.");
        return;
      }
      if (result.signedIn) {
        setPassword("");
        try {
          localStorage.setItem("rawan-login-method", "Email");
        } catch {
          /* Optional preference. */
        }
        window.location.assign(
          safeReturnTo(
            new URLSearchParams(window.location.search).get("returnTo"),
          ),
        );
        return;
      }
      setChallenge(result);
      setCode("");
      setPassword("");
      setResendAt(Date.now() + result.resendAfter * 1000);
      onChallengeChange(true);
    } catch {
      if (alive.current) setNotice("Could not connect. Please try again.");
    } finally {
      busy.current = false;
      if (alive.current) setPending(false);
    }
  };
  const back = () => {
    if (pending) return;
    if (challenge) {
      setChallenge(null);
      setCode("");
      onChallengeChange(false);
    } else onBack();
  };
  if (challenge)
    return (
      <>
        <h2 id="login-title" className={styles.verificationTitle}>
          Check your email
        </h2>
        <p className={styles.verificationSubtitle}>
          Check <strong>{email}</strong> for your code.
        </p>
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            void request("verify", {
              verificationId: challenge.verificationId,
              code,
            });
          }}
        >
          <label className={styles.srOnly} htmlFor="email-code">
            Verification code
          </label>
          <TextInput
            id="email-code"
            autoFocus
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]{8}"
            maxLength={8}
            placeholder="Enter code"
            value={code}
            disabled={pending}
            className={`${styles.input} ${styles.codeInput}`}
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, "").slice(0, 8);
              setCode(value);
              if (value.length === 8)
                void request("verify", {
                  verificationId: challenge.verificationId,
                  code: value,
                });
            }}
            required
          />
          <Button
            type="submit"
            loading={pending}
            className={styles.submit}
            disabled={pending || code.length !== 8}
          >
            {pending ? "Checking…" : "Verify email"}
          </Button>
        </form>
        <Button
          className={styles.resend}
          disabled={pending || remaining > 0}
          onClick={() => {
            void request("resend", {
              verificationId: challenge.verificationId,
            });
          }}
        >
          {remaining > 0 ? `Resend in ${remaining}s` : "Resend code"}
        </Button>
        {notice && (
          <FieldError id="email-error" className={styles.notice}>
            {notice}
          </FieldError>
        )}
        <Button className={styles.back} disabled={pending} onClick={back}>
          Back
        </Button>
      </>
    );
  return (
    <>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void request(signup ? "signup" : "login", { email, password });
        }}
      >
        <label className={styles.srOnly} htmlFor="signin-email">
          Email address
        </label>
        <TextInput
          id="signin-email"
          className={styles.input}
          name="email"
          type="email"
          autoFocus
          autoCapitalize="none"
          spellCheck={false}
          autoComplete="email"
          placeholder="Enter your email"
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={pending}
          required
        />
        <div className={styles.password}>
          <label className={styles.srOnly} htmlFor="signin-password">
            Password
          </label>
          <TextInput
            id="signin-password"
            className={styles.input}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={signup ? "new-password" : "current-password"}
            placeholder="Enter your password"
            minLength={signup ? 15 : 1}
            maxLength={128}
            value={password}
            spellCheck={false}
            autoCapitalize="none"
            aria-invalid={signup && Boolean(assessment?.error)}
            aria-describedby={
              signup && assessment ? "password-feedback" : undefined
            }
            onChange={(event) => setPassword(event.target.value)}
            disabled={pending}
            required
          />
          <IconButton
            className={styles.passwordToggle}
            type="button"
            label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            aria-controls="signin-password"
            disabled={pending}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <IconEyeOff size={19} aria-hidden="true" />
            ) : (
              <IconEye size={19} aria-hidden="true" />
            )}
          </IconButton>
        </div>
        {signup && assessment && (
          <div
            id="password-feedback"
            className={styles.passwordFeedback}
            aria-live="polite"
          >
            <div className={styles.passwordMeter} aria-hidden="true">
              <span
                style={{
                  width: `${assessment.error ? Math.max(1, assessment.score) * 25 : assessment.score * 25}%`,
                }}
                data-valid={!assessment.error}
              />
            </div>
            <span>
              {assessment.error ??
                (assessment.score === 4 ? "Strong password" : "Good password")}
            </span>
          </div>
        )}
        <Button
          loading={pending}
          className={styles.submit}
          type="submit"
          disabled={pending}
        >
          {pending
            ? signup
              ? "Sending code…"
              : "Signing in…"
            : signup
              ? "Create account"
              : "Log in"}
        </Button>
      </form>
      <p className={styles.signup}>
        {signup ? "Already have an account?" : "New to Rawan?"}{" "}
        <Button
          disabled={pending}
          onClick={() => {
            setNotice("");
            onSwitch();
          }}
        >
          {signup ? "Log in" : "Sign up"}
        </Button>
      </p>
      {notice && (
        <FieldError id="email-error" className={styles.notice}>
          {notice}
        </FieldError>
      )}
      <Button className={styles.back} disabled={pending} onClick={back}>
        Back
      </Button>
    </>
  );
}
