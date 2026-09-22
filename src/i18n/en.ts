import type { Dict } from './types';

export const en: Dict = {
  meta: {
    title: 'Johan Mihail Conde Sallo — Junior AI Engineer',
    description: 'Junior AI Engineer building LLM agents and RAG systems with tool-calling, evals and full observability. Cusco, Peru (remote).',
    ogAlt: 'Marble bust with a glowing vermilion nebula: portfolio of Johan Mihail Conde Sallo',
  },
  nav: { aria: 'Main', menu: 'Menu', home: 'Back to top', work: 'Work', experience: 'Experience', about: 'About', contact: 'Contact', switchLabel: 'Cambiar a español' },
  hero: {
    headline: ['From prototype to production', 'reliable, traceable AI'],
    sub: 'Junior AI Engineer building LLM agents and RAG systems with tool-calling, evals and full observability.',
    ctaPrimary: "Let's talk", ctaSecondary: 'See work', cv: 'Download CV',
    mediaAlt: 'Marble bust of Johan Mihail with a glowing vermilion nebula in its hair and neck',
    cards: [
      { id: 'mikha', label: 'Personal AI agent' },
      { id: 'graphrag', label: 'Historical GraphRAG' },
      { id: 'semantic', label: 'Semantic search' },
    ],
  },
  whatIDo: {
    kicker: 'What I do',
    problem: 'Most LLM demos work once. The hard part is making them behave the same way on Tuesday, with sources, limits and a trace of every decision.',
    benefits: [
      { title: 'Agents with guardrails', body: 'Read-only tool-calling and actions that need explicit confirmation before they run.' },
      { title: 'Answers with sources', body: 'GraphRAG over colonial archives, with citations and a document preview for every answer.' },
      { title: 'Observability and evals', body: 'OpenTelemetry traces to Phoenix and evaluations to choose the model with evidence.' },
    ],
  },
  work: {
    kicker: 'Selected work',
    featured: [
      { id: 'mikha', title: 'Asistente Mikha', year: '2026', tags: ['FastAPI', 'PydanticAI', 'Ollama', 'OpenTelemetry', 'Phoenix'],
        summary: 'A personal agent on a local LLM (Ollama): read-only tool-calling, actions gated behind explicit confirmation, persistent memory over Markdown notes and OpenTelemetry traces to Phoenix. In the phase 5 evals, qwen3:8b was the only model to get every tool-calling case right.' },
      { id: 'graphrag', title: 'GraphRAG — Historical Assistant', year: '2025', tags: ['GraphRAG', 'LanceDB', 'Next.js', 'AWS Lambda', 'Vercel'],
        summary: 'RAG pipeline with Microsoft GraphRAG and LanceDB over Peruvian colonial archives. Next.js frontend with citable sources and document preview, deployed on AWS Lambda and Vercel.' },
      { id: 'semantic', title: 'Semantic Search', year: '2025', tags: ['FastAPI', 'Qdrant', 'Next.js', 'Embeddings'],
        summary: 'Full-stack RAG app with dual embedding support (OpenAI and open-source) and a custom chunking pipeline that respects sentence boundaries.' },
    ],
    viewCode: 'View code',
    moreTitle: 'More projects',
    more: [
      { title: 'Yuyana', body: 'Peer-to-peer loan and debt tracker (Flutter + Rust). Selected for the Paqarina Wasi pre-incubation program, March 2026.' },
      { title: 'Client sites at Turix', body: 'Next.js and Astro frontends for Magic Experiences Peru, Perou Magique Tours, Kusikuy Travel Transportes and a tour-operator SaaS.' },
    ],
  },
  experience: {
    kicker: 'Experience',
    jobs: [
      { role: 'Frontend & Project Management Intern', org: 'Turix', period: 'Dec 2025 – Aug 2026', place: 'Cusco, Peru (remote)',
        bullets: ['Built Next.js and Astro frontends for real clients in a remote, agile team.', 'Coordinated tasks in Trello and gathered technical requirements directly with clients.'] },
      { role: 'Research Assistant', org: 'LAAD, UNSAAC', period: '2023 – 2025', place: 'Cusco, Peru',
        bullets: ['Built the Next.js frontend of the "Conflicto de Tinta" historical RAG assistant, on top of a RAG backend deployed on AWS Lambda.', 'Contributed to computer vision and NLP work: OCR, data cleaning and labeling, Python pipeline automation.', 'Built the lab website (2023).'] },
    ],
  },
  about: {
    kicker: 'About',
    profile: 'Software engineering graduate at UNSAAC (coursework complete, degree in progress). I build AI systems end to end and study LLM internals (attention, RoPE, SwiGLU) so I can debug them with real technical judgment.',
    stackTitle: 'Stack',
    stack: ['Python', 'PyTorch', 'Ollama', 'PydanticAI', 'RAG', 'Qdrant', 'LanceDB / GraphRAG', 'Prompt engineering', 'Fine-tuning / LoRA', 'FastAPI', 'OpenTelemetry', 'Next.js', 'AWS Lambda', 'Docker', 'SQL', 'Git / GitHub'],
    eventsTitle: 'Events',
    events: [
      { title: 'NASA Space Apps Challenge 2025', body: "Official participant in NASA's global hackathon." },
      { title: 'Paqarina Wasi Incubator (UNSAAC)', body: 'Pre-incubation with Yuyana, March 2026.' },
    ],
    languagesTitle: 'Languages',
    languages: ['Spanish (native)', 'English (B1, technical)', 'Quechua (basic)'],
  },
  contact: {
    kicker: 'Contact',
    title: "Let's build something reliable.",
    body: "I'm looking for a Junior AI Engineer role where I can take LLM prototypes into reliable systems.",
    cta: "Let's talk", location: 'Cusco, Peru (remote)',
  },
  footer: { rights: 'All rights reserved.' },
  assistant: {
    label: 'Open the portfolio assistant',
    title: 'Ask about Johan',
    placeholder: 'Type your question…',
    send: 'Send message',
    close: 'Close the chat',
    suggestions: ['What projects has he built?', 'What is his main stack?', 'What is his experience?'],
    privacy: 'Conversations are processed by Claude (Anthropic). Do not share personal data.',
    streaming: 'Typing…',
    error: 'I could not answer right now.',
    limited: 'You have reached the message limit for now.',
    off: 'The assistant is turned off right now.',
  },
};
