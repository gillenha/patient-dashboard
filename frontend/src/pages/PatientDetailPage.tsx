import { ArrowLeft } from "lucide-react"
import { NotesSection } from "@/features/patients/components/NotesSection"
import { SummaryPanel } from "@/features/patients/components/SummaryPanel"
import { Link, useLocation, useParams } from "react-router"

import { ErrorState } from "@/features/patients/components/ErrorState"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PatientActions } from "@/features/patients/components/PatientActions"
import { PatientNotFound } from "@/features/patients/components/PatientNotFound"
import { PatientProfile } from "@/features/patients/components/PatientProfile"
import { readListSearch } from "@/features/patients/listState"
import { parsePatientId } from "@/features/patients/patientId"
import { usePatient } from "@/features/patients/queries"
import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"

import { NotFoundPage } from "./NotFoundPage"

export function PatientDetailPage() {
  const id = parsePatientId(useParams().id)
  if (id === null) return <NotFoundPage />
  return <PatientDetail id={id} />
}

function PatientDetail({ id }: { id: number }) {
  const { data, error, isPending, refetch } = usePatient(id)
  const location = useLocation()
  const backTo = { pathname: "/patients", search: readListSearch(location.state) }

  let content
  if (isPending) {
    content = <DetailSkeleton />
  } else if (!data) {
    content =
      error instanceof ApiError && error.status === 404 ? (
        <PatientNotFound id={id} />
      ) : (
        <ErrorState
          title="Couldn't load patient"
          message={error?.message ?? "Something went wrong."}
          onRetry={() => void refetch()}
        />
      )
  } else {
    content = (
      <>
        <PatientProfile patient={data} />
        <SummaryPanel patientId={id} />
        <NotesSection patientId={id} />
      </>
    )
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Link to={backTo} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}>
          <ArrowLeft className="size-4" />
          Patients
        </Link>
        {data && <PatientActions patient={data} />}
      </div>
      {content}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading patient" className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}
