import type { StudioData, EntityKind, Project, WorkKind } from "./models.ts";
import {
  chapterPassages,
  entityDetails,
  eventDetails,
} from "./story-details.ts";

const at = "2026-10-19T08:00:00.000Z";
const descriptions = [
  "An archivist discovers that her city's oldest histories have been written in disappearing ink. A novel about memory, inheritance, and the stories a city chooses to keep.",
  "In the winter of 1912, a translator follows a bundle of undelivered letters to a remote northern island. A quiet story of distance and belonging.",
  "Above a city that has forgotten the stars, two siblings reopen an abandoned observatory. A speculative story about attention, wonder, and fragile things.",
  "An inquiry into the ways places, objects, and other people hold our memories. Essays that bring cognitive research into conversation with everyday life.",
  "A young mapmaker charts a coastline that changes with every tide. An illustrated journey through uncertain landscapes and chosen homes.",
];
const titles = [
  "The Ashen Archive",
  "Letters from the North",
  "The Glass Observatory",
  "A Study of Memory",
  "The Last Cartographer",
];
const kinds: WorkKind[] = ["Novel", "Novel", "Novel", "Non-fiction", "Comic"];
const colors = ["#bda373", "#8aa7b0", "#9d9ac4", "#a3ad89", "#bf937f"];
const casts = [
  [
    "Mira Vey",
    "Elias Rook",
    "Sera the Binder",
    "Theodore Vale",
    "Iona Reed",
    "The Quiet Archive",
    "Cinder Quay",
    "The Order of Ash",
    "The Last Index",
  ],
  [
    "Ada Lind",
    "Jonas Berg",
    "Ingrid Sol",
    "Nils Falk",
    "Northhaven",
    "The Winter Post",
    "The Blue Letter",
  ],
  [
    "Lena Saye",
    "Oren Saye",
    "Professor Edda",
    "The Glass Hill",
    "The Observatory",
    "The Night Society",
    "The Unfinished Lens",
  ],
  [],
  [
    "Nera",
    "Tomas of the Tides",
    "The Ferryman",
    "The Moving Coast",
    "Saltmarket",
    "The Sounding Guild",
    "The Compass Without North",
  ],
];
const chapterNames = [
  [
    "The city before waking",
    "A borrowed name",
    "The rooms below",
    "Ink and silence",
    "What the river remembers",
    "A door left open",
  ],
  [
    "The undelivered letter",
    "A room facing north",
    "An island in winter",
    "The translator's notebook",
    "When the ice breaks",
  ],
  [
    "A roof full of stars",
    "The locked observatory",
    "An imperfect lens",
    "Signals in the dark",
    "The first clear night",
  ],
  [
    "The shape of remembering",
    "Objects that keep us",
    "The memory of places",
    "Stories we inherit",
    "Forgetting as a practice",
  ],
  ["The shore moves", "Soundings", "A map of the tide"],
];
const paragraphs = [
  [
    "By the time the bells began, Mira had already found the missing page. It lay beneath the ledger, folded into a square no larger than her palm. Someone had written a single sentence across its back: remember the river as it was.",
    "Outside, the city was gathering itself. Shutters opened onto the narrow streets, and the first boats moved between the dark pilings of Cinder Quay. Nothing about the morning suggested that a history could disappear.",
    "She held the page against the window. In the thin light the ink looked almost blue. Not the official black of the archive, but the blue her mother had used for letters she never sent.",
    "There were rules for a discovery like this. A form, a witness, a careful notation in the accession book. Instead, Mira slipped the page into her coat and listened to the bells finish their argument with the morning.",
  ],
  [
    "The letter arrived on a Thursday, although there had been no boat since Monday. Ada found it between the storm door and the frame, its paper softened by the weather.",
    "She recognized neither the handwriting nor the seal. Beyond the window, the sea had the color of an old spoon. It was the sort of afternoon in which every room seemed to be waiting for someone.",
    "She put the kettle on before opening it. Some habits survive a journey better than their owners. The familiar sound gave her a place from which to begin.",
  ],
  [
    "From the roof, Lena could see the observatory above the last line of houses. Its windows held the evening light long after the street below had turned gray.",
    "Oren said the dome had been closed for thirty years. Lena knew it was twenty-nine. It was a small difference, but she had learned to be careful with the things people called forgotten.",
    "A bird circled the tower once and vanished behind the glass. She decided they would go in the morning. She did not yet know what she was hoping to find.",
  ],
  [
    "A memory rarely arrives alone. It brings the light from a particular window, the shape of a hand, the feeling of a room before anyone speaks. We call this recollection, as though the pieces had once belonged to us in an orderly way.",
    "This chapter begins with an ordinary object: a chipped cup on a kitchen shelf. Its significance is not in its material or its age, but in the network of repeated gestures that has gathered around it.",
    "Rather than treating memory as a private archive, I want to consider the possibility that remembering is something we do with the world. Objects and places are participants in that work, not merely its background.",
  ],
  [
    "Nera set the compass on the table. Its needle moved toward the sound of the tide. On the map, yesterday's harbor had become a field of pale blue lines.",
    "She had been taught to draw a coast as a boundary. Now she wondered if it was better understood as a conversation: something that could be followed, but never finished.",
  ],
];

export function createSeed(): StudioData {
  const projects: Project[] = titles.map((title, i) => ({
    id: `p${i + 1}`,
    title,
    description: descriptions[i],
    kind: kinds[i],
    status: i === 4 ? "Planning" : i === 1 ? "Revising" : "Drafting",
    cover: `/studio/covers/${i + 1}.svg`,
    color: colors[i],
    pinned: i === 0 || i === 2,
    updatedAt: new Date(Date.parse(at) - i * 86400000).toISOString(),
    goal: i === 3 ? 50000 : i === 4 ? 120 : 80000,
  }));
  const data: StudioData = {
    version: 1,
    projects,
    works: [],
    chapters: [],
    scenes: [],
    entities: [],
    eras: [],
    events: [],
    relationships: [],
    arcs: [],
    points: [],
    notes: [],
    media: [],
    nodes: [],
    edges: [],
    activity: [],
    feedback: [],
    preferences: {
      theme: "dark",
      font: "serif",
      fontSize: 19,
      lineHeight: 1.85,
      editorWidth: 700,
      reducedMotion: false,
      compact: false,
      authorName: "Rowan",
    },
    lastSceneId: "p1-w1-c1-s1",
    recentSearches: [],
    tourCompleted: false,
  };
  projects.forEach((p, i) => {
    const workId = `${p.id}-w1`;
    data.works.push({
      id: workId,
      projectId: p.id,
      title: p.title,
      kind: p.kind,
      description: p.description,
      status: p.status,
      cover: p.cover,
      updatedAt: p.updatedAt,
    });
    if (p.kind !== "Comic")
      chapterNames[i].forEach((title, n) => {
        const id = `${workId}-c${n + 1}`;
        data.chapters.push({
          id,
          workId,
          title,
          position: n,
          status: n === 0 ? "Revising" : "Drafting",
        });
        data.scenes.push({
          id: `${id}-s1`,
          chapterId: id,
          title: n === 0 ? "Opening" : "First movement",
          content:
            n === 0
              ? paragraphs[i].map((text) => `<p>${text}</p>`).join("")
              : `<p>${chapterPassages[i][n]}</p>`,
          updatedAt: p.updatedAt,
        });
        if (n === 0)
          data.scenes.push({
            id: `${id}-s2`,
            chapterId: id,
            title: "A change in the light",
            content: `<p>${paragraphs[i][1]}</p><p>The conversation stopped at the sound of footsteps. For a moment, neither of them moved. There was still time to leave things as they were.</p>`,
            updatedAt: p.updatedAt,
          });
      });
    casts[i].forEach((name, n) => {
      const kind: EntityKind =
        n < (i === 0 ? 5 : 3)
          ? "Character"
          : n < casts[i].length - 2
            ? "Location"
            : n === casts[i].length - 2
              ? "Faction"
              : "Artifact";
      const summary =
        entityDetails[name] ??
        (kind === "Character"
          ? `${name} carries a private history that will change the direction of ${p.title.toLowerCase()}.`
          : kind === "Location"
            ? `A place at the heart of ${p.title.toLowerCase()}, shaped by the people who pass through it.`
            : kind === "Faction"
              ? "An old institution whose stated purpose and quiet practices are beginning to diverge."
              : "An object whose importance lies in what it remembers, rather than what it is worth.");
      data.entities.push({
        id: `${p.id}-e${n + 1}`,
        projectId: p.id,
        name,
        kind,
        summary,
        description: `${summary}\n\n${n === 0 ? "At first, their world is defined by routine: familiar rooms, repeated tasks, and a careful avoidance of difficult questions. The opening chapter places a small, impossible discovery in the path of that routine." : "The details should emerge through action and consequence. Keep the description grounded in physical particulars: weathered edges, the sound of a door, something left on a desk."}\n\nStory note: reveal the connection to the central mystery gradually. The most useful detail is the one that changes how a scene is understood.`,
        aliases: n === 0 && i === 0 ? ["The apprentice archivist"] : [],
        tags: [n === 0 ? "central" : "supporting", "first draft"],
        properties: [
          {
            id: `role-${n}`,
            label: kind === "Character" ? "Role" : "Type",
            value:
              n === 0
                ? "Protagonist"
                : kind === "Character"
                  ? "Supporting cast"
                  : "Story reference",
          },
          { id: `status-${n}`, label: "Status", value: "Developing" },
        ],
        image: `/studio/art/${kind === "Location" ? "landscape" : kind === "Artifact" ? "compass" : kind === "Faction" ? "architecture" : "portrait"}.svg`,
        updatedAt: p.updatedAt,
      });
    });
    const entities = data.entities.filter((e) => e.projectId === p.id);
    if (entities.length) {
      const location = entities.find((e) => e.kind === "Location");
      if (location)
        entities[0].properties.push({
          id: `${p.id}-residence`,
          label: "Residence",
          value: location.name,
          entityId: location.id,
        });
      entities.slice(1, 5).forEach((e, n) =>
        data.relationships.push({
          id: `${p.id}-r${n}`,
          projectId: p.id,
          sourceId: entities[0].id,
          targetId: e.id,
          label: ["Trusts", "Seeks guidance from", "Connected to", "Questions"][
            n
          ],
        }),
      );
    }
    ["Before the story", "The turning season"].forEach((title, n) =>
      data.eras.push({
        id: `${p.id}-era${n}`,
        projectId: p.id,
        title,
        description:
          n === 0
            ? "The events that make the opening possible."
            : "The moments in which familiar things begin to change.",
      }),
    );
    const eventTitles =
      i === 3
        ? [
            "Early experiments in recall",
            "The field interviews",
            "The first synthesis",
            "The final conversation",
          ]
        : [
            "The founding promise",
            "A departure",
            "The first discovery",
            "The return",
          ];
    eventTitles.forEach((title, n) =>
      data.events.push({
        id: `${p.id}-event${n}`,
        projectId: p.id,
        eraId: `${p.id}-era${n < 2 ? 0 : 1}`,
        title,
        order: n * 10,
        date: ["Twenty years earlier", "Last winter", "Day 1", "Day 12"][n],
        category: n < 2 ? "History" : "Story",
        description: eventDetails[i][n],
        entityIds: entities.slice(0, 2).map((e) => e.id),
      }),
    );
    [
      "Act I · The familiar world",
      "Act II · A different light",
      "Act III · What remains",
    ].forEach((title, n) =>
      data.arcs.push({
        id: `${p.id}-arc${n}`,
        projectId: p.id,
        title,
        description: [
          "Establish the everyday and introduce the disturbance.",
          "Test the assumptions that made the everyday possible.",
          "Return to the opening question with a changed understanding.",
        ][n],
      }),
    );
    data.chapters
      .filter((c) => c.workId === workId)
      .slice(0, 5)
      .forEach((c, n) =>
        data.points.push({
          id: `${p.id}-point${n}`,
          projectId: p.id,
          arcId: `${p.id}-arc${n < 2 ? 0 : n < 4 ? 1 : 2}`,
          title: [
            "An ordinary morning",
            "The discovery",
            "A reluctant alliance",
            "The cost of knowing",
            "A deliberate choice",
          ][n],
          description: `${c.title}: bring the central question into a concrete scene. Give the character an action, an obstacle, and something they cannot yet say.`,
          position: n,
          status: n === 0 ? "Complete" : "Planning",
          chapterId: c.id,
        }),
      );
    [
      "The texture of place",
      "Questions for the next draft",
      "Objects and their histories",
      "Sources and reading",
    ].forEach((title, n) =>
      data.notes.push({
        id: `${p.id}-note${n}`,
        projectId: p.id,
        title,
        folder: ["Field notes", "Draft notes", "Field notes", "Sources"][n],
        tags: ["research", n === 1 ? "revision" : "reference"],
        pinned: n === 0,
        content: [
          `For ${p.title}, pay attention to the ordinary details that establish a lived-in place.\n\nWhat does someone hear before they enter the room? What changes with the weather? List small physical details rather than explaining the atmosphere.\n\nWorking observation: the most convincing places have evidence of use, not just beauty.`,
          `Questions to carry into the next pass:\n\n1. Is the opening question specific enough?\n2. What does the protagonist choose rather than simply observe?\n3. Where does a piece of research interrupt the movement of a scene?\n\nReturn to the first chapter after the ending is drafted.`,
          "An object's story can be told through repair, wear, and placement. Keep a short record of the objects that return across chapters.\n\nA folded paper. A cup with a missing handle. A key whose door is never mentioned.\n\nUse repetition sparingly; let each appearance change its meaning.",
          "Reading notebook — sources to investigate\n\nPrimary material: letters, municipal records, oral histories, and photographs of ordinary work.\n\nRecord the original author, date, archive reference, and the reason each source matters. Distinguish verified facts from imaginative reconstruction.\n\nThese are fictional demonstration research notes, not factual citations.",
        ][n],
        updatedAt: p.updatedAt,
        entityIds: entities.slice(0, 1).map((e) => e.id),
      }),
    );
    ["landscape", "architecture", "compass", "portrait"].forEach((art, n) =>
      data.media.push({
        id: `${p.id}-media${n}`,
        projectId: p.id,
        title: [
          "A quiet coastline",
          "The archive hall",
          "An instrument of direction",
          "Figure study",
        ][n],
        src: `/studio/art/${art}.svg`,
        category: ["Places", "Architecture", "Objects", "Characters"][n],
        description:
          "Original Rawan vector study, bundled for this local demonstration.",
      }),
    );
    data.nodes.push(
      {
        id: `${p.id}-node1`,
        projectId: p.id,
        kind: "note",
        title: "The central question",
        text:
          i === 3
            ? "What do we remember with, as well as about?"
            : "What must be kept — and what can be allowed to change?",
        x: 40,
        y: 40,
      },
      {
        id: `${p.id}-node2`,
        projectId: p.id,
        kind: "image",
        title: "A sense of place",
        text: "Light, distance, and the feeling of an arrival.",
        image: "/studio/art/landscape.svg",
        x: 390,
        y: 30,
      },
      {
        id: `${p.id}-node3`,
        projectId: p.id,
        kind: "plot",
        title: "The first discovery",
        text: "An ordinary task reveals something that should not be there.",
        x: 390,
        y: 360,
      },
      {
        id: `${p.id}-node4`,
        projectId: p.id,
        kind: entities.length ? "entity" : "note",
        title: entities[0]?.name ?? "A working hypothesis",
        referenceId: entities[0]?.id,
        text:
          entities[0]?.summary ??
          "Memory is a relationship between a person and their surroundings.",
        x: 50,
        y: 330,
      },
    );
    data.edges.push({
      id: `${p.id}-edge1`,
      projectId: p.id,
      source: `${p.id}-node1`,
      target: `${p.id}-node3`,
      label: "becomes",
    });
    data.activity.push({
      id: `${p.id}-a1`,
      projectId: p.id,
      label:
        p.kind === "Comic"
          ? "Explored the visual concept"
          : `Revisited “${chapterNames[i][0]}”`,
      href:
        p.kind === "Comic"
          ? `/studio/projects/${p.id}/canvas`
          : `/studio/projects/${p.id}/manuscript?work=${workId}&scene=${workId}-c1-s1`,
      at: p.updatedAt,
    });
  });
  data.works.push(
    {
      ...data.works[0],
      id: "p1-w2",
      title: "Notes from Cinder Quay",
      kind: "Short story",
      description: "Three linked stories from the city's edge.",
      status: "Planning",
    },
    {
      ...data.works[3],
      id: "p4-w2",
      title: "The Things We Keep",
      kind: "Essay",
      description: "A companion essay on objects, attachment, and remembering.",
      status: "Drafting",
    },
  );
  data.works
    .filter((w) => w.id.endsWith("w2"))
    .forEach((w) => {
      const id = `${w.id}-c1`;
      data.chapters.push({
        id,
        workId: w.id,
        title: w.kind === "Essay" ? "A small collection" : "At the quay",
        position: 0,
        status: "Drafting",
      });
      data.scenes.push({
        id: `${id}-s1`,
        chapterId: id,
        title: "Opening",
        content: `<p>${w.description} Begin with an object in a particular room, at a particular time. Let the larger question emerge from that first detail.</p>`,
        updatedAt: at,
      });
    });
  return data;
}
