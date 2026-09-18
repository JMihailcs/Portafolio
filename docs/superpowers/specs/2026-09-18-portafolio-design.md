# Portafolio Johan Mihail Conde Sallo — Diseño

Fecha: 2026-09-18 · Estado: pendiente de revisión del usuario

## 1. Objetivo y audiencia

Portafolio personal de **Johan Mihail Conde Sallo, Junior AI Engineer** (LLMs, agentes, RAG).
Audiencia principal: **reclutadores**. Deben entender en menos de 10 segundos quién es,
qué construye y cómo contactarlo, y poder descargar el CV.

Idiomas: **español e inglés**, con redacción natural en ambos (no traducción literal).

## 2. Referencia visual y metodología

- Referencia: hero de Nero (@neropursue) en Collect UI: tarjeta redondeada sobre negro, titular
  serif condensado en mayúsculas con guion largo, nav de texto, CTA oscuro + link fantasma,
  3 tarjetas pequeñas abajo a la izquierda, sujeto escultórico que sangra a la derecha.
- Metodología: framework **F.R.A.M.E.** (`~/Downloads/landing_skills.md`).
  - F Fundación: este spec (identidad, copy, decisiones).
  - R Render: Image 1 e Image 2 generadas por el usuario con ChatGPT Images 2.
  - A Animación: transición Image 1 → Image 2 generada por el usuario con Higgsfield/Seedance Pro.
  - M Montaje: implementación en código (aquí, no en Claude Design).
  - E Entrega: pulido, verificación y deploy.
- Desviaciones deliberadas de la skill: se usa **Astro** (pedido del usuario) en lugar de
  Next.js + ShadCN; sin secciones de pricing, testimonios ni FAQ (no hay contenido real).

## 3. Alcance

**Incluye:** sitio estático bilingüe de una página (`/es`, `/en`), hero con video ambiental y el
**efecto de revelado al pasar el mouse por el rostro** (ver §7), secciones Work, Experience,
About/Trust y Contact, descarga de CV, SEO básico, accesibilidad.

**No incluye (v1):** blog, CMS, formulario de contacto con backend, testimonios, pricing, FAQ,
analítica.

## 4. Stack

Astro 6, Tailwind CSS 4 (`@tailwindcss/vite`), TypeScript, GSAP 3 (+ ScrollTrigger),
`@astrojs/sitemap`, `astro:assets` para imágenes. Mismas versiones que
`Paginas_estaticas/magic-experiences-peru`. Node 26, ffmpeg 9 disponibles localmente.
Sin React ni ShadCN: no hay estado de cliente que lo justifique.

## 5. Sistema de diseño

### Color (variables CSS en `:root`)

| Token | Hex | Uso |
|---|---|---|
| `--vermilion` | `#E34234` | Primario: marca, hovers, zonas vivas |
| `--vermilion-deep` | `#5A1409` | Inicio del degradado del hero (lado del texto) |
| `--vermilion-vivid` | `#D63A22` | Fin del degradado (detrás del busto) |
| `--ink` | `#14090B` | Texto sobre zonas vivas/claras, botón principal |
| `--bone` | `#F3E9E4` | Texto sobre zonas oscuras, superficies claras |
| `--amber` | `#FFB347` | Acento: subrayado nav, flechas, detalles pequeños; nunca texto pequeño sobre vermilion |

Texto secundario: `--bone` al 72% de opacidad. Contraste mínimo WCAG AA (4.5:1) para texto
normal: hueso sobre `#5A1409`, tinta sobre superficies vivas. Se valida en el navegador durante
la implementación; cualquier par que falle se ajusta.

### Tipografía

- Títulos: serif de alto contraste, condensada, en mayúsculas, tracking ligeramente negativo.
  Candidata inicial: **Instrument Serif** (Google Fonts, gratuita); se valida visualmente
  contra la referencia y se sustituye si no encaja. Line-height 1.0–1.1.
- Cuerpo: **DM Sans** (Google Fonts). Line-height 1.6.
- `font-display: swap`, solo los pesos usados.

### Forma y layout

- Página con fondo `--ink`; el hero vive dentro de una tarjeta redondeada (radio 24px) con
  el degradado bermellón. Márgenes de 16px en móvil, ~24px en escritorio.
- Composición asimétrica, aire generoso, animaciones lentas y suaves (easing
  `cubic-bezier(0.4, 0, 0.2, 1)`).

## 6. Arquitectura de información

Una página por idioma, secciones en este orden:

1. **Navbar:** monograma "JM" (izquierda); Work · Experience · About · Contact; selector ES/EN.
   Transparente sobre el hero; el activo lleva subrayado ámbar.
2. **Hero:** ver §7.
3. **Qué hago:** párrafo de problema (2–3 líneas) + 3 beneficios (§8.2).
4. **Work:** los 3 destacados en detalle + bloque "Más proyectos".
5. **Experience:** LAAD y Turix, en línea de tiempo simple.
6. **About / Trust:** perfil, stack, eventos (NASA Space Apps 2025, Paqarina Wasi), idiomas.
7. **Contact (CTA final):** titular grande, botón "Let's talk", enlaces.
8. **Footer:** email, GitHub, LinkedIn, ubicación, copyright, botón Download CV.

## 7. Hero

- **Contenido izquierda:** nav, titular, subtexto, CTAs (primario "Let's talk"/"Hablemos" →
  `mailto`; fantasma "See work →"/"Ver proyectos →" → ancla a Work).
- **Tres tarjetas** abajo a la izquierda (imágenes `cards/a|b|c`): Asistente Mikha,
  GraphRAG, Semantic Search. Título serif blanco condensado abajo a la derecha de cada tarjeta.
  Cada una enlaza a su proyecto en Work.
- **Contenido derecha:** video `hero-loop.mp4` a sangre, con `object-position` hacia el busto.
- **Video (solo ambiental):** `transition.mp4` (7 s, Seedance) → `hero-loop.mp4` concatenando el
  original con su reverso vía ffmpeg (loop sin corte, sin depender de `playbackRate`). Solo mueve
  la nebulosa del cabello/cuello, las partículas y la luz; **el rostro de mármol permanece intacto**
  porque es la "piel" que el revelado abre. Atributos: `muted`, `playsinline`, `autoplay`, `loop`,
  sin `controls`. `poster` = Image 1 (comprimida) y se precarga como LCP.
- **Efecto de revelado (`HeroReveal`)** — al pasar el mouse sobre el rostro se ve lo que hay debajo
  (comportamiento observado en la referencia). Capas, de abajo arriba:
  1. Video/poster del busto.
  2. **Capa interior (HTML, `aria-hidden`):** panel de terminal con fondo `--ink` y texto
     monoespaciado en ámbar/bermellón/hueso que se desplaza lentamente hacia arriba. Contenido: la
     traza de un agente (consulta → llamadas a herramientas → solicitud de confirmación → traza
     enviada a Phoenix), coherente con Mikha. Es decorativa: sin métricas ni cifras que parezcan
     mediciones reales.
  3. **Ventana orgánica:** la capa 2 se recorta con un `clip-path: path()` en forma de mancha (12
     puntos, spline cerrada con ondulación sinusoidal por punto) generado en cada frame; sobre su
     contorno se dibuja un trazo dorado (`--amber`) con el mismo path en un SVG superpuesto.
  4. **Listones de vidrio:** 6 tiras verticales sobre el rostro (`backdrop-filter: blur(1.5px)
     brightness(1.08)` + bordes de 1 px en `--bone` al ~35%). Se desplazan en X con el cursor con
     factores distintos por tira (GSAP `quickTo`).
  - **Zona de revelado:** rectángulo (frente y ojos) definido como porcentajes en un único punto de
    configuración, que se ajusta una vez con las imágenes reales. El centro de la mancha sigue al
    puntero (lerp ≈ 0.12) confinado a esa zona; al entrar crece de 0 al tamaño de la zona
    (~0.6 s) y al salir se cierra con el mismo easing.
  - **Táctil (sin hover):** la ventana se abre con `pointerdown` y sigue el dedo sin bloquear el
    scroll vertical (`touch-action: pan-y`); además hace un "vistazo" automático cada ~6 s mientras
    el hero es visible.
- **`prefers-reduced-motion`:** solo poster; sin video, ondulación ni vistazos automáticos; el
  revelado responde al puntero con apertura inmediata y sin desplazamiento de texto ni de listones.
- **Móvil:** el busto va arriba (recorte vertical vía `object-position`), el texto debajo sobre un
  degradado oscuro para contraste; las 3 tarjetas pasan a fila con scroll horizontal.
- **Sin assets todavía:** el hero se monta con el degradado bermellón y un contenedor de
  imagen/video vacío; en cuanto aparecen `assets/hero/*` se activan. Ningún placeholder queda en
  el build final.

## 8. Contenido

### 8.1 Hero
- EN: *FROM PROTOTYPE TO PRODUCTION — RELIABLE, TRACEABLE AI.* / "Junior AI Engineer building
  LLM agents and RAG systems with tool-calling, evals and full observability."
- ES: *DEL PROTOTIPO A PRODUCCIÓN — IA CONFIABLE Y TRAZABLE.* / "AI Engineer junior. Construyo
  agentes LLM y sistemas RAG con tool-calling, evaluación y trazabilidad completa."

### 8.2 Qué hago
- Problema — EN: "Most LLM demos work once. The hard part is making them behave the same way on
  Tuesday, with sources, limits and a trace of every decision." ES: "La mayoría de las demos LLM
  funcionan una vez. Lo difícil es que se comporten igual el martes: con fuentes, límites y traza
  de cada decisión."
- Beneficios:
  1. Agentes con control / Agents with guardrails: tool-calling de solo lectura y acciones con
     confirmación explícita.
  2. Respuestas con fuentes / Answers with sources: GraphRAG sobre archivos coloniales, con
     citas y vista previa de documento.
  3. Observabilidad y evals / Observability & evals: OpenTelemetry hacia Phoenix y evaluaciones
     para elegir modelo.

### 8.3 Work (fuente: CV y READMEs de cada repositorio; no se añade nada que no conste ahí)
- **Asistente Mikha (2026):** agente personal con FastAPI + PydanticAI sobre LLM local (Ollama);
  tool-calling de solo lectura, acciones con confirmación explícita, memoria persistente sobre
  notas Markdown, trazas OpenTelemetry a Phoenix. Evals de Fase 5: qwen3:8b fue el único modelo que
  acertó todos los casos de tool-calling.
- **GraphRAG — Historical Assistant (2025):** pipeline RAG con Microsoft GraphRAG + LanceDB sobre
  archivos coloniales peruanos; frontend Next.js con fuentes citables y vista previa de documentos;
  desplegado en AWS Lambda + Vercel. Enlace: `github.com/JMihailcs/RAG-Historical_Documents`.
- **Semantic Search (2025):** app full-stack (FastAPI + Qdrant + Next.js) con doble soporte de
  embeddings (OpenAI y open-source) y chunking propio que respeta límites de oración.
- **Más proyectos:** Yuyana (fintech de préstamos P2P, Flutter + Rust; seleccionada para la
  pre-incubación de Paqarina Wasi, mar 2026); frontends de clientes en Turix (Magic Experiences
  Peru, Perou Magique Tours, Kusikuy Travel Transportes, Tour Operador SaaS).
- Los enlaces a repositorios de Mikha y Semantic Search no constan en el CV: hasta que el usuario
  los indique, el botón apunta al perfil de GitHub.

### 8.4 Experience
- **Research Assistant — LAAD, UNSAAC (2023–2025):** frontend Next.js del asistente histórico RAG
  "Conflicto de Tinta" sobre backend en AWS Lambda; visión por computador y NLP (OCR, limpieza y
  etiquetado de datos, automatización de pipelines en Python); sitio web del laboratorio (2023).
- **Frontend & Project Management Intern — Turix (dic 2025–ago 2026):** frontends en Next.js y
  Astro para clientes reales; coordinación de tareas (Trello) y levantamiento de requisitos con
  clientes.

### 8.5 About / Trust
- Perfil: egresado de Ingeniería Informática y de Sistemas (UNSAAC, 2021–2026; bachillerato en
  trámite). Estudia arquitectura de LLM (atención, RoPE, SwiGLU) para depurar con criterio técnico.
- Stack: Python, PyTorch, Ollama, PydanticAI, RAG, Qdrant, LanceDB/GraphRAG, Prompt Engineering,
  Fine-tuning/LoRA, FastAPI, OpenTelemetry, Next.js, AWS Lambda, Docker, SQL, Git/GitHub.
- Eventos: NASA Space Apps Challenge 2025 (participante); Paqarina Wasi Incubator (UNSAAC), mar 2026.
- Idiomas: español (nativo), inglés (B1, técnico), quechua (básico).

### 8.6 Contacto
Email `jm.condesallo@gmail.com`, GitHub `JMihailcs`, LinkedIn
`johan-mihail-conde-sallo-12a871419`, ubicación "Cusco, Perú (remoto)". El teléfono **no** se
muestra en la web.
Botón **Download CV**: `CV_AI_Engineer_ES.pdf` / `CV_AI_Engineer_EN.pdf` copiados a `public/cv/`
(el PDF contiene el teléfono; el usuario lo aprobó).

## 9. Estructura técnica

```
Portafolio/
├── astro.config.mjs        # i18n (es/en), sitemap, tailwind vite plugin
├── public/cv/              # PDFs de CV
├── assets/                 # (fuera del build) originales: hero/, cards/
├── src/
│   ├── assets/{hero,cards}/  # imágenes/video optimizados
│   ├── i18n/{es.ts,en.ts,index.ts}   # todo el copy por idioma
│   ├── data/{projects.ts,experience.ts}  # datos bilingües tipados
│   ├── layouts/Base.astro    # <head>, SEO, hreflang, fuentes
│   ├── components/{Nav,Hero,HeroReveal,HeroCards,WhatIDo,Work,Experience,About,Contact,Footer}.astro
│   ├── scripts/{reveal.ts,cursor.ts,hero-reveal.ts}   # GSAP: entrada, scroll; hero-reveal: mancha, listones, táctil
│   ├── styles/global.css     # tokens y base
│   └── pages/{index.astro,es/index.astro,en/index.astro}
└── docs/superpowers/{specs,plans}/
```

- `pages/index.astro` redirige al idioma del navegador (`navigator.language`, por defecto ES) con
  `<noscript>` a `/es`.
- Cada componente recibe el diccionario del idioma como prop; no hay texto en las plantillas.

## 10. Movimiento

- Entrada del hero (GSAP): titular por líneas con stagger, subtexto, CTAs, tarjetas; 100–150 ms
  entre pasos.
- Scroll (GSAP ScrollTrigger): fade-up sutil por sección y stagger en tarjetas de proyecto.
- Cursor circular personalizado: solo con `(pointer: fine)` y sin reduced-motion.
- Solo `transform` y `opacity`, salvo el `clip-path` de la mancha del revelado, que se actualiza
  con `requestAnimationFrame` únicamente mientras el puntero está sobre el hero.
- El revelado se inicializa solo cuando el hero es visible (IntersectionObserver) y se detiene al salir.

## 11. Rendimiento, accesibilidad y SEO

- LCP < 2.5 s: poster precargado, imágenes AVIF/WebP vía `astro:assets`, video ≤ ~3 MB (720p en
  móvil si hace falta), fuentes con `swap`.
- HTML semántico, un solo `h1`, `alt` descriptivos, foco visible, navegación con teclado, toques
  ≥ 44 px, contraste AA, `prefers-reduced-motion` respetado.
- SEO: `<title>` y descripción por idioma, `hreflang`, Open Graph (recorte del hero), `sitemap`,
  JSON-LD `Person`.

## 12. Verificación

- `astro build` sin errores ni avisos.
- Revisión visual con el navegador a 375, 768 y 1440 px, en ES y EN.
- Contraste comprobado en pares texto/fondo reales.
- Lighthouse (Performance, Accessibility, SEO) como referencia; sin objetivos numéricos rígidos
  salvo LCP < 2.5 s.
- Prueba con `prefers-reduced-motion` activado y sin JavaScript (contenido legible; el hero muestra
  el poster con el rostro intacto).
- Revelado: probar en el navegador que la mancha se abre al entrar en el rostro, sigue al puntero
  confinada a la zona, se cierra al salir, que los listones reaccionan, y que en táctil se abre con
  toque y hace el vistazo automático. Comprobar 60 fps aproximados en escritorio.

## 13. Entrega

Deploy estático (Vercel o Netlify, a elegir al final). Dominio propio fuera de alcance.

## 14. Pendientes que no bloquean el diseño

- Assets `hero/image-1.png`, `hero/image-2.png`, `hero/transition.mp4`, `cards/a|b|c.png`
  (los genera el usuario con los prompts de FRAME). Cambio respecto a la primera versión de los
  prompts: **sin listones de vidrio en las imágenes ni en el video** (ahora son DOM) y con el **rostro de mármol limpio**, sin nebulosa sobre ojos ni
  frente. Cualquier imagen generada con los prompts anteriores debe regenerarse.
- Alinear la capa interior con la zona de revelado una vez existan las imágenes reales.
- Enlaces a los repos de Mikha y Semantic Search.
- Fuente serif definitiva tras compararla con la referencia.
