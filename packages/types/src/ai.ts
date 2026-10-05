export type AiTaskType = "BRAINSTORM" | "SUMMARIZE" | "REWRITE";
export type AiGenerationStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
export type AiContextKind =
  "SCENE" | "CHARACTER" | "TIMELINE_EVENT" | "PLOT_POINT" | "NOTE";
export interface AiContextReference {
  kind: AiContextKind;
  id: string;
}
export interface CreateAiGeneration {
  task: AiTaskType;
  instructions: string;
  inputText?: string;
  context?: AiContextReference[];
}
export interface AiGenerationSummary {
  id: string;
  projectId: string;
  task: AiTaskType;
  status: AiGenerationStatus;
  provider: string;
  model: string;
  promptVersion: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}
export interface AiGenerationDetail extends AiGenerationSummary {
  result: {
    type: "text";
    text: string;
    proposal: true;
    contextTruncated: boolean;
  } | null;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    estimatedCost: null;
  };
  error: { code: string; message: string } | null;
}
