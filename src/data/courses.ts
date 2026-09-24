import type { LucideIcon } from "lucide-react";
import { Waves, Mountain, HeartPulse, Zap, RefreshCw, Building2 } from "lucide-react";

export type Course = {
  slug: string;
  title: string;
  short: string;
  description: string;
  icon: LucideIcon;
  accent: "red" | "navy" | "teal";
  hours: string;
  modality: string;
  certificate: string;
  requirements: string[];
  syllabus: string[];
  featured?: boolean;
};

// Contenido orientativo: ajusta horas, requisitos y temario a tu oferta real.
export const COURSES: Course[] = [
  {
    slug: "socorrista-instalaciones-acuaticas",
    title: "Socorrista en Instalaciones Acuáticas",
    short: "La titulación para trabajar en piscinas públicas, comunitarias y parques acuáticos.",
    description:
      "Aprende a prevenir, vigilar e intervenir en piscinas y parques acuáticos. Combina teoría online con prácticas intensivas en piscina: técnicas de nado, remolque, extracción, RCP y uso del DEA.",
    icon: Waves,
    accent: "navy",
    hours: "≈ 150 h",
    modality: "Semipresencial",
    certificate: "Certificado de la escuela + registro de socorristas",
    requirements: [
      "Tener 16 años cumplidos",
      "Superar la prueba de acceso de natación",
      "Certificado médico de aptitud",
    ],
    syllabus: [
      "Prevención y vigilancia en instalaciones acuáticas",
      "Técnicas de nado adaptadas al rescate",
      "Remolques, zafaduras y extracción del accidentado",
      "Soporte vital básico y uso del DEA",
      "Primeros auxilios en el medio acuático",
      "Legislación y responsabilidad del socorrista",
    ],
    featured: true,
  },
  {
    slug: "socorrista-espacios-naturales",
    title: "Socorrista en Espacios Acuáticos Naturales",
    short: "Playas, ríos y embalses: rescate en aguas abiertas con material específico.",
    description:
      "Especialízate en el entorno más exigente. Corrientes, oleaje y material de rescate (tubo, boya torpedo, tabla y embarcación) con prácticas reales en playa.",
    icon: Mountain,
    accent: "teal",
    hours: "≈ 110 h",
    modality: "Semipresencial",
    certificate: "Certificado de la escuela",
    requirements: [
      "Titulación de socorrista en instalaciones acuáticas",
      "Superar la prueba de acceso en aguas abiertas",
    ],
    syllabus: [
      "Dinámica del mar: corrientes, oleaje y mareas",
      "Material de rescate en aguas abiertas",
      "Rescate con tabla y embarcación",
      "Coordinación con servicios de emergencia",
      "Organización del puesto de socorrismo en playa",
    ],
  },
  {
    slug: "primeros-auxilios",
    title: "Primeros Auxilios",
    short: "Actúa con seguridad ante cualquier emergencia cotidiana, en casa o en el trabajo.",
    description:
      "Curso práctico para aprender el protocolo PAS, valorar a una víctima y actuar ante hemorragias, quemaduras, atragantamientos, fracturas o pérdidas de conciencia.",
    icon: HeartPulse,
    accent: "red",
    hours: "20 h",
    modality: "Presencial",
    certificate: "Certificado de aprovechamiento",
    requirements: ["Sin requisitos previos"],
    syllabus: [
      "Protocolo PAS y llamada al 112",
      "Valoración primaria y secundaria",
      "Obstrucción de la vía aérea (Heimlich)",
      "Hemorragias, heridas y quemaduras",
      "Posición lateral de seguridad",
      "Traumatismos e inmovilizaciones",
    ],
    featured: true,
  },
  {
    slug: "svb-dea",
    title: "Soporte Vital Básico y DEA",
    short: "RCP de calidad y desfibrilador en adultos, niños y lactantes.",
    description:
      "Formación intensiva y 100 % práctica con maniquíes de retroalimentación. Sal preparado para usar un desfibrilador externo automático en espacios cardioprotegidos.",
    icon: Zap,
    accent: "red",
    hours: "8 h",
    modality: "Presencial",
    certificate: "Certificado SVB + DEA",
    requirements: ["Tener 16 años cumplidos"],
    syllabus: [
      "Cadena de supervivencia",
      "RCP en adulto, niño y lactante",
      "Uso del desfibrilador externo automático",
      "Casos prácticos y simulaciones",
    ],
    featured: true,
  },
  {
    slug: "reciclaje-socorrista",
    title: "Reciclaje de Socorrista",
    short: "Mantén tu titulación al día y actualiza protocolos.",
    description:
      "Para socorristas en activo que necesitan renovar su acreditación. Repaso de técnicas acuáticas, actualización de guías de RCP y evaluación práctica.",
    icon: RefreshCw,
    accent: "navy",
    hours: "20 h",
    modality: "Semipresencial",
    certificate: "Certificado de reciclaje",
    requirements: ["Titulación de socorrista previa"],
    syllabus: [
      "Novedades en las guías de reanimación",
      "Repaso de técnicas de rescate",
      "Evaluación práctica en piscina",
    ],
  },
  {
    slug: "empresas-y-centros",
    title: "Formación para Empresas y Centros",
    short: "Cursos a medida en tus instalaciones: colegios, gimnasios, hoteles y comunidades.",
    description:
      "Diseñamos la formación según tu sector y plantilla. Nos desplazamos a tus instalaciones con todo el material y emitimos certificados para cada participante.",
    icon: Building2,
    accent: "teal",
    hours: "A medida",
    modality: "En tu centro",
    certificate: "Certificado por participante",
    requirements: ["Grupos a partir de 6 personas"],
    syllabus: [
      "Análisis de riesgos de tu instalación",
      "Primeros auxilios adaptados al sector",
      "RCP y DEA para espacios cardioprotegidos",
      "Plan de actuación ante emergencias",
    ],
  },
];

export const getCourse = (slug: string) => COURSES.find((c) => c.slug === slug);
