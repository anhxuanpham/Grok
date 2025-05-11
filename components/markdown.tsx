"use client"

import { useEffect, useState } from "react"

interface MarkdownProps {
  content: string
}

export function Markdown({ content }: MarkdownProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Simple function to process markdown-like syntax
  const processMarkdown = (text: string) => {
    // Split the text into lines
    const lines = text.split("\n")
    let inCodeBlock = false
    let language = ""
    let codeContent = ""

    const processedLines = lines
      .map((line, index) => {
        // Code block handling
        if (line.startsWith("```")) {
          if (!inCodeBlock) {
            // Start of code block
            inCodeBlock = true
            language = line.slice(3).trim()
            return null // Skip this line in the output
          } else {
            // End of code block
            inCodeBlock = false
            const result = (
              <pre key={`code-${index}`} className="bg-zinc-800 p-4 rounded-md my-4 overflow-x-auto">
                <code className="text-sm font-mono whitespace-pre">{codeContent}</code>
              </pre>
            )
            codeContent = "" // Reset code content
            return result
          }
        }

        if (inCodeBlock) {
          codeContent += line + "\n"
          return null // Skip this line in the output
        }

        // Headings
        if (line.startsWith("# ")) {
          return (
            <h1 key={index} className="text-2xl font-bold mb-4 mt-6">
              {line.slice(2)}
            </h1>
          )
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={index} className="text-xl font-bold mb-3 mt-5">
              {line.slice(3)}
            </h2>
          )
        }
        if (line.startsWith("### ")) {
          return (
            <h3 key={index} className="text-lg font-bold mb-2 mt-4">
              {line.slice(4)}
            </h3>
          )
        }

        // Lists
        if (line.match(/^\s*-\s/)) {
          return (
            <li key={index} className="ml-6 mb-1">
              {line.replace(/^\s*-\s/, "")}
            </li>
          )
        }
        if (line.match(/^\s*\d+\.\s/)) {
          return (
            <li key={index} className="ml-6 list-decimal mb-1">
              {line.replace(/^\s*\d+\.\s/, "")}
            </li>
          )
        }

        // Blockquote
        if (line.startsWith("> ")) {
          return (
            <blockquote key={index} className="border-l-4 border-zinc-700 pl-4 italic my-4">
              {line.slice(2)}
            </blockquote>
          )
        }

        // Horizontal rule
        if (line === "---") {
          return <hr key={index} className="border-zinc-700 my-6" />
        }

        // Regular paragraph
        if (line.trim() === "") {
          return <br key={index} />
        }

        // Process inline formatting
        let processedLine = line

        // Bold
        processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

        // Italic
        processedLine = processedLine.replace(/\*(.*?)\*/g, "<em>$1</em>")

        // Inline code
        processedLine = processedLine.replace(
          /`(.*?)`/g,
          '<code class="bg-zinc-800 px-1 py-0.5 rounded text-sm">$1</code>',
        )

        // Links
        processedLine = processedLine.replace(
          /\[(.*?)\]$$(.*?)$$/g,
          '<a href="$2" class="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>',
        )

        return <p key={index} className="mb-4" dangerouslySetInnerHTML={{ __html: processedLine }} />
      })
      .filter(Boolean)

    return processedLines
  }

  if (!mounted) {
    return <div className="text-zinc-300 whitespace-pre-wrap">{content}</div>
  }

  return <div className="prose prose-invert max-w-none">{processMarkdown(content)}</div>
}
