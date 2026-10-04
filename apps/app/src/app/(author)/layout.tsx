import { AppShell } from "@/components/workspace";
import { requireUser } from "@/lib/session";
export default async function AuthorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
