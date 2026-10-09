import { useParams } from "react-router"

import { NotFoundPage } from "./NotFoundPage"

export function PatientDetailPage() {
  const params = useParams()
  const id = Number(params.id)

  if (!Number.isInteger(id) || id < 1) {
    return <NotFoundPage />
  }

  return <h1 className="text-2xl font-semibold">Patient {id}</h1>
}
