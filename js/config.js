/* =========================================================================
   MISSION CONFIG  —  EDIT EVERYTHING ABOUT YOU HERE
   -------------------------------------------------------------------------
   This is the ONLY file you need to touch to update your portfolio content.
   Change the text below, save, and refresh the page. Keep quotes & commas.
   ========================================================================= */

const CONFIG = {
  // ---- IDENTITY -----------------------------------------------------------
  callsign: "PARAG GUPTA",
  title: "Java Backend Developer",
  // Hero cycles through these with a typewriter effect (leave [] to disable):
  roles: [
    "Java Backend Developer",
    "Spring Boot & REST APIs",
    "Spring Security · JWT · RBAC",
    "Microservices & Clean Architecture",
    "Associate Engineer @ Alphavima",
  ],
  tagline: "Building scalable, secure, testable backend systems — Spring Boot services, REST APIs, and clean architecture.",
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
      "I'm a backend-focused Java Developer with 1.5+ years of professional experience building and maintaining enterprise applications.",
      "I'm strong in Java, Spring Boot, Spring Security, REST APIs, Hibernate/JPA and PostgreSQL — designing business logic, securing endpoints (JWT, RBAC) and keeping data operations transactional and consistent.",
      "I care about clean architecture: OOP, SOLID principles, and design patterns that keep systems maintainable, testable, and ready to scale.",
    ],
    stats: [
      { value: "1.5+", label: "Yrs Experience" },
      { value: "4",    label: "Key Projects" },
      { value: "8.6",  label: "CGPA / 10" },
    ],
  },

  // ---- SKILLS (Venus) — mapped from the résumé skill matrix --------------
  skills: [
    {
      system: "Languages", subtitle: "Core Propulsion",
      items: [
        { name: "Java",        level: 88 },
        { name: "SQL",         level: 82 },
        { name: "JavaScript",  level: 80 },
        { name: "TypeScript",  level: 74 },
      ],
    },
    {
      system: "Frameworks & Backend", subtitle: "Guidance Systems",
      items: [
        { name: "Spring Boot",     level: 86 },
        { name: "Spring Security", level: 82 },
        { name: "Hibernate / JPA", level: 80 },
        { name: ".NET / C#",       level: 72 },
      ],
    },
    {
      system: "APIs & Services", subtitle: "Reactor Core",
      items: [
        { name: "REST APIs",       level: 86 },
        { name: "JWT / RBAC",      level: 84 },
        { name: "Microservices",   level: 78 },
        { name: "Swagger/OpenAPI", level: 78 },
      ],
    },
    {
      system: "Databases", subtitle: "Fuel & Storage",
      items: [
        { name: "PostgreSQL", level: 82 },
        { name: "MySQL",      level: 80 },
        { name: "MongoDB",    level: 76 },
        { name: "Oracle SQL", level: 70 },
      ],
    },
    {
      system: "Tools & DevOps", subtitle: "Ground Support",
      items: [
        { name: "Git",     level: 86 },
        { name: "Postman", level: 85 },
        { name: "Docker",  level: 78 },
        { name: "Maven",   level: 78 },
      ],
    },
    {
      system: "Concepts", subtitle: "Flight Principles",
      items: [
        { name: "OOP & SOLID",      level: 88 },
        { name: "Data Structures",  level: 80 },
        { name: "Transactions",     level: 80 },
        { name: "Design Patterns",  level: 78 },
      ],
    },
  ],

  // ---- PROJECTS (Earth) — real projects from the résumé ------------------
  // Each project can have a `repo` (source) and/or `live` (running demo) URL;
  // the card shows a "CODE ↗" and/or "LIVE ↗" link when present.
  projects: [
    {
      name: "Synapse — AI Learning Platform",
      blurb: "Backend of a full-stack learning platform: a normalized relational schema (Prisma + PostgreSQL) with multi-tenant, per-user data isolation on every operation, OAuth (Google/GitHub) + JWT sessions with ownership-scoped authorization, a Retrieval-Augmented Generation (RAG) pipeline using Gemini embeddings and cosine-similarity search, and an SM-2 spaced-repetition engine with secured cron-based email reminders.",
      tags: ["TypeScript", "Node.js", "Prisma", "PostgreSQL", "RAG", "Gemini", "OAuth/JWT"],
      repo: "https://github.com/parag-1812/synapse",
      live: "https://synapse-gules-psi.vercel.app/",
    },
    {
      name: "CloudKitchenX — Order Management",
      blurb: "Backend order-management platform in Java/Spring Boot: order creation, ingredient validation, price & prep-time calculation, kitchen assignment, tracking and cancellation. Transactional inventory reservation keeps stock and order persistence consistent, with role-based authorization (USER, KITCHEN, ADMIN) and layered architecture documented via Swagger/OpenAPI.",
      tags: ["Java", "Spring Boot", "Spring Security", "JPA", "PostgreSQL", "JWT", "Docker"],
      repo: "https://github.com/parag-1812/order-engine",
      live: "",
    },
    {
      name: "Multi-Role Authentication Service",
      blurb: "Secure JWT authentication service with user registration, login, token generation and fine-grained role-based access control. BCrypt-hashed credential storage, stateless JWT sessions, and a Spring Security filter that protects every REST endpoint by role.",
      tags: ["Java", "Spring Boot", "Spring Security", "JWT", "JPA", "PostgreSQL"],
      repo: "https://github.com/parag-1812/multi-role-auth-service",
      live: "",
    },
    {
      name: "The Handshake Protocol",
      blurb: "A decentralized identity & trust protocol: any two entities — AI agents, apps, services — prove who they are and what they can do using public-key passports, with no central server, registry, or login. Includes a reference library, signed capability invocation, a web of trust, and cross-language conformance vectors.",
      tags: ["Node.js", "WebCrypto", "Cryptography", "Decentralized", "Protocol Design"],
      repo: "",
      live: "",
    },
  ],

  // ---- EXPERIENCE (Mars) --------------------------------------------------
  experience: [
    {
      role: "Associate Engineer",
      org: "Alphavima Technologies Inc.",
      period: "Apr 2025 – Present",
      points: [
        "Implemented business logic and backend integrations using C#/.NET — server-side data validation, workflow automation, and processing within enterprise modules.",
        "Developed and maintained application functionality and integrated components with backend services and enterprise data operations across Microsoft Dynamics 365.",
        "Investigated production issues through debugging and root-cause analysis, resolved defects, and collaborated with QA across testing and release cycles.",
        "Built data-driven features and reusable components backed by enterprise data services, including a Kanban-style interface for managing application records.",
        "Worked with Git, Postman, and XRMToolBox for version control, API testing, and troubleshooting during development and releases.",
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
      "System Design", "Data Structures & Algorithms", "AI / RAG Applications",
      "Cloud (Azure)", "Kafka & Event-Driven Systems", "Open Source",
    ],
  },

  // ---- OUTRO (Neptune finale) --------------------------------------------
  outro: {
    heading: "End of Transmission",
    message: "You've reached the edge of the system. Thanks for making the journey — let's build something out of this world together.",
  },
};
