import { Link } from "react-router-dom";
import { Ecg } from "../components/Ecg";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export default function NotFound() {
  useDocumentTitle("Página no encontrada");
  return (
    <section className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <Ecg className="mb-8 max-w-md" />
      <h1 className="text-6xl font-bold text-ink">404</h1>
      <p className="mt-3 text-muted">No encontramos pulso en esta página.</p>
      <Link to="/" className="btn btn-primary mt-8">
        Volver al inicio
      </Link>
    </section>
  );
}
