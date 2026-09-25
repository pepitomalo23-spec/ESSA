import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

// Vista previa al compartir el enlace (WhatsApp, Telegram…). Los robots no ejecutan JavaScript, así que cada
// entrada tiene su propio HTML: «/» (alumnos) e «/personal» (instructores), con su imagen, título y app instalable.
// WhatsApp necesita la dirección completa de la imagen: en Vercel se toma del dominio de producción.
const SITE = (
  process.env.VITE_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
).replace(/\/$/, "");

const PAGES = {
  alumnos: {
    path: "/",
    title: "Evaluación ESSA · Acceso al examen",
    shareTitle: "Evaluación ESSA · Acceso al examen",
    description: "Entra a tu examen desde el móvil con el código de 6 cifras que te da tu instructor.",
    image: "/og-alumnos-examen.jpg",
    alt: "Acceso al examen de la Escuela de Salvamento y Socorrismo Acuático",
    manifest: "/manifest.webmanifest",
    appTitle: "ESSA",
  },
  personal: {
    path: "/personal",
    title: "ESSA · Panel del personal",
    shareTitle: "ESSA · Panel del personal docente",
    description: "Acceso exclusivo para el personal docente: abre la sala de examen, proyecta el código y sigue a tus alumnos en directo.",
    image: "/og-instructores.jpg",
    alt: "Panel del personal docente de la Escuela de Salvamento y Socorrismo Acuático",
    manifest: "/manifest-personal.webmanifest",
    appTitle: "ESSA Personal",
  },
} as const;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function shareTags(page: keyof typeof PAGES) {
  const p = PAGES[page];
  const abs = (u: string) => `${SITE}${u}`;
  return [
    `<title>${esc(p.title)}</title>`,
    `<meta name="description" content="${esc(p.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Escuela de Salvamento y Socorrismo Acuático" />`,
    `<meta property="og:locale" content="es_ES" />`,
    `<meta property="og:title" content="${esc(p.shareTitle)}" />`,
    `<meta property="og:description" content="${esc(p.description)}" />`,
    SITE && `<meta property="og:url" content="${abs(p.path)}" />`,
    `<meta property="og:image" content="${abs(p.image)}" />`,
    `<meta property="og:image:type" content="image/jpeg" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(p.alt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<link rel="manifest" href="${p.manifest}" />`,
    `<meta name="apple-mobile-web-app-title" content="${esc(p.appTitle)}" />`,
  ]
    .filter(Boolean)
    .map((t) => `    ${t}`)
    .join("\n");
}

function sharePages(): Plugin {
  let outDir = "dist";
  return {
    name: "essa-share-pages",
    configResolved(c) {
      outDir = resolve(c.root, c.build.outDir);
    },
    transformIndexHtml: (html, ctx) =>
      html.replace("    <!--share-->", shareTags(ctx.originalUrl?.startsWith("/personal") ? "personal" : "alumnos")),
    closeBundle() {
      const index = resolve(outDir, "index.html");
      let html: string;
      try {
        html = readFileSync(index, "utf8");
      } catch {
        return;
      }
      writeFileSync(resolve(outDir, "personal.html"), html.replace(shareTags("alumnos"), shareTags("personal")));
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), sharePages()],
});
