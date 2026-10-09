import { createBrowserRouter } from "react-router"

import { AppLayout } from "@/components/layout/AppLayout"
import { DashboardPage } from "@/pages/DashboardPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { PatientDetailPage } from "@/pages/PatientDetailPage"
import { PatientsPage } from "@/pages/PatientsPage"

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "patients", element: <PatientsPage /> },
      // Before :id so the static segment is unambiguous, however the matcher ranks them.
      // Both form routes are lazy: they pull in react-hook-form and zod, which nobody
      // browsing the list or dashboard needs to download.
      {
        path: "patients/new",
        lazy: async () => ({
          Component: (await import("@/pages/PatientCreatePage")).PatientCreatePage,
        }),
      },
      { path: "patients/:id", element: <PatientDetailPage /> },
      {
        path: "patients/:id/edit",
        lazy: async () => ({
          Component: (await import("@/pages/PatientEditPage")).PatientEditPage,
        }),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
