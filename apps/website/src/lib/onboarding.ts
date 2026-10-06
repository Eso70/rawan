export type StoryType =
  "ttrpg" | "fiction" | "worldbuilding" | "film" | "game" | "other";
export type OnboardingState = {
  storyType: StoryType | null;
  phase: "choice" | "intro" | "tour";
  step: number;
  completedAt: string | null;
  skipped: boolean;
  draftName: string;
  draftText: string;
  draftImage: string;
  draftRole: string;
};
export const introScenes = [
  {
    view: "split",
    title: "Welcome to Rawan",
    lines: [
      "Welcome to Rawan.",
      "Let’s take a quick look around.",
      "This is a space for your stories and the worlds behind them.",
    ],
  },
  {
    view: "canvas",
    title: "Start with a spark",
    lines: [
      "Gather your ideas on a canvas.",
      "Bring references, places and story notes together.",
      "See the shape of your world before you begin writing.",
    ],
  },
  {
    view: "card",
    title: "Give your world a home",
    lines: [
      "A card brings one part of your world into focus.",
      "Give a character a name, a face and a few facts.",
      "Then add the story that makes them yours.",
    ],
  },
  {
    view: "team",
    title: "Alone or with your team",
    lines: [
      "Build your world on your own, or plan it with others.",
      "Connections help you see how the pieces fit.",
      "This tutorial uses a sample world so you can explore safely.",
    ],
  },
  {
    view: "help",
    title: "A little help, whenever you need it",
    lines: [
      "You can return to this tutorial whenever you like.",
      "Look for the Tutorial button to replay these steps.",
      "Let’s try your first card together.",
    ],
  },
] as const;
export const cardSteps = [
  {
    target: "name",
    title: "Name your card",
    text: "A card represents one piece of your world. Name a character, place or idea; you can change the name whenever you like.",
  },
  {
    target: "image",
    title: "Give it a face",
    text: "Choose an illustration from the sample images. A picture can help you recognize a character at a glance.",
  },
  {
    target: "properties",
    title: "Facts live in properties",
    text: "Keep a few facts close to the name. In this sample, add a role to describe the person behind the story.",
  },
  {
    target: "text",
    title: "Add your first block",
    text: "Choose Text and write a line about your character. Your tutorial name and text are saved privately with your account.",
  },
  {
    target: "finish",
    title: "This card is yours",
    text: "Your tutorial draft is saved with your account. Finish to explore the sample world, or replay this guide whenever you need it.",
  },
] as const;
