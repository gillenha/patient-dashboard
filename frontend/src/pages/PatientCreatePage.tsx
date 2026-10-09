import { ArrowLeft } from "lucide-react"
import { Link, useLocation } from "react-router"

import { buttonVariants } from "@/components/ui/button"
import { PatientForm } from "@/features/patients/components/PatientForm"
import { readListSearch } from "@/features/patients/listState"
import { useCreatePatient } from "@/features/patients/queries"
import { emptyPatientFormValues } from "@/features/patients/schema"
import { cn } from "@/lib/utils"

export function PatientCreatePage() {
  const create = useCreatePatient()
  const listSearch = readListSearch(useLocation().state)
  const listTo = { pathname: "/patients", search: listSearch }

  return (
    <div className="max-w-3xl space-y-4">
      <Link to={listTo} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}>
        <ArrowLeft className="size-4" />
        Patients
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">New patient</h1>
        <p className="text-muted-foreground text-sm">
          Required fields are marked with an asterisk.
        </p>
      </div>

      <PatientForm
        defaultValues={emptyPatientFormValues()}
        submitLabel="Create patient"
        cancelTo={listTo}
        cancelState={{ listSearch }}
        onSave={(input) => create.mutateAsync(input)}
      />
    </div>
  )
}
