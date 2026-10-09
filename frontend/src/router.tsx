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
      { path: "patients/:id", element: <PatientDetailPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
