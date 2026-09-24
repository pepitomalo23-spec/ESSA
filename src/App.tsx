import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import StudentApp from "./student/StudentApp";

// El panel del personal se descarga solo cuando alguien entra en /personal.
const StaffApp = lazy(() => import("./staff/StaffApp"));

const router = createBrowserRouter([
  { path: "/", element: <StudentApp /> },
  {
    path: "/personal",
    element: (
      <Suspense fallback={null}>
        <StaffApp />
      </Suspense>
    ),
  },
  { path: "*", element: <StudentApp /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
