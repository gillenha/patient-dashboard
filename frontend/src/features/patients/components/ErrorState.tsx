import { Button } from "@/components/ui/button"

type Props = {
  title?: string
  message: string
  onRetry: () => void
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: Props) {
  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/5 flex flex-col items-start gap-3 rounded-lg border p-6"
    >
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground text-sm">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
