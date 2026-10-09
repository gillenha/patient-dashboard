import { Link } from "react-router"

import { buttonVariants } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
      <Link to="/" className={buttonVariants()}>
        Back to dashboard
      </Link>
    </div>
  )
}
