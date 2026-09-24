import { Clock, Mail, MessageCircle, Phone } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { PreinscripcionForm } from "../components/PreinscripcionForm";
import { Reveal } from "../components/Reveal";
import { COURSES } from "../data/courses";
import { SEDES } from "../data/sedes";
import { SITE } from "../data/site";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export default function Contacto() {
  useDocumentTitle("Contacto y preinscripción");
  const [params] = useSearchParams();
  const sede = SEDES.find((s) => s.city === params.get("sede"))?.city ?? "";
  const curso = COURSES.find((c) => c.slug === params.get("curso"))?.title ?? "";

  const channels = [
    { icon: Phone, label: "Teléfono", value: SITE.phone, href: `tel:${SITE.phone.replace(/\s/g, "")}` },
    { icon: MessageCircle, label: "WhatsApp", value: "Escríbenos", href: `https://wa.me/${SITE.whatsapp}` },
    { icon: Mail, label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
  ];

  return (
    <>
      <PageHeader eyebrow="Contacto" title="Reserva tu plaza o resuelve tus dudas">
        Rellena la preinscripción y te llamamos para confirmar fechas, precio y forma de pago. Sin compromiso.
      </PageHeader>
      <section className="container-x mt-14 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <Reveal>
          <PreinscripcionForm defaultCourse={curso} defaultSede={sede} />
        </Reveal>
        <aside className="space-y-4">
          {channels.map(({ icon: Icon, label, value, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="card card-hover flex items-center gap-4 !p-5"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-soft text-red">
                <Icon size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold tracking-wide text-muted uppercase">{label}</span>
                <span className="block truncate font-semibold text-ink">{value}</span>
              </span>
            </a>
          ))}
          <div className="rounded-2xl border border-line bg-paper p-5 text-sm text-muted">
            <div className="mb-1 flex items-center gap-2 font-semibold text-ink">
              <Clock size={16} /> Horario de atención
            </div>
            Lunes a viernes, 9:00–14:00 y 16:00–19:00
          </div>
        </aside>
      </section>
    </>
  );
}
