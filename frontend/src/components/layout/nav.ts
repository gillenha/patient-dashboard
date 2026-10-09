import { LayoutDashboard, Users } from "lucide-react"

export const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/patients", label: "Patients", icon: Users, end: false },
] as const
