import { ArrowRight, Clock, MonitorSmartphone } from "lucide-react";
import { Link } from "react-router-dom";
import type { Course } from "../data/courses";

const ACCENTS = {
  red: "bg-red-soft text-red",
  navy: "bg-navy-soft text-navy-mid",
  teal: "bg-teal-soft text-teal",
};

export function CourseCard({ course }: { course: Course }) {
  const Icon = course.icon;
  return (
    <Link to={`/cursos/${course.slug}`} className="card card-hover group flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-12 w-12 place-items-center rounded-xl ${ACCENTS[course.accent]}`}>
          <Icon size={24} strokeWidth={2} />
        </span>
        {course.featured && <span className="chip border-red/20 text-red">Más demandado</span>}
      </div>
      <h3 className="mt-5 text-xl font-bold text-ink">{course.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{course.short}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="chip">
          <Clock size={13} /> {course.hours}
        </span>
        <span className="chip">
          <MonitorSmartphone size={13} /> {course.modality}
        </span>
      </div>
      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-red">
        Ver curso
        <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
