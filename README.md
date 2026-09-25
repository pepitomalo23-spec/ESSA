# ESSA · Evaluación

App de exámenes de la **Escuela de Salvamento y Socorrismo Acuático**. Es la evolución de la app de evaluación
original (AI Studio + Firebase), con el mismo aspecto (marino y rojo, tarjetas con franja y la línea de
electrocardiograma) y todas sus funciones, más seguridad real y varias mejoras.

## Cómo funciona

**Alumno** (`/`)
1. Escribe su nombre, elige ciudad e introduce el PIN de 6 cifras que le da el instructor.
2. Espera en la sala hasta que el instructor inicia el examen (empieza solo).
3. Responde con cuenta atrás; la línea de ECG avanza con cada pregunta.
4. Si sale de la pantalla (cambia de app o de pestaña), el examen se pone en pausa y solo sigue cuando el instructor le
   deja continuar desde la sala. El bloqueo está en el servidor: recargar la página no lo quita.
5. Ve su nota (APTO / NO APTO) al momento. La corrección con explicaciones le aparece sola cuando el instructor la
   muestra, para que nadie pase respuestas a quien sigue examinándose.
6. Una vez dentro, se queda dentro en su móvil aunque cierre el navegador: al volver a abrir la web sigue en su examen o
   en su resultado.
7. Valora el curso; con nota alta se le invita a dejar reseña en Google.

**Instructor** (`/personal`)
- Abre un examen por ciudad → se genera el PIN → ve la sala de espera en directo.
- **Proyectar**: muestra a pantalla completa la dirección, el código y un QR. Al escanearlo, el alumno entra con la
  ciudad y el código ya puestos; solo escribe su nombre.
- Elige la duración e inicia el examen para todos; puede ampliar 5 minutos o terminarlo.
- Seguimiento en directo: quién espera, quién responde (y cuántas lleva), quién terminó y con qué nota, quién abandonó y
  cuántas veces salió de la pantalla. Los alumnos bloqueados aparecen resaltados con el botón «Dejar continuar».
- **Mostrar corrección**: desde la sala (o después, en «Tus últimos exámenes») decide cuándo ven los alumnos las
  respuestas correctas; puede volver a ocultarlas.
- Historial por ciudad → día → alumno → preguntas falladas, con buscador de alumnos. Exportación a CSV.
- Estadísticas: aprobados, nota media, valoración media, preguntas que más se fallan y últimas opiniones.

**Administrador** (además de lo anterior)
- Preguntas (2 a 6 opciones, correcta y explicación), ciudades, cuentas del personal (crear, cambiar contraseña,
  eliminar), alumnos autorizados y ajustes (nombre de la evaluación, preguntas por examen, nota de aprobado,
  duración por defecto, orden aleatorio, mostrar correcciones, reseña de Google).

## Mejoras respecto a la versión original

- **Las respuestas correctas ya no viajan al móvil del alumno**: la corrección se hace en el servidor.
- **Sin contraseñas en el código**: la clave maestra `ESSA-TEST` desaparece; cada persona tiene su cuenta.
- **Las respuestas se guardan una a una**: si se va la conexión o se acaba el tiempo, no se pierde nada.
- **Mismo reloj para todos**: la cuenta atrás se sincroniza con la hora del servidor.
- **Recarga segura**: si el alumno recarga la página, vuelve a su examen donde lo dejó.
- **Historial fiel**: cada resultado guarda las preguntas tal como eran, aunque luego se editen.
- **Alumnos autorizados funciona de verdad**: con la lista activa se pide el email y solo entran los de la lista.
- Diálogos propios en lugar de ventanas del navegador, y accesibilidad (teclado, lectores de pantalla).
- Aviso de «sin conexión» y título en cada pestaña.
- **Instalar como app**: la primera vez que un instructor entra en `/personal` le sale un aviso para ponerla en la
  pantalla de inicio (con un toque en Android y en Chrome/Edge; en iPhone, con los pasos de Safari). Si lo cierra,
  la tiene siempre en «Instalar app». Instalada desde el panel, abre directamente `/personal`.
- **Vista previa al compartir** (WhatsApp, Telegram…): el enlace de alumnos (`/`, también el del QR) muestra la imagen
  del acceso al examen, y el de instructores (`/personal`) la del panel del personal. Las imágenes están en
  `public/og-alumnos-examen.jpg` y `public/og-instructores.jpg`. En Vercel la dirección completa de la imagen se toma sola del dominio de producción; fuera de
  Vercel, define `VITE_SITE_URL` (p. ej. `https://examen.essa.es`) al compilar.

## Puesta en marcha

```bash
npm install
npm run dev   # http://localhost:3000
```

Ya apunta al proyecto de Supabase `essa-web` (la clave publicable es pública por diseño). Para usar otro proyecto,
copia `.env.example` a `.env.local`.

**Primera vez:** entra en `/personal`. Como aún no hay administrador, aparece el formulario para crear el tuyo. Después
desaparece y ya puedes dar de alta a los instructores desde la pestaña *Personal*.

## Backend (Supabase)

- `supabase/migrations/` — tablas, políticas RLS, funciones del examen y datos iniciales (8 ciudades y las 7
  preguntas originales).
- `supabase/functions/staff-admin/` — alta y baja de cuentas del personal (usa la clave privada, solo en el servidor).

Los alumnos no tienen cuenta: solo pueden llamar a las funciones del examen con el token de su intento. El personal
solo lee datos si su cuenta está en la tabla `staff`.

## Despliegue

Preparado para Vercel (`vercel.json`: rutas de la app y cabeceras de seguridad). Cada push a `main` se publica si el
repositorio está conectado al proyecto de Vercel.
