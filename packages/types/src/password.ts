/** Shared signup checks. Never normalize or trim the password used for hashing. */
export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 128;
export type PasswordAssessment = { score: number; error: string | null };

const identity = (value: string) =>
  value.normalize("NFKC").toLowerCase().trim();
let estimator: Promise<import("@zxcvbn-ts/core").ZxcvbnFactory> | undefined;
function loadEstimator() {
  // Dictionaries are loaded only when signup needs them, not on the landing page.
  estimator ??= Promise.all([
    import("@zxcvbn-ts/core"),
    import("@zxcvbn-ts/language-common"),
    import("@zxcvbn-ts/language-en"),
  ])
    .then(
      ([core, common, english]) =>
        new core.ZxcvbnFactory({
          dictionary: { ...common.dictionary, ...english.dictionary },
          graphs: common.adjacencyGraphs,
          translations: english.translations,
        }),
    )
    .catch((error: unknown) => {
      estimator = undefined;
      throw error;
    });
  return estimator;
}

export async function assessSignupPassword(
  password: string,
  email: string,
): Promise<PasswordAssessment> {
  // Count code points, matching class-validator Length and NIST password length.
  // eslint-disable-next-line typescript/no-misused-spread
  const length = [...password].length;
  if (length < PASSWORD_MIN_LENGTH || !password.trim())
    return { score: 0, error: "Use at least 15 characters." };
  if (length > PASSWORD_MAX_LENGTH)
    return { score: 0, error: "Use no more than 128 characters." };
  const address = identity(email);
  const username = address.split("@")[0];
  const candidate = identity(password);
  // Also reject identity with punctuation, spaces or predictable suffixes removed.
  const compact = (value: string) => value.replace(/[^\p{L}\p{N}]/gu, "");
  const base = compact(username);
  if (
    candidate === address ||
    candidate === username ||
    (base.length >= 3 &&
      (compact(candidate) === base ||
        compact(candidate).replace(/[0-9]+$/u, "") === base))
  )
    return {
      score: 0,
      error: "Choose a password different from your email and username.",
    };
  if (
    /^(?:p[a@]ssw[o0]rd|qwerty|letmein|welcome|iloveyou|admin|changeme|abc123)[\d\W_]*$/iu.test(
      candidate,
    )
  )
    return {
      score: 0,
      error: "Avoid common passwords, even with numbers or symbols added.",
    };
  const result = (await loadEstimator()).check(password, [
    address,
    username,
    "rawan",
  ]);
  return {
    score: result.score,
    error:
      result.score < 3
        ? "This password is too easy to guess. Try several unrelated words."
        : null,
  };
}
