/** Attempt every close even if one fails; disconnect PostgreSQL only after worker drains settle. */
export async function closeResources(
  workers: (() => Promise<unknown>)[],
  disconnect: () => Promise<unknown>,
): Promise<void> {
  const outcomes = await Promise.allSettled(
    workers.map((close) => Promise.resolve().then(close)),
  );
  try {
    await disconnect();
  } catch {
    throw Error("Worker resource shutdown failed");
  }
  if (outcomes.some((result) => result.status === "rejected"))
    throw Error("Worker resource shutdown failed");
}
