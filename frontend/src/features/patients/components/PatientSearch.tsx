import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"

type Props = {
  value: string
  onSearch: (q: string) => void
  delay?: number
}

export function PatientSearch({ value, onSearch, delay = 300 }: Props) {
  const [input, setInput] = useState(value)
  const [lastPushed, setLastPushed] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  const timer = useRef<number | undefined>(undefined)
  const onSearchRef = useRef(onSearch)

  // Always call the latest onSearch so a delayed push never uses stale URL state.
  useEffect(() => {
    onSearchRef.current = onSearch
  })
  useEffect(() => () => window.clearTimeout(timer.current), [])

  // URL changed from outside (back/forward, "Clear filters"): adopt it.
  // Our own pushes match lastPushed, so they never overwrite what's still being typed.
  if (value !== prevValue) {
    setPrevValue(value)
    if (value !== lastPushed) {
      setLastPushed(value)
      setInput(value)
    }
  }

  function push(next: string) {
    const q = next.trim()
    setLastPushed(q)
    onSearchRef.current(q)
  }

  function handleChange(next: string) {
    setInput(next)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => push(next), delay)
  }

  function clear() {
    window.clearTimeout(timer.current)
    setInput("")
    push("")
  }

  return (
    <div className="relative min-w-0 flex-1 sm:max-w-sm">
      <Search
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
      />
      <Input
        type="text"
        inputMode="search"
        autoComplete="off"
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search name or email"
        aria-label="Search patients"
        className="pr-9 pl-9"
      />
      {input && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded p-1"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
