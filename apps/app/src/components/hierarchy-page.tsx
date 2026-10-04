import type { ApiProject, ApiBook, ApiChapter, ApiScene } from "@rawan/types";
import { notFound } from "next/navigation";
import { readResource } from "@/lib/data";
import { collectionPath, resourcePath } from "@/lib/paths";
import { Breadcrumbs, PageHeader, ResourceList, formatDate } from "./workspace";
import { CreateForm, SceneForm } from "./forms";
type Resource = ApiProject | ApiBook | ApiChapter | ApiScene;
const kinds = ["project", "book", "chapter", "scene"];
export async function HierarchyPage({ ids }: { ids: string[] }) {
  if (
    ids.length < 1 ||
    ids.length > 4 ||
    ids.some((id) => !/^[a-zA-Z0-9_-]{1,128}$/.test(id))
  )
    notFound();
  const paths = ids.map((_id, index) => resourcePath(ids.slice(0, index + 1)));
  const ancestors = await Promise.all(
    paths.map((path) => readResource<Resource>(path)),
  );
  const current = ancestors[ancestors.length - 1];
  const breadcrumbs = [
    { title: "Projects", href: "/projects" },
    ...ancestors.map((resource, index) => ({
      title: resource.title,
      href: paths[index],
    })),
  ];
  if (ids.length === 4) {
    const scene = current as ApiScene;
    return (
      <>
        <Breadcrumbs items={breadcrumbs} />
        <PageHeader
          eyebrow="Scene"
          title={scene.title}
          description={scene.description}
        />
        <p className="metadata">Updated {formatDate(scene.updatedAt)}</p>
        <SceneForm key={scene.id} ids={ids} content={scene.content} />
      </>
    );
  }
  const path = collectionPath(ids);
  const children = await readResource<Resource[]>(path);
  const kind = kinds[ids.length];
  return (
    <>
      <Breadcrumbs items={breadcrumbs} />
      <PageHeader
        eyebrow={kinds[ids.length - 1]}
        title={current.title}
        description={current.description}
      />
      <div className="content-columns">
        <ResourceList resources={children} kind={kind} path={path} />
        <CreateForm ids={ids} kind={kind} />
      </div>
    </>
  );
}
