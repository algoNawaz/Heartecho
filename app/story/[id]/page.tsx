import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StoryContent } from "@/components/story/story-content"
import { StoryActions } from "@/components/story/story-actions"
import { Comments } from "@/components/story/comments"
import { RelatedStories } from "@/components/story/related-stories"
import { ChapterNavigation } from "@/components/story/chapter-navigation" // Import new component
import type { Story } from "@/lib/types"

async function getStory(params: { id: string }) {
  const supabase = await createClient()
  const { id } = await params // Await params as per Next.js 15.1 guidance

  const { data: story, error } = await supabase
    .from("stories")
    .select(`
      *,
      author:profiles(id, username, display_name, avatar_url, bio)
    `)
    .eq("id", id)
    .eq("status", "published")
    .single()

  if (error || !story) {
    console.error("Error fetching story:", error)
    return null
  }

  // If it's a chapter of a series/novel, fetch all chapters in that series
  let chaptersInSeries: Story[] = []
  if (story.story_type !== "one_time" && story.series_id) {
    const { data: chapters, error: chaptersError } = await supabase
      .from("stories")
      .select("*")
      .eq("series_id", story.series_id)
      .eq("status", "published")
      .order("chapter_number", { ascending: true })

    if (chaptersError) {
      console.error("Error fetching chapters in series:", chaptersError)
    } else {
      chaptersInSeries = chapters || []
    }
  } else if (story.story_type !== "one_time" && story.chapter_number === 1 && story.series_id === null) {
    // This is likely the parent story (Chapter 1) of a series/novel
    const { data: chapters, error: chaptersError } = await supabase
      .from("stories")
      .select("*")
      .or(`id.eq.${story.id},series_id.eq.${story.id}`) // Get itself and its chapters
      .eq("status", "published")
      .order("chapter_number", { ascending: true })

    if (chaptersError) {
      console.error("Error fetching chapters for parent series:", chaptersError)
    } else {
      chaptersInSeries = chapters || []
    }
  }

  return { ...story, chapters: chaptersInSeries }
}

async function getRelatedStories(storyId: string, authorId: string, tags: string[]) {
  const supabase = await createClient()

  const { data: stories } = await supabase
    .from("stories")
    .select(`
      *,
      author:profiles(username, display_name, avatar_url)
    `)
    .neq("id", storyId)
    .eq("status", "published")
    .or(`author_id.eq.${authorId},tags.ov.{${tags.join(",")}}`)
    .order("published_at", { ascending: false })
    .limit(4)

  return stories || []
}

export default async function StoryPage({ params }: { params: { id: string } }) {
  const story = await getStory(params)

  if (!story) {
    notFound()
  }

  const relatedStories = await getRelatedStories(story.id, story.author_id, story.tags)

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/10 dark:to-pink-950/10 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            <StoryContent story={story} />
            {/* Chapter Navigation below story content */}
            <ChapterNavigation currentStory={story} chapters={story.chapters || []} />
            <StoryActions story={story} />
            <Comments storyId={story.id} />
          </div>

          <div className="space-y-8 lg:pt-10">
            <RelatedStories stories={relatedStories} currentStoryId={story.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
