"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Story } from "@/lib/types"

interface ChapterNavigationProps {
  currentStory: Story
  chapters: Story[] // All chapters in the series, sorted by chapter_number
}

export function ChapterNavigation({ currentStory, chapters }: ChapterNavigationProps) {
  if (currentStory.story_type === "one_time" || !chapters || chapters.length <= 1) {
    return null // Only show navigation for series/novels with multiple chapters
  }

  // Sort chapters by chapter_number to ensure correct order
  const sortedChapters = [...chapters].sort((a, b) => a.chapter_number - b.chapter_number)

  const currentIndex = sortedChapters.findIndex((chap) => chap.id === currentStory.id)
  const previousChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null
  const nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null

  return (
    <div className="flex items-center justify-between border-t border-b py-4 mt-8">
      {previousChapter ? (
        <Button asChild variant="outline">
          <Link href={`/story/${previousChapter.id}`}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Prev Chapter {previousChapter.chapter_number}
          </Link>
        </Button>
      ) : (
        <div /> // Empty div to maintain spacing
      )}

      <span className="text-sm text-muted-foreground">
        Chapter {currentStory.chapter_number} of {sortedChapters.length}
      </span>

      {nextChapter ? (
        <Button asChild variant="outline">
          <Link href={`/story/${nextChapter.id}`}>
            Next Chapter {nextChapter.chapter_number}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      ) : (
        <div /> // Empty div to maintain spacing
      )}
    </div>
  )
}
