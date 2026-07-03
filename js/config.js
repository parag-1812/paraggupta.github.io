/* =========================================================================
   MISSION CONFIG  —  EDIT EVERYTHING ABOUT YOU HERE
   -------------------------------------------------------------------------
   This is the ONLY file you need to touch to update your portfolio content.
   Change the text below, save, and refresh the page. Keep quotes & commas.
   ========================================================================= */

const CONFIG = {
  // ---- IDENTITY -----------------------------------------------------------
  callsign: "PARAG GUPTA",
  title: "Java Full Stack Developer",
  // Hero cycles through these with a typewriter effect (leave [] to disable):
  roles: [
    "Java Full Stack Developer",
    "Spring Boot & Microservices",
    "React.js Front-End",
    "REST API Craftsman",
    "Associate Engineer @ Alphavima",
  ],
  tagline: "Building scalable, clean, and testable enterprise systems — from Spring Boot services to React UIs.",
  location: "India",
  status: "Available for new missions",

  // ---- AVATAR -------------------------------------------------------------
  // Hosted on Google Drive (must be shared "Anyone with the link").
  // Falls back to initials "PG" if it can't load.
  avatarImage: "https://drive.google.com/thumbnail?id=1lZx3T-apwQ1tAPwMmsErzn4z9M3au_E5&sz=w1000",
  // Crop focus for the round avatar. First value = horizontal, second = vertical.
  // LOWER the 2nd % to show more of the top (face); raise it to show lower.
  // e.g. "center 12%" = face higher, "center 30%" = shows more torso.
  avatarFocus: "center 20%",

  // ---- RESUME -------------------------------------------------------------
  // Hosted on Google Drive (opens the viewer; visitors can read & download).
  resumeUrl: "https://drive.google.com/file/d/1J4wi3ipYvboM15pNoqErvYz7Cfn3irg-/view?usp=sharing",

  // ---- CONTACT ------------------------------------------------------------
  email: "paraggupta9988@gmail.com",
  phone: "+91-7023654446",
  links: [
    { label: "GitHub",   url: "https://github.com/parag-1812",               icon: "\u{1F420}" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/paraggupta7023/", icon: "\u{1F517}" },
    { label: "Resume",   url: "https://drive.google.com/file/d/1J4wi3ipYvboM15pNoqErvYz7Cfn3irg-/view?usp=sharing", icon: "\u{1F4C4}" },
  ],

  // ---- ABOUT (Mercury) ----------------------------------------------------
  about: {
    heading: "Mission Briefing",
    paragraphs: [
      "I'm a Full Stack Developer with hands-on experience building scalable web applications using Java, Spring Boot, React.js, REST APIs, and SQL.",
      "I work across the stack — from designing microservices and securing REST endpoints to building responsive React UIs and enterprise PCF controls at Alphavima Technologies.",
      "I care about clean architecture: OOP, SOLID principles, and design patterns that keep systems maintainable, testable, and ready to scale.",
    ],
    stats: [
      { value: "8.6", label: "CGPA / 10" },
      { value: "3+",  label: "Key Projects" },
      { value: "15+", label: "Technologies" },
    ],
  },

  // ---- SKILLS (Venus) — mapped from the résumé skill matrix --------------
  skills: [
    {
      system: "Languages", subtitle: "Core Propulsion",
      items: [
        { name: "Java",        level: 88 },
        { name: "JavaScript",  level: 80 },
        { name: "C#",          level: 74 },
        { name: "SQL",         level: 82 },
      ],
    },
    {
      system: "Frameworks & Frontend", subtitle: "Guidance Systems",
      items: [
        { name: "Spring Boot", level: 85 },
        { name: "React.js",    level: 80 },
        { name: "HTML5",       level: 84 },
        { name: "CSS3",        level: 80 },
      ],
    },
    {
      system: "Backend", subtitle: "Reactor Core",
      items: [
        { name: "REST APIs",       level: 85 },
        { name: "Microservices",   level: 78 },
        { name: "Spring Security", level: 78 },
        { name: ".NET",            level: 70 },
      ],
    },
    {
      system: "Databases", subtitle: "Fuel & Storage",
      items: [
        { name: "PostgreSQL", level: 80 },
        { name: "MySQL",      level: 80 },
        { name: "Oracle SQL", level: 72 },
        { name: "MongoDB",    level: 76 },
      ],
    },
    {
      system: "Tools & Cloud", subtitle: "Ground Support",
      items: [
        { name: "Git",     level: 86 },
        { name: "Docker",  level: 78 },
        { name: "Azure",   level: 68 },
        { name: "Maven",   level: 76 },
        { name: "Postman", level: 84 },
      ],
    },
    {
      system: "Concepts", subtitle: "Flight Principles",
      items: [
        { name: "OOP",             level: 88 },
        { name: "SOLID Principles", level: 82 },
        { name: "Design Patterns", level: 78 },
        { name: "Unit Testing",    level: 75 },
      ],
    },
  ],

  // ---- PROJECTS (Earth) — real projects from the résumé ------------------
  // Add a `link` (GitHub/live URL) to any project to show an "OPEN DOCK" link.
  projects: [
    {
      name: "The Handshake Protocol",
      blurb: "A decentralized identity & trust protocol: any two entities — AI agents, apps, services — prove who they are and what they can do using public-key passports, with no central server, registry, or login. Includes a reference library, signed capability invocation, a web of trust, and cross-language conformance vectors.",
      tags: ["Node.js", "WebCrypto", "Cryptography", "Decentralized", "Protocol Design"],
      link: "",
    },
    {
      name: "CloudKitchenX",
      blurb: "Distributed cloud-kitchen management system. A scalable order-management platform with clean-architecture microservices, custom ingredient-based orders, accurate pricing & prep-time estimation, plus inventory-reservation logic for transactional integrity.",
      tags: ["Java", "Spring Boot", "Microservices", "REST APIs", "Docker", "PostgreSQL"],
      link: "",
    },
    {
      name: "Multi-Role Authentication Service",
      blurb: "Secure JWT authentication with Admin, User, and Service roles and fine-grained RBAC across every endpoint — secure credential storage, validation, and full token lifecycle management.",
      tags: ["Java", "Spring Boot", "Spring Security", "JWT", "RBAC"],
      link: "",
    },
    {
      name: "LNCT Alumni Portal",
      blurb: "Full-stack alumni management portal with a responsive React front-end (reusable components, dynamic search, real-time filtering) and REST APIs on Node.js/Express backed by MongoDB. Deployed end-to-end on Vercel.",
      tags: ["React.js", "Node.js", "Express", "MongoDB", "REST APIs"],
      link: "",
    },
  ],

  // ---- EXPERIENCE (Mars) --------------------------------------------------
  experience: [
    {
      role: "Associate Engineer",
      org: "Alphavima Technologies Inc.",
      period: "Apr 2025 – Present",
      points: [
        "Designed and implemented React-based PCF controls (Kanban board) to visualize and manage business data in enterprise web apps.",
        "Built and customized full-stack web components with HTML5, CSS3, and JavaScript, improving UI behavior and user experience.",
        "Developed server-side business logic and REST integrations using C#/.NET, automating workflows and enforcing data validations.",
        "Performed debugging, root-cause analysis, and code reviews of production issues, collaborating with QA for stable releases.",
        "Applied OOP, SOLID principles, and design patterns to build scalable, maintainable, testable applications.",
      ],
    },
  ],

  // ---- EDUCATION (Jupiter) ------------------------------------------------
  education: [
    {
      role: "B.Tech · Computer Science",
      org: "Lakshmi Narain College of Technology, Bhopal",
      period: "2020 – 2024",
      points: [
        "CGPA: 8.6 / 10.",
        "Core CS foundation: Data Structures & Algorithms, DBMS, OOP, and System Design.",
      ],
    },
  ],

  // ---- CURRENTLY EXPLORING (Saturn) --------------------------------------
  exploring: {
    heading: "Beyond the Core",
    lead: "Signals I'm chasing next — always leveling up.",
    items: [
      "System Design", "Data Structures & Algorithms", "Cloud (Azure)",
      "Kubernetes", "Kafka & Event-Driven Systems", "Open Source",
    ],
  },

  // ---- OUTRO (Neptune finale) --------------------------------------------
  outro: {
    heading: "End of Transmission",
    message: "You've reached the edge of the system. Thanks for making the journey — let's build something out of this world together.",
  },
};
