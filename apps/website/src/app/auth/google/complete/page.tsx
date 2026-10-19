import { notFound } from "next/navigation";
import { GooglePopupComplete } from "../../../../features/auth/components/google-popup-complete";
import { isPopupId } from "../../../../features/auth/lib/google-popup";

export const metadata = {
  title: "Sign-in complete — Rawan",
  robots: { index: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ popupId?: string }>;
}) {
  if (!isPopupId((await searchParams).popupId)) notFound();
  return <GooglePopupComplete />;
}
