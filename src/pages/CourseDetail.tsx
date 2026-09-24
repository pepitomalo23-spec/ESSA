import { ArrowLeft, Award, Check, Clock, MonitorSmartphone } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { CourseCard } from "../components/CourseCard";
import { Ecg } from "../components/Ecg";
import { PreinscripcionForm } from "../components/PreinscripcionForm";
import { Reveal } from "../components/Reveal";
import { COURSES, getCourse } from "../data/courses";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import NotFound from "./NotFound";

export default function CourseDetail() {
  const { slug = "" } = useParams();
  const course = getCourse(slug);
  useDocumentTitle(course?.title);
  if (!course) return <NotFound />;

  const Icon = course.icon;
  const others = COURSES.filter((c) => c.slug !== course.slug).slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] text-white">
        <div className="pointer-events-none absolute -top-32 right-[-5%] h-96 w-96 rounded-full bg-red/25 blur-3xl" />
        <div className="container-x relative py-14 sm:py-20">
          <Link to="/cursos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white">
            <ArrowLeft size={16} /> Todos los cursos
          </Link>
          <div className="mt-6 flex items-start gap-5">
            <span className="hidden h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/10 text-white backdrop-blur sm:grid">
              <Icon size={32} />
            </span>
            <div>
              <h1 className="max-w-3xl text-4xl font-bold sm:text-5xl">{course.title}</h1>
              <p className="mt-4 max-w-2xl text-lg text-white/75">{course.short}</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {[
              { icon: Clock, t: course.hours },
              { icon: MonitorSmartphone, t: course.modality },
              { icon: Award, t: course.certificate },
            ].map(({ icon: I, t }) => (
              <span key={t} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-sm font-medium backdrop-blur">
                <I size={15} /> {t}
              </span>
            ))}
          </div>
        </div>
        <Ecg className="-mb-px" track="rgb(255 255 255 / 0.1)" />
      </section>

      <section className="container-x mt-14 grid gap-10 lg:grid-cols-[1fr_26rem]">
        <div className="space-y-10">
          <Reveal>
            <h2 className="text-2xl font-bold text-ink">Sobre el curso</h2>
            <p className="mt-3 leading-relaxed text-ink2">{course.description}</p>
          </Reveal>

          <Reveal>
            <h2 className="text-2xl font-bold text-ink">Qué aprenderás</h2>
            <ol className="mt-5 space-y-3">
              {course.syllabus.map((item, i) => (
                <li key={item} className="flex items-start gap-4 rounded-xl border border-line bg-paper p-4">
                  <span className="font-display text-sm font-bold text-red">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-medium text-ink">{item}</span>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal>
            <h2 className="text-2xl font-bold text-ink">Requisitos</h2>
            <ul className="mt-4 space-y-2.5">
              {course.requirements.map((r) => (
                <li key={r} className="flex items-start gap-3 text-ink2">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green-soft text-green">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start" id="preinscripcion">
          <h2 className="mb-4 text-xl font-bold text-ink">Reserva tu plaza</h2>
          <PreinscripcionForm defaultCourse={course.title} />
        </aside>
      </section>

      <section className="container-x mt-24">
        <h2 className="mb-6 text-2xl font-bold text-ink">Otros cursos que te pueden interesar</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {others.map((c) => (
            <CourseCard key={c.slug} course={c} />
          ))}
        </div>
      </section>
    </>
  );
}
