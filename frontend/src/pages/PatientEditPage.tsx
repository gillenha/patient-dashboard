import { ArrowLeft } from "lucide-react"
import { Link, useLocation, useParams } from "react-router"

import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/features/patients/components/ErrorState"
import { PatientForm } from "@/features/patients/components/PatientForm"
import { PatientNotFound } from "@/features/patients/components/PatientNotFound"
import { readListSearch } from "@/features/patients/listState"
import { parsePatientId } from "@/features/patients/patientId"
import { usePatient, useUpdatePatient } from "@/features/patients/queries"
import { patientToFormValues } from "@/features/patients/schema"
import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"

import { NotFoundPage } from "./NotFoundPage"

export function PatientEditPage() {
  const id = parsePatientId(useParams().id)
  if (id === null) return <NotFoundPage />
  return <PatientEdit id={id} />
}

function PatientEdit({ id }: { id: number }) {
  const { data, error, isPending, refetch } = usePatient(id)
  const update = useUpdatePatient(id)
  const listSearch = readListSearch(useLocation().state)
  const detailTo = { pathname: `/patients/${id}` }

  let content
  if (isPending) {
    content = <FormSkeleton />
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
        <div>
          <h1 className="text-2xl font-semibold">
            Edit {data.first_name} {data.last_name}
          </h1>
          <p className="text-muted-foreground text-sm">
            Required fields are marked with an asterisk.
          </p>
        </div>
        <PatientForm
          defaultValues={patientToFormValues(data)}
          submitLabel="Save changes"
          cancelTo={detailTo}
          cancelState={{ listSearch }}
          onSave={(input) => update.mutateAsync(input)}
        />
      </>
    )
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link
        to={detailTo}
        state={{ listSearch }}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft className="size-4" />
        Back to patient
      </Link>
      {content}
    </div>
  )
}

function FormSkeleton() {
  return (
    <div role="status" aria-label="Loading patient" className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-72" />
      <Skeleton className="h-56" />
    </div>
  )
}
