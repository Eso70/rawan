import { requireSession } from "../../../lib/session";
export const metadata = {
  title: "Reader dashboard — Rawan",
  robots: { index: false },
};
export default async function Page() {
  await requireSession();
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
        <strong>Reader dashboard</strong>
        <form action="/auth/logout" method="post">
          <button style={{ cursor: "pointer" }}>Sign out</button>
        </form>
      </header>
    </main>
  );
}
