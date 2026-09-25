import QRCode from "qrcode";
import { useEffect, useState } from "react";

// Código QR en SVG (nítido a cualquier tamaño, ideal para proyectar).
export function Qr({ value, className = "" }: { value: string; className?: string }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let alive = true;
    QRCode.toString(value, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0d1b2e", light: "#ffffff" } })
      .then((s) => alive && setSvg(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [value]);
  return <div className={`[&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className}`} role="img" aria-label="Código QR para entrar al examen" dangerouslySetInnerHTML={{ __html: svg }} />;
}
