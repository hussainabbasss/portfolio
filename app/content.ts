/**
 * ─────────────────────────────────────────────────────────────────
 *  DEFAULT CONTENT — the fallback the site renders when Supabase
 *  has no row yet (or isn't configured). Once you edit anything in
 *  the /admin panel and hit "Save & publish", the live site reads
 *  from Supabase and these values become the safety net.
 *
 *  Empty strings ("") are intentionally-unfilled fields — fill them
 *  from /admin. Links with an empty URL are hidden on the site
 *  automatically, so nothing points to a dead page.
 * ─────────────────────────────────────────────────────────────────
 */

export type Metric = { label: string; value: string };

export type Project = {
  name: string;
  /** One sentence: the problem this project solves. */
  problem: string;
  stack: string[];
  metrics: Metric[];
  demoUrl: string;
  repoUrl: string;
};

export type Job = {
  company: string;
  role: string;
  dates: string;
  impact: string;
};

export const person = {
  name: "Syed Hussain Abbas",
  role: "Full-Stack Developer",
  location: "Karachi, Pakistan",
  status: "Open to opportunities",
  taglineLine1: "I design and build",
  taglineLine2: "the whole thing.", // renders amber
  valueProp:
    "Full-stack developer building web apps end to end with React and Supabase — shipping since 13.",
  email: "hussain@shahkar.store",
  githubUrl: "https://github.com/hussainabbasss/",
  linkedinUrl: "", // add from /admin
};

export const projects: Project[] = [
  {
    name: "Traceboard",
    problem:
      "AI code editors lose the plot without project context. Traceboard lets teams drop in a PRD, sketch architecture on a real-time multiplayer canvas, and auto-compiles an optimized context tree that plugs straight into Cursor or VS Code.",
    stack: ["Next.js", "Supabase", "TypeScript", "Node"],
    metrics: [
      { label: "Type", value: "Dev Tool / CLI" },
      { label: "Canvas", value: "Real-time multiplayer" },
      { label: "Integrates", value: "Cursor & VS Code" },
    ],
    demoUrl: "https://traceboard.shahkar.store/",
    repoUrl: "", // add from /admin
  },
  {
    name: "Muhaj",
    problem:
      "Religious pilgrimage has been heavily monetized, with middlemen profiting off sacred trips. Muhaj is a free, end-to-end Ziyarat planner — live flight search, visa roadmap, accommodation and transit calculators with free-lodging and Mawkib options, and a generated PDF itinerary that rolls every cost into a live total. It hands trip-planning back to the pilgrim.",
    stack: ["Next.js", "Supabase", "React", "TypeScript"],
    metrics: [
      { label: "Type", value: "Ziyarat trip planner" },
      { label: "Features", value: "Flights · Visa · Transit · Budget" },
      { label: "Output", value: "PDF itinerary + live PKR total" },
    ],
    demoUrl: "https://muhaj.netlify.app/",
    repoUrl: "", // add from /admin
  },
  {
    name: "Shahkar",
    problem:
      "Small retail teams juggle a storefront, an admin panel, task tracking, and team chat across four disconnected tools. Shahkar unifies all of them into one platform on a shared database — storefront, RBAC admin, Jira-style tickets, and Slack-style messaging in a single app. First beta client, a brownie store, is now running live on it.",
    stack: ["Next.js", "Supabase", "TypeScript", "React"],
    metrics: [
      { label: "Type", value: "Business OS" },
      { label: "Modules", value: "Store · Admin · Tickets · Chat" },
      { label: "Status", value: "Live client in beta" },
    ],
    demoUrl: "https://shahkar.store/",
    repoUrl: "", // add from /admin
  },
];

export const jobs: Job[] = [
  {
    company: "NexKara",
    role: "Full-Stack Web Developer",
    dates: "", // add from /admin
    impact:
      "Building web applications at a specialized agency serving U.S. healthcare. Contributed to the Labcorp client portal alongside other client projects, shipping production software to enterprise standards.",
  },
  {
    company: "Shahkar",
    role: "Founder & CEO",
    dates: "", // add from /admin
    impact:
      "Architecting and building a business OS for retail — a unified platform combining a live storefront, RBAC admin panel, Jira-style operational tickets, and Slack-style team messaging on one shared database. Onboarded first beta client, a brownie store now running its storefront and operations on the platform.",
  },
  {
    company: "Systems Summit",
    role: "Founder",
    dates: "", // add from /admin
    impact:
      "Running a web agency building sites for Model UN conferences and small businesses. Signed first client and securing MOUs with multiple MUN organizations, with several more in active negotiation.",
  },
];

export const about = {
  /** One short line, set large — your stance in a sentence. */
  pullLine: "I've been shipping full-stack products since I was 13.",
  /** 2–3 short paragraphs, written like you talk. No corporate filler. */
  paragraphs: [
    "I'm a full-stack developer who builds and ships real products — whether that's an enterprise client portal at an agency, my own software company, or websites for clients through my web agency. I work end to end with React and Supabase, from database schema to the last pixel of the interface.",
    "Outside of code, I founded Pakistan's first college-level student think tank, competed in 16 Model UN conferences with a 93% award rate, and was a National Computer Science Olympiad finalist. I care about building things that are ambitious, well-architected, and actually used.",
  ],
};
