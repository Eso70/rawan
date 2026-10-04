import { WorldPage } from "@/components/world-page";
export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string; collection: string }>;
}) {
  return <WorldPage {...await params} />;
}
