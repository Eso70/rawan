type Entry = {
  id: string;
  name: string;
  image: string;
  aliases: string[];
  properties: [string, string][];
  overview: string;
  notes: string;
};
export const entries: Entry[] = [
  {
    id: "harbor",
    name: "Redwake Harbor",
    image: "harbor",
    aliases: ["The Red Dock", "Crimson Port"],
    properties: [
      ["Region", "The Saltbound Coast"],
      ["Condition", "Operational"],
      ["Control", "The Lantern Guild"],
    ],
    overview:
      "A bustling trade port named for the red algae that blooms each autumn, staining the waters crimson. Ships from across Lumia dock here to trade goods and share news.",
    notes:
      "The harbor master, old Brennan Tyde, keeps meticulous records of every vessel. The Lantern Guild maintains a permanent outpost in the lighthouse.",
  },
  {
    id: "larkspire",
    name: "The Larkspire",
    image: "larkspire",
    aliases: ["The Singing Tower"],
    properties: [
      ["Region", "Velthorn Basin"],
      ["Condition", "Ancient ruins"],
      ["Occupants", "None living"],
    ],
    overview:
      "Wind moves through the old tower, carrying a song across the valley. Travelers follow its sound to find the ruins.",
    notes:
      "Record the tower's history here, then connect its stories to the people and places around it.",
  },
  {
    id: "harrowdeep",
    name: "Harrowdeep",
    image: "larkspire",
    aliases: ["The Drowned Valley"],
    properties: [
      ["Region", "Northern Reaches"],
      ["Condition", "Flooded caverns"],
      ["Occupants", "The Mirewalkers"],
    ],
    overview:
      "Deep beneath the valley, waterways link forgotten chambers. The map records only a few of their entrances.",
    notes: "Add discoveries, local legends and routes as the story develops.",
  },
  {
    id: "outlook",
    name: "Kethvari Outlook",
    image: "outlook",
    aliases: ["The Spire"],
    properties: [
      ["Region", "Velthorn Basin"],
      ["Condition", "Partial collapse"],
      ["Occupants", "Disputed"],
    ],
    overview:
      "A signal tower from the Kethvari trade routes, abandoned after the basin flooded. The upper floors still contain functional brass instruments used for long-distance communication.",
    notes:
      "Three factions claim salvage rights. The Mirewalkers use the lower levels as a waystation; the Brass Collective wants the instruments.",
  },
  {
    id: "mira",
    name: "Captain Mira Voss",
    image: "harbor",
    aliases: ["The Storm Caller"],
    properties: [
      ["Affiliation", "The Lantern Guild"],
      ["Status", "Active"],
      ["Location", "Redwake Harbor"],
    ],
    overview:
      "A captain whose voyages tie distant ports together. Her next journey begins at Redwake Harbor.",
    notes:
      "Keep character motivations, relationships and story ideas together in this entry.",
  },
  {
    id: "warden",
    name: "The Pale Warden",
    image: "mirewalker",
    aliases: ["Keeper of the Old Ways"],
    properties: [
      ["Affiliation", "The Umbral Choir"],
      ["Status", "Unknown"],
      ["Location", "The Larkspire"],
    ],
    overview: "A mysterious guardian of the valley's oldest traditions.",
    notes:
      "Connect this character to the places, events and factions that shape their story.",
  },
  {
    id: "choir",
    name: "The Umbral Choir",
    image: "larkspire",
    aliases: ["Singers of the Deep"],
    properties: [
      ["Territory", "The Larkspire"],
      ["Strength", "Unknown"],
      ["Leader", "The Pale Warden"],
    ],
    overview: "An order whose songs preserve the valley's history.",
    notes: "Gather the faction's beliefs, allies and conflicts here.",
  },
  {
    id: "guild",
    name: "The Lantern Guild",
    image: "harbor",
    aliases: ["Keepers of the Light"],
    properties: [
      ["Territory", "Coastal settlements"],
      ["Strength", "~200 members"],
      ["Leader", "Guildmaster Erynn"],
    ],
    overview:
      "A guild connecting the coast through trade and a chain of lighthouses.",
    notes: "Track the group's influence across the world as your story grows.",
  },
  {
    id: "mirewalkers",
    name: "The Mirewalkers",
    image: "mirewalker",
    aliases: ["Marsh Folk", "The Drowned Kin"],
    properties: [
      ["Territory", "Harrowdeep"],
      ["Strength", "~50 families"],
      ["Leader", "Elder Council"],
    ],
    overview: "A community that knows the paths through the drowned valley.",
    notes: "Their camp links the hidden waterways to the settlements above.",
  },
  {
    id: "coast",
    name: "The Saltbound Coast",
    image: "harbor",
    aliases: ["The Bitter Shore"],
    properties: [
      ["Type", "Geographic region"],
      ["Climate", "Temperate maritime"],
      ["Population", "~12,000"],
    ],
    overview: "Ports and cliff paths connect the settlements along this shore.",
    notes: "Collect the region's locations and histories in one place.",
  },
  {
    id: "accords",
    name: "The Blair Accords",
    image: "larkspire",
    aliases: ["The Peace of Blair"],
    properties: [
      ["Type", "Historical treaty"],
      ["Status", "Active"],
      ["Signatories", "3 factions"],
    ],
    overview:
      "A treaty whose terms still shape the relationships between three factions.",
    notes:
      "Link its origins to the people and events that brought it into being.",
  },
];
export const folders = [
  {
    id: "places",
    name: "Places & Locations",
    ids: ["harbor", "larkspire", "harrowdeep", "outlook"],
  },
  { id: "people", name: "People & Figures", ids: ["mira", "warden"] },
  {
    id: "factions",
    name: "Factions & Orders",
    ids: ["choir", "guild", "mirewalkers"],
  },
  { id: "artifacts", name: "Artifacts & Lore", ids: [] },
];
export const markers = [
  { id: "harbor", label: "Redwake Harbor", x: 12, y: 18 },
  { id: "larkspire", label: "The Larkspire", x: 65, y: 25 },
  { id: "harrowdeep", label: "Harrowdeep", x: 30, y: 40 },
  { id: "outlook", label: "Kethvari Outlook", x: 62, y: 52 },
  { id: "mirewalkers", label: "Mirewalker Camp", x: 25, y: 72 },
  { id: "coast", label: "Saltbound Coast", x: 58, y: 78 },
];
