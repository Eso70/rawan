import type { OnboardingDraft, Purpose } from "./model";
import {
  creativeGroups,
  readingFormatGroups,
  readingGenreGroups,
  readingTopicGroups,
} from "./options.ts";

export type InterestField =
  "creativeInterests" | "readingFormats" | "readingGenres" | "readingTopics";
export type InterestPhase = "categories" | "choices";
export type InterestCategory = {
  id: string;
  label: string;
  field: InterestField;
  options: { value: string; label: string }[];
};
const categories: InterestCategory[] = [
  ...creativeGroups.slice(0, 4).map((group, index) => ({
    id: `creative-${index}`,
    label:
      group.title === "Visual storytelling"
        ? "Comics & visual stories"
        : group.title,
    field: "creativeInterests" as const,
    options: group.options,
  })),
  ...(
    [
      [
        "creative-poetry",
        "Poetry & essays",
        ["poetry", "essays", "spoken-word", "songwriting"],
      ],
      [
        "creative-essays",
        "Articles & blogs",
        ["articles", "blogs", "travel-writing", "nature-writing"],
      ],
      [
        "creative-worlds",
        "Interactive worlds",
        ["interactive-fiction", "game-narratives", "worldbuilding-and-lore"],
      ],
      ["creative-journals", "Journaling & other", ["journaling", "other"]],
      [
        "creative-life",
        "Life writing",
        ["memoirs", "autobiographies", "biographies", "journaling"],
      ],
      [
        "creative-young",
        "Children & young adult",
        ["children-s-books", "young-adult-literature", "fairy-tales"],
      ],
      [
        "creative-audio",
        "Audio & performance",
        ["audio-dramas", "spoken-word", "songwriting", "stage-plays"],
      ],
    ] as const
  ).map(([id, label, values]) => ({
    id,
    label,
    field: "creativeInterests" as const,
    options: creativeGroups
      .flatMap((group) => group.options)
      .filter((option) => (values as readonly string[]).includes(option.value)),
  })),
  ...(
    [
      [
        "reading-books",
        "Books & stories",
        "readingFormats",
        ["novels", "short-stories", "non-fiction", "other"],
      ],
      [
        "reading-visual",
        "Comics & manga",
        "readingFormats",
        ["comics", "graphic-novels", "manga", "webtoons"],
      ],
      [
        "reading-poetry",
        "Poetry & essays",
        "readingFormats",
        ["poetry", "essays"],
      ],
      [
        "reading-fantasy",
        "Fantasy & sci-fi",
        "readingGenres",
        ["fantasy", "science-fiction", "magical-realism", "dystopian-fiction"],
      ],
      [
        "reading-mystery",
        "Mystery & suspense",
        "readingGenres",
        ["mystery", "thriller", "horror"],
      ],
      [
        "reading-fiction",
        "Romance & fiction",
        "readingGenres",
        [
          "romance",
          "historical-fiction",
          "literary-fiction",
          "adventure",
          "contemporary-fiction",
        ],
      ],
      [
        "reading-mind",
        "Life & mind",
        "readingTopics",
        ["philosophy", "psychology", "personal-development"],
      ],
      [
        "reading-history",
        "History & culture",
        "readingTopics",
        ["history", "biography", "memoir", "politics", "culture", "education"],
      ],
      [
        "reading-science",
        "Science & business",
        "readingTopics",
        ["science", "technology", "business"],
      ],
      [
        "reading-cozy",
        "Cozy & uplifting",
        "readingGenres",
        ["cozy-fantasy", "feel-good-fiction"],
      ],
      [
        "reading-myths",
        "Myths & folklore",
        "readingGenres",
        ["mythology", "folklore", "fairy-tales"],
      ],
      ["reading-humor", "Humor & satire", "readingGenres", ["humor", "satire"]],
      [
        "reading-nature",
        "Nature & travel",
        "readingTopics",
        ["nature", "travel", "environment"],
      ],
      [
        "reading-arts",
        "Arts & creativity",
        "readingTopics",
        ["art", "music", "creativity"],
      ],
    ] as const
  ).map(([id, label, field, values]) => ({
    id,
    label,
    field,
    options: [
      ...readingFormatGroups,
      ...readingGenreGroups,
      ...readingTopicGroups,
    ]
      .flatMap((group) => group.options)
      .filter((option) => (values as readonly string[]).includes(option.value)),
  })),
];
export function interestCategories(purpose: Purpose | null) {
  return categories.filter((category) =>
    category.field === "creativeInterests"
      ? purpose === "create" || purpose === "both"
      : purpose === "read" || purpose === "both",
  );
}
/** Broad categories are presentation filters; only existing concrete preference values are saved. */
export function categoriesFromDraft(draft: OnboardingDraft) {
  return categories
    .filter((category) =>
      category.options.some((option) =>
        draft[category.field].includes(option.value),
      ),
    )
    .map((category) => category.id);
}
export function interestOptions(
  purpose: Purpose | null,
  selected: string[],
  field: InterestField,
) {
  const options = interestCategories(purpose)
    .filter(
      (category) => selected.includes(category.id) && category.field === field,
    )
    .flatMap((category) => category.options);
  return [...new Map(options.map((option) => [option.value, option])).values()];
}
export function hasInterestChoices(
  purpose: Purpose | null,
  selected: string[],
) {
  return interestCategories(purpose).some((category) =>
    selected.includes(category.id),
  );
}
