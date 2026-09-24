import { ArrowRight, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { SITE } from "../data/site";
import { Ecg } from "./Ecg";
import { Reveal } from "./Reveal";

export function CtaBanner() {
  return (
    <section className="container-x mt-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] px-6 py-12 text-white sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-red/30 blur-3xl" />
          <Ecg className="absolute inset-x-0 bottom-6 opacity-40" track="rgb(255 255 255 / 0.1)" />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl font-bold sm:text-4xl">¿Listo para dar el paso?</h2>
            <p className="mt-4 text-white/75">
              Reserva tu plaza en la próxima convocatoria. Te llamamos, resolvemos tus dudas y te ayudamos a elegir el
              curso que encaja contigo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contacto" className="btn btn-primary">
                Preinscribirme <ArrowRight size={16} />
              </Link>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="btn btn-ghost-light">
                <Phone size={16} /> Llamar ahora
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
