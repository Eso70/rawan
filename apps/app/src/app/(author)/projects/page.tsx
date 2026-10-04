import type { ApiProject } from "@rawan/types";
import { readResource } from "@/lib/data";
import { PageHeader, ResourceList } from "@/components/workspace";
import { CreateForm } from "@/components/forms";
export default async function Projects() {
  const projects = await readResource<ApiProject[]>("/projects");
  return (
    <>
      <PageHeader
        eyebrow="Your library"
        title="Room for the whole story."
        description="Keep your ideas together. Begin something new, or return to a world in progress."
      />
      <div className="content-columns">
        <ResourceList resources={projects} kind="project" path="/projects" />
        <CreateForm ids={[]} kind="project" />
      </div>
    </>
  );
}
