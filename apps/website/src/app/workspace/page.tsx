import { requireSession } from "../../lib/session";
export const metadata = {
  title: "Workspace — Rawan",
  robots: { index: false },
};
export default async function Page() {
  await requireSession();
  return null;
}
