import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "../../lib/session";
import { preferencesFor, dashboardFor } from "../../lib/experience";
export async function Dashboard({ mode }: { mode: "author" | "reader" }) {
  const session = await requireSession();
  const preferences = await preferencesFor(session);
  if (!preferences.experience) redirect("/onboarding");
  if (
    preferences.experience !== "both" &&
    dashboardFor(preferences.experience) !== `/workspace/${mode}`
  )
    redirect(dashboardFor(preferences.experience));
  return (
    <main
      style={{
        minHeight: "100svh",
        background: "#fff",
        color: "#202124",
        colorScheme: "light",
      }}
    >
      <header
        style={{
          padding: "20px",
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          alignItems: "center",
          borderBottom: "1px solid #eee",
        }}
      >
        <strong>
          {mode === "author" ? "Author dashboard" : "Reader dashboard"}
        </strong>
        {preferences.experience === "both" && (
          <Link
            style={{ color: "inherit" }}
            href={mode === "author" ? "/workspace/reader" : "/workspace/author"}
          >
            Switch to {mode === "author" ? "reading" : "writing"}
          </Link>
        )}
        <Link style={{ color: "inherit" }} href="/onboarding?edit=1">
          Change preferences
        </Link>
        <form action="/auth/logout" method="post">
          <button style={{ cursor: "pointer" }}>Sign out</button>
        </form>
      </header>
    </main>
  );
}
