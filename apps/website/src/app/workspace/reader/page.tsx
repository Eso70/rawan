import { Dashboard } from "../../../components/preferences/dashboard";
export const metadata = {
  title: "Reader dashboard — Rawan",
  robots: { index: false },
};
export default function Page() {
  return <Dashboard mode="reader" />;
}
