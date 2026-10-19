export type InterestGroup = {
  title: string;
  options: { value: string; label: string }[];
};
const group = (title: string, labels: string[]): InterestGroup => ({
  title,
  options: labels.map((label) => ({
    value: label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    label,
  })),
});
export const creativeGroups = [
  group("Fiction", [
    "Novels",
    "Short stories",
    "Novellas",
    "Flash fiction",
    "Children’s books",
    "Young adult literature",
    "Fairy tales",
    "Web novels",
    "Serialized stories",
    "Microfiction",
  ]),
  group("Non-fiction", [
    "Non-fiction books",
    "Memoirs",
    "Autobiographies",
    "Biographies",
    "Historical writing",
    "Educational writing",
    "Academic writing",
    "Research papers",
    "Technical writing",
    "Journalism",
  ]),
  group("Visual storytelling", [
    "Comics",
    "Graphic novels",
    "Manga",
    "Webtoons",
  ]),
  group("Scripts", [
    "Screenplays",
    "Film scripts",
    "Television scripts",
    "Stage plays",
    "Audio dramas",
  ]),
  group("Poetry, personal & other", [
    "Poetry",
    "Essays",
    "Articles",
    "Blogs",
    "Interactive fiction",
    "Game narratives",
    "Worldbuilding and lore",
    "Journaling",
    "Other",
    "Spoken word",
    "Songwriting",
    "Travel writing",
    "Nature writing",
  ]),
];
export const readingFormatGroups = [
  group("Formats", [
    "Novels",
    "Short stories",
    "Non-fiction",
    "Comics",
    "Graphic novels",
    "Manga",
    "Webtoons",
    "Poetry",
    "Essays",
    "Other",
  ]),
];
export const readingGenreGroups = [
  group("Fiction genres", [
    "Fantasy",
    "Science fiction",
    "Romance",
    "Mystery",
    "Thriller",
    "Horror",
    "Historical fiction",
    "Literary fiction",
    "Adventure",
    "Contemporary fiction",
    "Magical realism",
    "Dystopian fiction",
    "Cozy fantasy",
    "Feel-good fiction",
    "Mythology",
    "Folklore",
    "Fairy tales",
    "Humor",
    "Satire",
  ]),
];
export const readingTopicGroups = [
  group("Non-fiction topics", [
    "History",
    "Biography",
    "Memoir",
    "Philosophy",
    "Psychology",
    "Science",
    "Technology",
    "Business",
    "Personal development",
    "Politics",
    "Culture",
    "Education",
    "Nature",
    "Travel",
    "Environment",
    "Art",
    "Music",
    "Creativity",
  ]),
];
export const discoverySources = [
  "Search engine",
  "Instagram",
  "TikTok",
  "YouTube",
  "X / Twitter",
  "Facebook",
  "Reddit",
  "Friend or family",
  "Writer or creator community",
  "Blog or article",
  "Online advertisement",
  "Other",
  "Prefer not to say",
];

export type SetupPurpose = "create" | "read" | "both";
export type SetupStart = "studio" | "reader";
export type SetupStep =
  "welcome" | "purpose" | "interests" | "preferences" | "begin";
export const SETUP_STEPS = [
  "welcome",
  "purpose",
  "interests",
  "preferences",
  "begin",
] as const;
export interface SetupDraft {
  preferredName: string;
  purpose: SetupPurpose | null;
  creativeInterests: string[];
  readingFormats: string[];
  readingGenres: string[];
  readingTopics: string[];
  interfaceLanguage: "en";
  discoverySource: string | null;
  discoveryOther: string;
  preferredStart: SetupStart | null;
}
export interface SetupState {
  version: 1;
  status: "not_started" | "in_progress" | "completed";
  required: boolean;
  revision: number;
  step: SetupStep;
  draft: SetupDraft;
  completedAt: string | null;
}

/** Account preferences never grant roles. This is the required setup gate only. */
export function hasSetupAccess(
  state: Pick<SetupState, "required" | "status">,
): boolean {
  return !state.required || state.status === "completed";
}
