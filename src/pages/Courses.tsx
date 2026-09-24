import { CourseCard } from "../components/CourseCard";
import { CtaBanner } from "../components/CtaBanner";
import { PageHeader } from "../components/PageHeader";
import { Reveal } from "../components/Reveal";
import { COURSES } from "../data/courses";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export default function Courses() {
  useDocumentTitle("Cursos");
  return (
    <>
      <PageHeader eyebrow="Oferta formativa" title="Cursos de socorrismo y primeros auxilios">
        Titulaciones completas, cursos cortos y formación a medida. Todos con prácticas reales y evaluación online.
      </PageHeader>
      <section className="container-x mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {COURSES.map((c, i) => (
          <Reveal key={c.slug} delay={(i % 3) * 0.06}>
            <CourseCard course={c} />
          </Reveal>
        ))}
      </section>
      <CtaBanner />
    </>
  );
}
