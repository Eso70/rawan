import { notFound } from "next/navigation";
import type { ApiProject } from "@rawan/types";
import { readResource } from "@/lib/data";
import { Breadcrumbs, PageHeader } from "@/components/workspace";
import { ProjectNav } from "@/components/project-nav";
import { RelationshipsPanel } from "@/components/relationships-panel";
export default async function RelationshipsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(projectId)) notFound();
  const project = await readResource<ApiProject>(`/projects/${projectId}`);
  return (
    <>
      <Breadcrumbs
        items={[
          { title: "Projects", href: "/projects" },
          { title: project.title, href: `/projects/${projectId}` },
          {
            title: "Relationships",
            href: `/projects/${projectId}/relationships`,
          },
        ]}
      />
      <ProjectNav projectId={projectId} active="relationships" />
      <PageHeader
        eyebrow={project.title}
        title="Relationships"
        description="Connect the world shared by your books."
      />
      <RelationshipsPanel projectId={projectId} />
    </>
  );
}
