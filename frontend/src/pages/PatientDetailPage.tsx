import { ArrowLeft } from "lucide-react"
import { NotesSection } from "@/features/patients/components/NotesSection"
import { SummaryPanel } from "@/features/patients/components/SummaryPanel"
import { Link, useLocation, useParams } from "react-router"

import { ErrorState } from "@/features/patients/components/ErrorState"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PatientProfile } from "@/features/patients/components/PatientProfile"
import { readListSearch } from "@/features/patients/listState"
import { usePatient } from "@/features/patients/queries"
import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"

import { NotFoundPage } from "./NotFoundPage"

const MAX_ID = 2_147_483_647 // Postgres integer range, matches the API's path validation

export function PatientDetailPage() {
  const raw = useParams().id ?? ""
  const id = /^\d+$/.test(raw) ? Number(raw) : NaN

  if (!Number.isInteger(id) || id < 1 || id > MAX_ID) {
    return <NotFoundPage />
  }
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
      <Link to={backTo} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}>
        <ArrowLeft className="size-4" />
        Patients
      </Link>
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

function PatientNotFound({ id }: { id: number }) {
  return (
    <div className="flex flex-col items-start gap-1 rounded-lg border border-dashed p-10">
      <p className="font-medium">Patient not found</p>
      <p className="text-muted-foreground text-sm">
        No patient exists with ID {id}. The record may have been deleted.
      </p>
    </div>
  )
}
