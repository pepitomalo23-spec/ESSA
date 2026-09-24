// Datos generales de la escuela. Revisa y sustituye los marcados con TODO
// antes de publicar: aparecen en la cabecera, el pie y la página de contacto.
export const SITE = {
  name: "ESSA",
  fullName: "Escuela de Salvamento y Socorrismo Acuático",
  tagline: "Formamos a quienes salvan vidas",
  email: "info@tu-dominio.es", // TODO
  phone: "+34 600 000 000", // TODO
  whatsapp: "34600000000", // TODO: solo dígitos, con prefijo de país
  address: "Andalucía, España", // TODO
  googleReviewUrl: "https://g.page/r/CUIh39kNAh_XEBM/review",
  evaluacionUrl: import.meta.env.VITE_EVALUACION_URL as string | undefined,
  social: {
    instagram: "", // TODO: https://instagram.com/...
    facebook: "", // TODO
  },
};

export const NAV = [
  { to: "/", label: "Inicio" },
  { to: "/cursos", label: "Cursos" },
  { to: "/sedes", label: "Sedes" },
  { to: "/escuela", label: "La escuela" },
  { to: "/contacto", label: "Contacto" },
];
