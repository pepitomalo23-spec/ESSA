// La página no se desplaza entera: cada pantalla tiene su zona de contenido con id="scroll-root".
export function scrollToTop() {
  document.getElementById("scroll-root")?.scrollTo({ top: 0 });
}
