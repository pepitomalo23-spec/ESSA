import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Award, GraduationCap, MapPin, MonitorSmartphone, ShieldCheck, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { CourseCard } from "../components/CourseCard";
import { CtaBanner } from "../components/CtaBanner";
import { Ecg } from "../components/Ecg";
import { Faq } from "../components/Faq";
import { LogoMark } from "../components/Logo";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { COURSES } from "../data/courses";
import { SEDES } from "../data/sedes";
import { SITE } from "../data/site";
import { useDocumentTitle } from "../lib/useDocumentTitle";

const FEATURES = [
  { icon: Users, title: "Grupos reducidos", text: "Más tiempo en el agua y atención personalizada de tu instructor." },
  { icon: ShieldCheck, title: "Instructores en activo", text: "Socorristas y sanitarios que trabajan cada temporada en emergencias reales." },
  { icon: MonitorSmartphone, title: "Evaluación online", text: "Exámenes teóricos desde el móvil con nuestra propia plataforma de evaluación." },
  { icon: Award, title: "Material profesional", text: "Maniquíes con retroalimentación, DEA de entrenamiento y material de rescate profesional." },
];

const STEPS = [
  { n: "01", title: "Preinscríbete", text: "Elige curso y sede. Te llamamos para resolver dudas y confirmar fechas." },
  { n: "02", title: "Teoría a tu ritmo", text: "Accede al temario online y prepárate con tests de repaso." },
  { n: "03", title: "Prácticas reales", text: "Sesiones en piscina y playa con simulacros de rescate y RCP." },
  { n: "04", title: "Evalúate y certifícate", text: "Examen teórico online y prueba práctica. ¡Ya estás listo!" },
];

export default function Home() {
  useDocumentTitle();
  const reduce = useReducedMotion();
  const featured = COURSES.filter((c) => c.featured);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--hero-from)] via-[var(--hero-to)] to-[var(--hero-from)] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="pointer-events-none absolute -top-32 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-red/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-10rem] left-[-10%] h-[26rem] w-[26rem] rounded-full bg-sky-500/20 blur-3xl" />

        <div className="container-x relative grid items-center gap-12 pt-16 pb-28 sm:pt-24 lg:grid-cols-[1.15fr_0.85fr] lg:pb-36">
          <div>
            <motion.span
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red" />
              </span>
              Matrícula abierta · {SEDES.length} sedes en Andalucía
            </motion.span>
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 text-4xl leading-[1.05] font-bold sm:text-6xl"
            >
              Formamos a quienes <span className="text-red">salvan vidas</span>.
            </motion.h1>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-white/75"
            >
              Cursos de socorrismo acuático, primeros auxilios y RCP/DEA con prácticas reales en piscina y playa.
              Consigue tu titulación y trabaja esta temporada.
            </motion.p>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-9 flex flex-wrap gap-3"
            >
              <Link to="/cursos" className="btn btn-primary px-6 py-3.5">
                Ver cursos <ArrowRight size={17} />
              </Link>
              <Link to="/contacto" className="btn btn-ghost-light px-6 py-3.5">
                Solicitar información
              </Link>
            </motion.div>
          </div>

          {/* Tarjeta flotante con el pulso: guiño a la app de evaluación */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="float-slow hidden lg:block"
          >
            <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LogoMark className="h-11 w-11" />
                  <div>
                    <div className="font-display font-bold">Evaluación ESSA</div>
                    <div className="text-xs text-white/60">Primeros Auxilios · Pregunta 5 de 7</div>
                  </div>
                </div>
                <span className="rounded-full bg-green-500/20 px-2.5 py-1 text-[11px] font-bold text-green-300">EN CURSO</span>
              </div>
              <Ecg className="my-5" track="rgb(255 255 255 / 0.12)" />
              <p className="font-semibold">¿Cómo se coloca a una persona inconsciente que respira?</p>
              <div className="mt-4 space-y-2 text-sm">
                {["Boca arriba", "Posición lateral de seguridad", "Sentada"].map((o, i) => (
                  <div
                    key={o}
                    className={`rounded-xl border px-4 py-2.5 ${
                      i === 1 ? "border-green-400/60 bg-green-500/15 font-semibold" : "border-white/10 bg-white/5 text-white/70"
                    }`}
                  >
                    {o}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Olas */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-16 overflow-hidden sm:h-24" aria-hidden="true">
          <svg className="wave-move absolute bottom-0 h-full w-[200%]" viewBox="0 0 1440 100" preserveAspectRatio="none">
            <path
              d="M0,60 C120,90 240,30 360,60 C480,90 600,30 720,60 C840,90 960,30 1080,60 C1200,90 1320,30 1440,60 L1440,100 L0,100 Z"
              fill="var(--bg)"
              opacity="0.5"
            />
          </svg>
          <svg className="absolute bottom-0 h-full w-full" viewBox="0 0 1440 100" preserveAspectRatio="none">
            <path d="M0,70 C240,40 480,95 720,70 C960,45 1200,95 1440,70 L1440,100 L0,100 Z" fill="var(--bg)" />
          </svg>
        </div>
      </section>

      {/* CIFRAS / GARANTÍAS */}
      <section className="container-x relative z-10 -mt-10">
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-paper p-3 shadow-xl shadow-slate-900/5 lg:grid-cols-4">
          {[
            { icon: MapPin, k: `${SEDES.length} sedes`, v: "en toda Andalucía" },
            { icon: GraduationCap, k: `${COURSES.length} cursos`, v: "de iniciación a reciclaje" },
            { icon: Users, k: "Grupos", v: "reducidos y prácticos" },
            { icon: Star, k: "Reseñas", v: "verificadas en Google" },
          ].map(({ icon: Icon, k, v }) => (
            <div key={k} className="flex items-center gap-3 rounded-xl p-3 sm:p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-soft text-navy-mid">
                <Icon size={19} />
              </span>
              <div className="min-w-0">
                <div className="font-display text-base font-bold text-ink sm:text-lg">{k}</div>
                <div className="text-xs leading-snug text-muted">{v}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CURSOS DESTACADOS */}
      <section className="container-x mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Nuestros cursos" title="Elige tu formación">
            Desde un curso de RCP de una mañana hasta la titulación completa de socorrista.
          </SectionHeading>
          <Link to="/cursos" className="btn btn-outline mb-10">
            Todos los cursos <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {featured.map((c, i) => (
            <Reveal key={c.slug} delay={i * 0.08}>
              <CourseCard course={c} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* POR QUÉ ESSA */}
      <section className="container-x mt-28 grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading eyebrow="Por qué ESSA" title={<>Aprender a salvar vidas, <span className="text-red">de verdad</span>.</>}>
            No se trata de aprobar un examen: se trata de saber qué hacer en los segundos que importan. Por eso
            nuestras clases son prácticas desde el primer día.
          </SectionHeading>
          <Link to="/escuela" className="btn btn-outline">
            Conoce la escuela <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.06}>
              <div className="card h-full">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-soft text-red">
                  <Icon size={21} />
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="container-x mt-28">
        <SectionHeading eyebrow="Paso a paso" title="Así es tu formación" center />
        <div className="relative">
          <Ecg className="absolute inset-x-0 top-6 hidden lg:block" />
          <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <div className="text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border-4 border-bg bg-navy font-display text-sm font-bold text-white shadow-lg dark:bg-navy-mid">
                    {s.n}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-ink">{s.title}</h3>
                  <p className="mx-auto mt-1.5 max-w-60 text-sm leading-relaxed text-muted">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* OPINIONES */}
      <section className="container-x mt-28">
        <Reveal>
          <div className="card flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div className="flex shrink-0 gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={26} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-ink">¿Has hecho un curso con nosotros?</h2>
              <p className="mt-1 text-sm text-muted">
                Tu opinión ayuda a otros alumnos a decidirse y a nosotros a mejorar cada convocatoria.
              </p>
            </div>
            <a href={SITE.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline shrink-0">
              Déjanos tu reseña en Google
            </a>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="container-x mt-28 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading eyebrow="Preguntas frecuentes" title="Resolvemos tus dudas">
          ¿No encuentras lo que buscas? <Link to="/contacto" className="font-semibold text-red">Escríbenos</Link> y
          te respondemos en menos de 24 h.
        </SectionHeading>
        <Reveal>
          <Faq />
        </Reveal>
      </section>

      <CtaBanner />
    </>
  );
}
