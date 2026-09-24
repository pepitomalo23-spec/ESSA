# ESSA · Web de la escuela

Web pública de la **Escuela de Salvamento y Socorrismo Acuático**: cursos, sedes, la escuela y formulario de
preinscripción. Toma el estilo de la app de evaluación de alumnos (marino + rojo, tarjetas con franja
superior y la línea de electrocardiograma) y lo lleva a una web completa.

## Qué incluye

- **Páginas**: Inicio, Cursos, ficha de cada curso, Sedes, La escuela, Contacto/Preinscripción, Privacidad y 404.
- **Preinscripción** guardada en Supabase, con validación, protección anti-bots y alternativa por email si no
  hay backend configurado.
- **Modo claro/oscuro** (sigue al sistema y se puede cambiar a mano), diseño adaptado a móvil y animaciones
  que se desactivan si el usuario pide menos movimiento.
- **Accesibilidad**: enlace para saltar al contenido, foco visible, etiquetas y errores asociados a cada campo.
- **Rendimiento y privacidad**: fuentes alojadas en la propia web (sin Google Fonts) y SDK de Supabase
  cargado solo al enviar el formulario.

Stack: React 19 · Vite · TypeScript · Tailwind CSS 4 · Motion · React Router · Supabase.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # y rellena las variables
npm run dev                  # http://localhost:3000
```

| Variable | Para qué |
| --- | --- |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Guardar preinscripciones. Sin ellas, el formulario abre el correo. |
| `VITE_EVALUACION_URL` | Enlace "Acceso alumnos" a la app de evaluación. Si está vacío, no se muestra. |

### Supabase

Aplica `supabase/migrations/20260924000000_preinscripciones.sql` (SQL Editor o `supabase db push`). Crea la tabla
`preinscripciones` con RLS: la web solo puede **insertar**; las solicitudes se consultan desde el panel de
Supabase.

### Despliegue

Preparado para Vercel (`vercel.json` incluye las reescrituras de rutas y cabeceras de seguridad). Configura las
mismas variables de entorno en el proyecto.

## Antes de publicar: contenido a revisar

Todo el contenido editable está en `src/data/`:

- `site.ts` — teléfono, email, WhatsApp, dirección y redes (marcados con `TODO`).
- `courses.ts` — horas, requisitos y temario de cada curso (orientativos).
- `sedes.ts` — ciudades y, opcionalmente, instalación de prácticas.
- `faq.ts` — preguntas frecuentes.

Revisa también los textos de `src/pages/Escuela.tsx` y sustituye la política de privacidad provisional de
`src/pages/Privacidad.tsx` por el texto legal definitivo.
