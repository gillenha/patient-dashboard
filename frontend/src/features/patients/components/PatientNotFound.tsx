export function PatientNotFound({ id }: { id: number }) {
  return (
    <div className="flex flex-col items-start gap-1 rounded-lg border border-dashed p-10">
      <p className="font-medium">Patient not found</p>
      <p className="text-muted-foreground text-sm">
        No patient exists with ID {id}. The record may have been deleted.
      </p>
    </div>
  )
}
