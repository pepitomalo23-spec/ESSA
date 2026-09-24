import { HeartPulse, LifeBuoy, ShieldCheck, Users } from "lucide-react";
import { CtaBanner } from "../components/CtaBanner";
import { PageHeader } from "../components/PageHeader";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { SITE } from "../data/site";
import { useDocumentTitle } from "../lib/useDocumentTitle";

const VALUES = [
  { icon: LifeBuoy, title: "Práctica ante todo", text: "La mayor parte del curso ocurre en el agua y con maniquíes, no en una silla." },
  { icon: ShieldCheck, title: "Rigor", text: "Seguimos las recomendaciones vigentes en reanimación y la normativa de cada comunidad." },
  { icon: Users, title: "Cercanía", text: "Grupos reducidos, instructores accesibles y seguimiento hasta que consigues trabajo." },
  { icon: HeartPulse, title: "Vocación", text: "Somos socorristas. Enseñamos lo que hacemos cada verano." },
];

export default function Escuela() {
  useDocumentTitle("La escuela");
  return (
    <>
      <PageHeader eyebrow="La escuela" title={SITE.fullName}>
        Una escuela creada por socorristas para formar a la próxima generación de profesionales del salvamento
        acuático y a cualquier persona que quiera saber actuar ante una emergencia.
      </PageHeader>

      <section className="container-x mt-16 grid gap-12 lg:grid-cols-2 lg:items-start">
        <SectionHeading eyebrow="Nuestra misión" title="Que nadie se quede sin ayuda por no saber qué hacer">
          Cada minuto sin RCP reduce las posibilidades de supervivencia. Por eso creemos que la formación en
          primeros auxilios debe ser accesible, práctica y de calidad, y que un socorrista bien formado marca la
          diferencia en cada instalación.
        </SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          {VALUES.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.06}>
              <div className="card h-full">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-soft text-navy-mid">
                  <Icon size={21} />
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {SITE.evaluacionUrl && (
        <section className="container-x mt-20">
          <Reveal>
            <div className="card sm:flex sm:items-center sm:justify-between sm:gap-8">
              <div>
                <h2 className="text-2xl font-bold text-ink">Plataforma de evaluación online</h2>
                <p className="mt-2 max-w-xl text-sm text-muted">
                  Nuestros alumnos realizan el examen teórico desde el móvil. El instructor abre la sesión y cada
                  alumno entra con su código PIN.
                </p>
              </div>
              <a href={SITE.evaluacionUrl} className="btn btn-primary mt-5 shrink-0 sm:mt-0">
                Acceso alumnos
              </a>
            </div>
          </Reveal>
        </section>
      )}

      <CtaBanner />
    </>
  );
}
