"use client"

import React, { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Underline, Link as LinkIcon, Heading2, List, ListOrdered } from "lucide-react"
import { useTranslation } from '@/contexts/i18n-context'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const { t } = useTranslation()
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
    const url = prompt(t('richTextEditor.enterUrl')) || ""
    if (!url) return
    exec("createLink", url)
  }

  return (
    <div className="border rounded-md">
      <div className="flex items-center gap-2 p-2 border-b bg-muted/50">
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => exec("bold")} aria-label={t('richTextEditor.bold')}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => exec("italic")} aria-label={t('richTextEditor.italic')}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => exec("underline")} aria-label={t('richTextEditor.underline')}>
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border" />
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => exec("formatBlock", "<h2>")} aria-label={t('richTextEditor.heading')}>
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => exec("insertUnorderedList")} aria-label={t('richTextEditor.bulletList')}>
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => exec("insertOrderedList")} aria-label={t('richTextEditor.numberedList')}>
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border" />
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={addLink} aria-label={t('richTextEditor.addLink')}>
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={ref}
        role="textbox"
        contentEditable
        className="min-h-[220px] p-3 focus:outline-none prose max-w-none"
        data-placeholder={placeholder || t('richTextEditor.placeholder')}
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
