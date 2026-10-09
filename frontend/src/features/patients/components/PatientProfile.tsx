import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { formatDate, formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

import type { Patient } from "../types"
import { StatusBadge } from "./StatusBadge"

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-card rounded-lg border p-5">
      <h2 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wide uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  )
}

function TagList({ items, alert = false }: { items: string[]; alert?: boolean }) {
  if (items.length === 0) return <span className="text-muted-foreground">None recorded</span>
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item}>
          <Badge
            variant="outline"
            className={cn(alert && "border-destructive/40 text-destructive")}
          >
            {item}
          </Badge>
        </li>
      ))}
    </ul>
  )
}

export function PatientProfile({ patient: p }: { patient: Patient }) {
  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {p.first_name} {p.last_name}
          </h1>
          <StatusBadge status={p.status} />
        </div>
        <p className="text-muted-foreground text-sm">
          {p.age} years old · Born {formatDate(p.date_of_birth)}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Contact">
          <dl className="space-y-3">
            <Field label="Email">
              <a href={`mailto:${p.email}`} className="break-all hover:underline">
                {p.email}
              </a>
            </Field>
            <Field label="Phone">
              <a href={`tel:${p.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
                {p.phone}
              </a>
            </Field>
            <Field label="Address">
              <address className="not-italic">
                {p.address_line1}
                <br />
                {p.city}, {p.state} {p.postal_code}
              </address>
            </Field>
          </dl>
        </Section>

        <Section title="Medical">
          <dl className="space-y-3">
            <Field label="Blood type">{p.blood_type}</Field>
            <Field label="Last visit">{formatDate(p.last_visit)}</Field>
            <Field label="Allergies">
              <TagList items={p.allergies} alert />
            </Field>
            <Field label="Conditions">
              <TagList items={p.conditions} />
            </Field>
          </dl>
        </Section>
      </div>

      <p className="text-muted-foreground text-xs">Record updated {formatDateTime(p.updated_at)}</p>
    </div>
  )
}
