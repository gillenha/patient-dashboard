import { usePatients } from "@/features/patients/queries"

export function PatientsPage() {
  const { data, error, isPending } = usePatients({ page_size: 5 })
  if (isPending) return <p>Loading…</p>
  if (error) return <p>{error.message}</p>
  return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
}
