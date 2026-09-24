import { PageHeader } from "../components/PageHeader";
import { SITE } from "../data/site";
import { useDocumentTitle } from "../lib/useDocumentTitle";

// TODO: sustituir por el texto legal definitivo (RGPD / LOPDGDD) con los datos fiscales de la escuela.
export default function Privacidad() {
  useDocumentTitle("Política de privacidad");
  return (
    <>
      <PageHeader eyebrow="Legal" title="Política de privacidad" />
      <section className="container-x mt-12 max-w-3xl space-y-5 leading-relaxed text-ink2">
        <p>
          <strong>Responsable:</strong> {SITE.fullName}. Contacto: {SITE.email}.
        </p>
        <p>
          <strong>Finalidad:</strong> gestionar tu solicitud de información o preinscripción y contactarte en relación
          con ella.
        </p>
        <p>
          <strong>Legitimación:</strong> tu consentimiento, que puedes retirar en cualquier momento.
        </p>
        <p>
          <strong>Conservación:</strong> el tiempo necesario para atender tu solicitud y, en su caso, durante la
          relación formativa.
        </p>
        <p>
          <strong>Derechos:</strong> puedes ejercer tus derechos de acceso, rectificación, supresión, oposición,
          limitación y portabilidad escribiendo a {SITE.email}.
        </p>
      </section>
    </>
  );
}
