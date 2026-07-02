/* =========================================================================
   MISSION CONFIG  —  EDIT EVERYTHING ABOUT YOU HERE
   -------------------------------------------------------------------------
   This is the ONLY file you need to touch to update your portfolio content.
   Change the text below, save, and refresh the page. No layout knowledge
   required. Keep the quotes and commas where they are.
   ========================================================================= */

const CONFIG = {
  // ---- IDENTITY -----------------------------------------------------------
  callsign: "PARAG GUPTA",              // Your name (shown big on the hero)
  title: "Java Developer",              // Your role / what you want to be
  tagline: "Building reliable backend systems, one launch at a time.",
  location: "India",                    // City / Country
  status: "Available for new missions", // e.g. "Open to opportunities"

  // ---- CONTACT ------------------------------------------------------------
  email: "shahj@alphavima.com",
  phone: "",                            // optional, leave "" to hide
  links: [
    // label, url, and an emoji/icon. Add or remove freely.
    { label: "GitHub",   url: "https://github.com/yourusername",   icon: "\u{1F420}" },
    { label: "LinkedIn", url: "https://linkedin.com/in/yourprofile", icon: "\u{1F517}" },
    { label: "Resume",   url: "#",                                  icon: "\u{1F4C4}" },
  ],

  // ---- ABOUT (Stage 1: Pre-Launch) ---------------------------------------
  about: {
    heading: "Mission Briefing",
    // Each string is a paragraph. Add as many as you like.
    paragraphs: [
      "I'm a Java developer with 0–2 years of experience, currently building enterprise solutions at Alphavima Technologies.",
      "I specialize in backend engineering with Spring Boot, relational databases, and Microsoft Dynamics CRM integrations — turning business requirements into clean, maintainable code.",
      "I care about strong fundamentals: data structures, algorithms, and system design. My goal is to grow into a backend engineer who ships robust, scalable systems.",
    ],
    // Quick stats shown as little instrument dials
    stats: [
      { value: "0–2", label: "Years Experience" },
      { value: "10+",  label: "Technologies" },
      { value: "∞",  label: "Curiosity" },
    ],
  },

  // ---- SKILLS (Stage 2: Ignition) ----------------------------------------
  // Each "system" is a group. level is 0-100 (fuel gauge).
  skills: [
    {
      system: "Core Propulsion",   // Category name
      subtitle: "Language & Fundamentals",
      items: [
        { name: "Core Java & OOP",        level: 85 },
        { name: "Data Structures & Algorithms", level: 75 },
        { name: "Collections & Streams",  level: 80 },
        { name: "Multithreading",         level: 65 },
      ],
    },
    {
      system: "Guidance Systems",
      subtitle: "Frameworks & Backend",
      items: [
        { name: "Spring Boot",  level: 80 },
        { name: "Spring MVC / REST APIs", level: 78 },
        { name: "System Design", level: 60 },
      ],
    },
    {
      system: "Fuel & Storage",
      subtitle: "Data Layer",
      items: [
        { name: "SQL (MySQL / PostgreSQL)", level: 78 },
        { name: "JPA / Hibernate",  level: 70 },
        { name: "JDBC",             level: 72 },
      ],
    },
    {
      system: "Ground Support",
      subtitle: "Tools & Integrations",
      items: [
        { name: "Microsoft Dynamics CRM APIs", level: 75 },
        { name: "Docker",   level: 65 },
        { name: "Git",      level: 82 },
        { name: "Maven / Gradle", level: 70 },
        { name: "HTML / CSS / JS", level: 68 },
      ],
    },
  ],

  // ---- PROJECTS (Stage 3: Orbit) -----------------------------------------
  // Add/replace with your real projects. tags is a list of tech used.
  projects: [
    {
      name: "CRM Integration Engine",
      blurb: "Synced business data between internal services and Microsoft Dynamics 365 via secure REST APIs, with retry and error-handling logic.",
      tags: ["Java", "Spring Boot", "Dynamics CRM", "REST"],
      link: "",   // optional GitHub/live URL
    },
    {
      name: "Inventory Management API",
      blurb: "A RESTful backend for tracking stock, orders, and suppliers with role-based access and paginated queries.",
      tags: ["Spring Boot", "PostgreSQL", "JPA", "Docker"],
      link: "",
    },
    {
      name: "Algorithm Visualizer",
      blurb: "A learning project that animates sorting and pathfinding algorithms to strengthen DSA intuition.",
      tags: ["Java", "DSA", "JavaFX"],
      link: "",
    },
  ],

  // ---- EXPERIENCE (Stage 4: Deep Space Timeline) -------------------------
  experience: [
    {
      role: "Java Developer",
      org: "Alphavima Technologies",
      period: "Present",
      points: [
        "Develop and maintain Spring Boot services and Dynamics CRM integrations.",
        "Design database schemas and write optimized SQL queries.",
        "Collaborate with the team using Git and containerized workflows.",
      ],
    },
    // Add education or previous roles here:
    // {
    //   role: "B.Tech / Degree",
    //   org: "Your University",
    //   period: "20XX – 20XX",
    //   points: ["Relevant coursework, achievements, etc."],
    // },
  ],
};
