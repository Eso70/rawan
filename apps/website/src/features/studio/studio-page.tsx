"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useStudio } from "./studio-provider";
import { resolveStudioRoute } from "./data/routes";
import {
  DashboardPage,
  ProjectsPage,
  ProjectOverview,
  WorksPage,
} from "./pages/projects";
import { WorldPage, EntityPage } from "./pages/world";
import { PlotPage, TimelinePage } from "./pages/planning";
import { ResearchPage } from "./pages/research";
import {
  ActivityPage,
  PreferencesPage,
  ProjectSettingsPage,
  SearchPage,
  MediaPage,
} from "./pages/utilities";
import { HelpPage } from "./pages/help";
import { EmptyState } from "./components/ui";
const loading = () => (
  <div className="s-loading" role="status">
    Opening your workspace…
  </div>
);
const Manuscript = dynamic(() => import("./pages/manuscript"), {
  ssr: false,
  loading,
});
const Canvas = dynamic(
  () => import("./pages/visual-tools").then((m) => m.CanvasPage),
  { ssr: false, loading },
);
const Relationships = dynamic(
  () => import("./pages/visual-tools").then((m) => m.RelationshipsPage),
  { ssr: false, loading },
);
export function StudioPage({ path }: { path: string[] }) {
  const { data } = useStudio();
  const route = resolveStudioRoute(path);
  const notFound = (
    <EmptyState
      title="This page has wandered away"
      description="Choose a project or return to your desk."
      action={
        <Link href="/studio" className="s-button primary">
          Back to your desk
        </Link>
      }
    />
  );
  if (route.page === "dashboard") return <DashboardPage />;
  if (route.page === "projects") return <ProjectsPage />;
  if (route.page === "activity") return <ActivityPage />;
  if (route.page === "search") return <SearchPage />;
  if (route.page === "preferences") return <PreferencesPage />;
  if (route.page === "help") return <HelpPage />;
  if (route.page !== "project") return notFound;
  const { projectId, tool, entityId } = route;
  if (!data.projects.some((p) => p.id === projectId)) return notFound;
  switch (tool) {
    case "overview":
      return <ProjectOverview projectId={projectId} />;
    case "works":
      return <WorksPage projectId={projectId} key={projectId} />;
    case "manuscript":
      return <Manuscript projectId={projectId} key={projectId} />;
    case "world":
      return entityId ? (
        <EntityPage projectId={projectId} entityId={entityId} key={entityId} />
      ) : (
        <WorldPage projectId={projectId} key={projectId} />
      );
    case "plot":
      return <PlotPage projectId={projectId} key={projectId} />;
    case "timeline":
      return <TimelinePage projectId={projectId} key={projectId} />;
    case "relationships":
      return <Relationships projectId={projectId} key={projectId} />;
    case "canvas":
      return <Canvas projectId={projectId} key={projectId} />;
    case "research":
      return <ResearchPage projectId={projectId} key={projectId} />;
    case "media":
      return <MediaPage projectId={projectId} key={projectId} />;
    case "settings":
      return <ProjectSettingsPage projectId={projectId} key={projectId} />;
    default:
      return notFound;
  }
}
