/**
 * Edit this file. The page reads everything from here.
 * Replace the placeholder lines with your real details.
 */
export const profile = {
  name: "Arjun Dubey",
  initials: "AD",
  role: "Software Engineer",
  location: "India",
  availability: "Open to work",
  email: "hello@arjundubey.dev",
  tagline: "I build quiet, fast interfaces and the systems behind them.",
  intro:
    "I care about clear structure, small payloads, and software that still feels obvious six months later. This page is a working Qwik portfolio — swap the copy, links, and projects below.",
  about: [
    "I like products where the interface disappears and the work gets done. Most of my time goes into frontend architecture, careful UI, and the glue between a screen and an API.",
    "Qwik is the stack for this site: resumable by default, so the first paint stays light. The same preference shows up in how I write features — ship the smallest thing that is still solid.",
  ],
  links: [
    { label: "GitHub", href: "https://github.com/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/" },
    { label: "Email", href: "mailto:hello@arjundubey.dev" },
  ],
};

export const skills = [
  { group: "Interface", items: ["TypeScript", "Qwik", "React", "CSS"] },
  { group: "Platform", items: ["Node.js", "Vite", "Cloudflare"] },
  { group: "Practice", items: ["Accessibility", "Performance", "API design"] },
];

export const projects = [
  {
    year: "2026",
    title: "Project One",
    summary:
      "Replace this with a real product. One sentence on the problem, one on what you shipped.",
    tags: ["Qwik", "TypeScript"],
    href: "https://github.com/",
  },
  {
    year: "2025",
    title: "Project Two",
    summary:
      "A second piece of work. Mention the constraint that made it interesting, not the stack alone.",
    tags: ["Node", "API"],
    href: "https://github.com/",
  },
  {
    year: "2025",
    title: "Project Three",
    summary:
      "A smaller experiment or open-source tool. Link the repo once it exists.",
    tags: ["CSS", "UI"],
    href: "https://github.com/",
  },
];

export const experience = [
  {
    period: "2024 — Now",
    place: "Your company or studio",
    role: "Software Engineer",
    note: "What you actually own. One line is enough.",
  },
  {
    period: "2022 — 2024",
    place: "Previous team",
    role: "Developer",
    note: "A result, not a job description.",
  },
];
