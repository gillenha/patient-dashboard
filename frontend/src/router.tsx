import { createBrowserRouter } from "react-router"

export const router = createBrowserRouter([
  { path: "/", element: <div>Dashboard</div> },
  { path: "/patients", element: <div>Patient list</div> },
  { path: "/patients/:id", element: <div>Patient detail</div> },
  { path: "*", element: <div>404</div> },
])