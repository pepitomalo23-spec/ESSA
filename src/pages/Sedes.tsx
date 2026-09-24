import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { CtaBanner } from "../components/CtaBanner";
import { PageHeader } from "../components/PageHeader";
import { Reveal } from "../components/Reveal";
import { SEDES } from "../data/sedes";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export default function Sedes() {
  useDocumentTitle("Sedes");
  return (
    <>
      <PageHeader eyebrow="Dónde estamos" title={<>Presentes en {SEDES.length} provincias andaluzas</>}>
        Fórmate cerca de casa. Cada sede cuenta con instalación acuática para las prácticas y equipo
        de instructores propio.
      </PageHeader>
      <section className="container-x mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SEDES.map((s, i) => (
          <Reveal key={s.city} delay={(i % 4) * 0.05}>
            <div className="card card-hover h-full">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-soft text-navy-mid">
                <MapPin size={21} />
              </span>
              <h2 className="mt-4 text-xl font-bold text-ink">{s.city}</h2>
              <p className="text-sm text-muted">{s.venue ?? `Provincia de ${s.province}`}</p>
              <Link
                to={`/contacto?sede=${encodeURIComponent(s.city)}`}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-red"
              >
                Próximas fechas <ArrowRight size={15} />
              </Link>
            </div>
          </Reveal>
        ))}
      </section>
      <section className="container-x mt-10">
        <p className="rounded-2xl border border-dashed border-line bg-paper p-6 text-center text-sm text-muted">
          ¿Tu ciudad no está en la lista? Organizamos cursos en cualquier municipio a partir de 6 alumnos.{" "}
          <Link to="/contacto" className="font-semibold text-red">
            Pídenos uno
          </Link>
          .
        </p>
      </section>
      <CtaBanner />
    </>
  );
}
