import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import Contacto from "./pages/Contacto";
import CourseDetail from "./pages/CourseDetail";
import Courses from "./pages/Courses";
import Escuela from "./pages/Escuela";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Privacidad from "./pages/Privacidad";
import Sedes from "./pages/Sedes";

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/cursos", element: <Courses /> },
      { path: "/cursos/:slug", element: <CourseDetail /> },
      { path: "/sedes", element: <Sedes /> },
      { path: "/escuela", element: <Escuela /> },
      { path: "/contacto", element: <Contacto /> },
      { path: "/privacidad", element: <Privacidad /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
