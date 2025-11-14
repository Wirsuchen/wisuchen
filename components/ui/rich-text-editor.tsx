"use client"

import React, { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Underline, Link as LinkIcon, Heading2, List, ListOrdered } from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    // Only update innerHTML when external value changes and differs from DOM
    if (ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || ""
    }
  }, [value])

  const exec = (command: string, value?: string) => {
    if (typeof document === 'undefined') return
    document.execCommand(command, false, value)
    if (ref.current) onChange(ref.current.innerHTML)
  }

  const handleInput = () => {
    if (!ref.current) return
    onChange(ref.current.innerHTML)
  }

  const addLink = () => {
    const url = prompt("Enter URL") || ""
    if (!url) return
    exec("createLink", url)
  }

  return (
    <div className="border rounded-md">
      <div className="flex items-center gap-2 p-2 border-b bg-muted/50">
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => exec("bold")} aria-label="Bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => exec("italic")} aria-label="Italic">
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => exec("underline")} aria-label="Underline">
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border" />
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => exec("formatBlock", "<h2>")} aria-label="H2">
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => exec("insertUnorderedList")} aria-label="Bullet List">
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => exec("insertOrderedList")} aria-label="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border" />
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={addLink} aria-label="Insert Link">
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={ref}
        role="textbox"
        contentEditable
        className="min-h-[220px] p-3 focus:outline-none prose max-w-none"
        data-placeholder={placeholder || "Write your content..."}
        onInput={handleInput}
        suppressContentEditableWarning
      />
      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  )
}
