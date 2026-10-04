import { HierarchyPage } from "@/components/hierarchy-page";
export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string; bookId: string; chapterId: string }>;
}) {
  const ids = await params;
  return <HierarchyPage ids={[ids.projectId, ids.bookId, ids.chapterId]} />;
}
