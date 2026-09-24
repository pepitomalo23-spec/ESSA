import { Mail, MapPin, MonitorSmartphone, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { COURSES } from "../data/courses";
import { NAV, SITE } from "../data/site";
import { Ecg } from "./Ecg";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 bg-[var(--hero-from)] text-white/70">
      <Ecg className="opacity-60" track="rgb(255 255 255 / 0.08)" />
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            {SITE.tagline}: cursos de socorrismo acuático, primeros auxilios y RCP/DEA con prácticas reales en piscina y playa.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold tracking-[0.14em] text-white uppercase">Cursos</h3>
          <ul className="space-y-2.5 text-sm">
            {COURSES.slice(0, 5).map((c) => (
              <li key={c.slug}>
                <Link to={`/cursos/${c.slug}`} className="transition hover:text-white">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold tracking-[0.14em] text-white uppercase">Escuela</h3>
          <ul className="space-y-2.5 text-sm">
            {NAV.slice(1).map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="transition hover:text-white">
                  {n.label}
                </Link>
              </li>
            ))}
            {SITE.evaluacionUrl && (
              <li>
                <a
                  href={SITE.evaluacionUrl}
                  className="inline-flex items-center gap-1.5 font-semibold text-white transition hover:text-red-300"
                >
                  <MonitorSmartphone size={15} /> Acceso alumnos · Evaluación
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-bold tracking-[0.14em] text-white uppercase">Contacto</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="flex items-center gap-2.5 hover:text-white">
                <Phone size={15} /> {SITE.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-2.5 hover:text-white">
                <Mail size={15} /> {SITE.email}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin size={15} /> {SITE.address}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {SITE.fullName}
          </span>
          <span>
            En caso de emergencia llama al <strong className="text-white">112</strong>
          </span>
        </div>
      </div>
    </footer>
  );
}
