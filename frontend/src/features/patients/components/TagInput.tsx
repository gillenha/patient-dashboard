import { X } from "lucide-react"
import { useRef, useState } from "react"
import type { ClipboardEvent, KeyboardEvent, Ref } from "react"

import { cn } from "@/lib/utils"

import { MAX_TAG_LENGTH, MAX_TAGS } from "../schema"

type Props = {
  id: string
  value: string[]
  onChange: (next: string[]) => void
  onBlur?: () => void
  /** Plural noun used in the limit messages, e.g. "allergies". */
  itemLabel: string
  placeholder?: string
  inputRef?: Ref<HTMLInputElement>
  "aria-invalid"?: true
  "aria-describedby"?: string
}

/**
 * Chips input: type and press Enter (or comma) to add, Backspace on an empty
 * input removes the last chip. Duplicates are compared case-insensitively, the
 * way the server dedupes them.
 */
export function TagInput({
  id,
  value,
  onChange,
  onBlur,
  itemLabel,
  placeholder,
  inputRef,
  "aria-invalid": invalid,
  "aria-describedby": describedBy,
}: Props) {
  const [draft, setDraft] = useState("")
  const [notice, setNotice] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  /** Adds entries, explaining the first rejection. Returns the rejected entries. */
  function add(parts: string[]): string {
    const next = [...value]
    const rejected: string[] = []
    let message = ""
    for (const part of parts) {
      const tag = part.trim()
      if (tag === "") continue
      if (next.length >= MAX_TAGS) {
        message ||= `You can add at most ${MAX_TAGS} ${itemLabel}.`
        rejected.push(tag)
      } else if (tag.length > MAX_TAG_LENGTH) {
        message ||= `Keep each entry to ${MAX_TAG_LENGTH} characters or fewer.`
        rejected.push(tag)
      } else if (next.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
        message ||= `“${tag}” is already listed.`
        rejected.push(tag)
      } else {
        next.push(tag)
      }
    }
    setNotice(message)
    if (next.length !== value.length) onChange(next)
    return rejected.join(", ")
  }

  function commitDraft() {
    if (draft.trim() === "") {
      setDraft("")
      return
    }
    setDraft(add([draft]))
  }

  function remove(index: number) {
    setNotice("")
    onChange(value.filter((_, i) => i !== index))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      // Enter must not submit the form while the user is still entering chips.
      event.preventDefault()
      commitDraft()
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      event.preventDefault()
      remove(value.length - 1)
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text")
    if (!text.includes(",") && !text.includes("\n")) return
    event.preventDefault()
    // "Peanuts, latex" becomes two chips; anything already typed is committed first.
    add([draft, ...text.split(/[,\n]/)])
    setDraft("")
  }

  return (
    <div className="space-y-1.5">
      <div
        ref={containerRef}
        onClick={(event) => {
          // Clicking the padding (not a chip's remove button) focuses the input.
          if (event.target === containerRef.current) {
            containerRef.current.querySelector("input")?.focus()
          }
        }}
        className={cn(
          "border-input bg-background focus-within:border-ring focus-within:ring-ring/50",
          "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5",
          "focus-within:ring-[3px]",
          invalid && "border-destructive",
        )}
      >
        {value.map((tag, index) => (
          <span
            key={tag}
            className="bg-muted inline-flex max-w-full items-center gap-1 rounded px-2 py-0.5 text-sm"
          >
            <span className="truncate">{tag}</span>
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => remove(index)}
              className="hover:text-destructive focus-visible:ring-ring/50 rounded focus-visible:ring-[2px] focus-visible:outline-none"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={draft}
          placeholder={value.length === 0 ? placeholder : undefined}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(event) => {
            const text = event.target.value
            setNotice("")
            // A typed comma commits what precedes it and keeps the rest pending.
            if (text.includes(",")) {
              const parts = text.split(",")
              const trailing = parts.pop() ?? ""
              add(parts)
              setDraft(trailing)
            } else {
              setDraft(text)
            }
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => {
            // Don't make the user press Enter to keep what they typed.
            commitDraft()
            onBlur?.()
          }}
          className="placeholder:text-muted-foreground min-w-32 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      <p aria-live="polite" className="text-destructive text-xs">
        {notice}
      </p>
    </div>
  )
}
