import type { Dict } from './types';

export const es: Dict = {
  meta: {
    title: 'Johan Mihail Conde Sallo — AI Engineer junior',
    description: 'AI Engineer junior. Construyo agentes LLM y sistemas RAG con tool-calling, evaluación y trazabilidad completa. Cusco, Perú (remoto).',
    ogAlt: 'Busto de mármol con una nebulosa bermellón: portafolio de Johan Mihail Conde Sallo',
  },
  nav: { aria: 'Principal', menu: 'Menú', home: 'Volver al inicio', work: 'Proyectos', experience: 'Experiencia', about: 'Sobre mí', contact: 'Contacto', switchLabel: 'Switch to English' },
  hero: {
    headline: ['Del prototipo a producción', 'IA confiable y trazable'],
    sub: 'AI Engineer junior. Construyo agentes LLM y sistemas RAG con tool-calling, evaluación y trazabilidad completa.',
    ctaPrimary: 'Hablemos', ctaSecondary: 'Ver proyectos', cv: 'Descargar CV',
    mediaAlt: 'Busto de mármol de Johan Mihail con una nebulosa bermellón brillando en el cabello y el cuello',
    cards: [
      { id: 'mikha', label: 'Agente de IA personal' },
      { id: 'graphrag', label: 'GraphRAG histórico' },
      { id: 'semantic', label: 'Búsqueda semántica' },
    ],
  },
  whatIDo: {
    kicker: 'Qué hago',
    problem: 'La mayoría de las demos LLM funcionan una vez. Lo difícil es que se comporten igual el martes: con fuentes, límites y traza de cada decisión.',
    benefits: [
      { title: 'Agentes con control', body: 'Tool-calling de solo lectura y acciones que exigen confirmación explícita antes de ejecutarse.' },
      { title: 'Respuestas con fuentes', body: 'GraphRAG sobre archivos coloniales, con citas y vista previa del documento en cada respuesta.' },
      { title: 'Observabilidad y evals', body: 'Trazas OpenTelemetry hacia Phoenix y evaluaciones para elegir el modelo con evidencia.' },
    ],
  },
  work: {
    kicker: 'Proyectos destacados',
    featured: [
      { id: 'mikha', title: 'Asistente Mikha', year: '2026', tags: ['FastAPI', 'PydanticAI', 'Ollama', 'OpenTelemetry', 'Phoenix'],
        summary: 'Agente personal sobre un LLM local (Ollama): tool-calling de solo lectura, acciones con confirmación explícita, memoria persistente sobre notas Markdown y trazas OpenTelemetry hacia Phoenix. En las evals de la fase 5, qwen3:8b fue el único modelo que acertó todos los casos de tool-calling.' },
      { id: 'graphrag', title: 'GraphRAG — Asistente histórico', year: '2025', tags: ['GraphRAG', 'LanceDB', 'Next.js', 'AWS Lambda', 'Vercel'],
        summary: 'Pipeline RAG con Microsoft GraphRAG y LanceDB sobre archivos coloniales peruanos. Frontend en Next.js con fuentes citables y vista previa de documentos, desplegado en AWS Lambda y Vercel.' },
      { id: 'semantic', title: 'Búsqueda semántica', year: '2025', tags: ['FastAPI', 'Qdrant', 'Next.js', 'Embeddings'],
        summary: 'App RAG full-stack con doble soporte de embeddings (OpenAI y open-source) y un chunking propio que respeta los límites de las oraciones.' },
    ],
    viewCode: 'Ver código',
    moreTitle: 'Más proyectos',
    more: [
      { title: 'Yuyana', body: 'Registro de préstamos y deudas entre personas (Flutter + Rust). Seleccionada para la pre-incubación de Paqarina Wasi, marzo de 2026.' },
      { title: 'Sitios de clientes en Turix', body: 'Frontends en Next.js y Astro para Magic Experiences Peru, Perou Magique Tours, Kusikuy Travel Transportes y un SaaS para tour operadores.' },
    ],
  },
  experience: {
    kicker: 'Experiencia',
    jobs: [
      { role: 'Practicante de Frontend y Gestión de Proyectos', org: 'Turix', period: 'dic 2025 – ago 2026', place: 'Cusco, Perú (remoto)',
        bullets: ['Desarrollé frontends en Next.js y Astro para clientes reales en un equipo remoto y ágil.', 'Coordiné tareas en Trello y levanté requisitos técnicos directamente con los clientes.'] },
      { role: 'Asistente de investigación', org: 'LAAD, UNSAAC', period: '2023 – 2025', place: 'Cusco, Perú',
        bullets: ['Construí el frontend en Next.js del asistente histórico RAG "Conflicto de Tinta", sobre un backend RAG desplegado en AWS Lambda.', 'Contribuí en visión por computador y NLP: OCR, limpieza y etiquetado de datos, automatización de pipelines en Python.', 'Desarrollé el sitio web del laboratorio (2023).'] },
    ],
  },
  about: {
    kicker: 'Sobre mí',
    profile: 'Egresado de Ingeniería Informática y de Sistemas en la UNSAAC (bachillerato en trámite). Construyo sistemas de IA de punta a punta y estudio cómo funcionan los LLM por dentro (atención, RoPE, SwiGLU) para depurarlos con criterio técnico.',
    stackTitle: 'Stack',
    stack: ['Python', 'PyTorch', 'Ollama', 'PydanticAI', 'RAG', 'Qdrant', 'LanceDB / GraphRAG', 'Prompt engineering', 'Fine-tuning / LoRA', 'FastAPI', 'OpenTelemetry', 'Next.js', 'AWS Lambda', 'Docker', 'SQL', 'Git / GitHub'],
    eventsTitle: 'Eventos',
    events: [
      { title: 'NASA Space Apps Challenge 2025', body: 'Participante oficial en el hackathon global de la NASA.' },
      { title: 'Incubadora Paqarina Wasi (UNSAAC)', body: 'Pre-incubación con Yuyana, marzo de 2026.' },
    ],
    languagesTitle: 'Idiomas',
    languages: ['Español (nativo)', 'Inglés (B1, técnico)', 'Quechua (básico)'],
  },
  contact: {
    kicker: 'Contacto',
    title: 'Construyamos algo confiable.',
    body: 'Busco un puesto de AI Engineer junior donde pueda llevar prototipos LLM a sistemas confiables.',
    cta: 'Hablemos', location: 'Cusco, Perú (remoto)',
  },
  footer: { rights: 'Todos los derechos reservados.' },
};
