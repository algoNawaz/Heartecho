import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { LayoutDashboard, PenTool, Edit, Plus, BookOpen } from "lucide-react"
import { DeleteStoryButton } from "@/components/story/delete-story-button"
import type { Story } from "@/lib/types" // Import Story type

async function getUserStories(userId: string) {
  const supabase = await createClient()

  // Fetch all stories by the user
  const { data: allStories, error } = await supabase
    .from("stories")
    .select(`
      *,
      author:profiles(username, display_name, avatar_url)
    `)
    .eq("author_id", userId)
    .order("created_at", { ascending: false }) // Initial order for fetching

  if (error) {
    console.error("Error fetching user stories:", error)
    return []
  }

  const storiesMap = new Map<string, Story & { chapters?: Story[] }>()
  const chaptersMap = new Map<string, Story[]>()

  // First pass: Separate parent stories/one-time posts from chapters
  for (const story of allStories || []) {
    if (story.story_type === "one_time" || story.series_id === null) {
      // This is a standalone story or a parent series/novel (chapter 1)
      storiesMap.set(story.id, { ...story, chapters: [] })
    } else {
      // This is a chapter, group it by its series_id
      if (!chaptersMap.has(story.series_id)) {
        chaptersMap.set(story.series_id, [])
      }
      chaptersMap.get(story.series_id)?.push(story)
    }
  }

  // Second pass: Attach chapters to their parent stories and sort chapters
  const finalStories: (Story & { chapters?: Story[] })[] = []
  for (const [id, story] of storiesMap.entries()) {
    if (chaptersMap.has(id)) {
      const chapters = chaptersMap.get(id)!
      chapters.sort((a, b) => a.chapter_number - b.chapter_number) // Sort chapters by number
      story.chapters = chapters
    }
    finalStories.push(story)
  }

  // Sort the top-level stories (one-time and parent series) by their created_at or published_at
  finalStories.sort((a, b) => {
    const dateA = new Date(a.published_at || a.created_at).getTime()
    const dateB = new Date(b.published_at || b.created_at).getTime()
    return dateB - dateA // Descending order
  })

  return finalStories
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const userStories = await getUserStories(user.id)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <LayoutDashboard className="h-8 w-8 mr-3 text-primary" />
            Your Dashboard
          </h1>
          <p className="text-muted-foreground">Manage your stories and profile.</p>
        </div>
        <Button asChild>
          <Link href="/write">
            <PenTool className="h-4 w-4 mr-2" />
            Write New Story
          </Link>
        </Button>
      </div>

      <h2 className="text-2xl font-bold mb-6">Your Stories ({userStories.length})</h2>

      {userStories.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-muted-foreground">You haven't written any stories yet.</p>
          <Button asChild className="mt-4">
            <Link href="/write">Start Your First Story</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userStories.map((story) => (
            <Card key={story.id} className="flex flex-col">
              <CardHeader className="flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{story.story_type.replace("_", " ")}</Badge>
                  {/* Only show chapter badge if it's a chapter and not the parent series itself */}
                  {story.story_type !== "one_time" && story.series_id === null && (
                    <Badge variant="secondary">Series Parent</Badge>
                  )}
                  <Badge variant="secondary">{story.status}</Badge>
                </div>
                <CardTitle className="line-clamp-2 text-xl">
                  <Link href={`/story/${story.id}`} className="hover:text-primary">
                    {story.title}
                    {story.story_type !== "one_time" &&
                      story.series_id === null &&
                      story.chapters &&
                      story.chapters.length > 0 && (
                        <span className="text-base text-muted-foreground font-normal ml-2">
                          ({story.chapters.length} Chapters)
                        </span>
                      )}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-3 mt-2">
                  {story.excerpt || story.content.substring(0, 150) + "..."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 border-t">
                {/* Display chapters if it's a series/novel parent */}
                {story.story_type !== "one_time" &&
                  story.series_id === null &&
                  story.chapters &&
                  story.chapters.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center">
                        <BookOpen className="h-4 w-4 mr-1 text-primary" />
                        Chapters:
                      </h4>
                      <ul className="space-y-1 text-sm text-muted-foreground max-h-24 overflow-y-auto pr-2">
                        {story.chapters.map((chapter) => (
                          <li key={chapter.id}>
                            <Link
                              href={`/story/${chapter.id}`}
                              className="hover:text-primary flex justify-between items-center"
                            >
                              <span>
                                Chapter {chapter.chapter_number}: {chapter.title}
                              </span>
                              <Badge variant="outline" className="ml-2">
                                {chapter.status}
                              </Badge>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>
                    Published{" "}
                    {formatDistanceToNow(new Date(story.published_at || story.created_at), { addSuffix: true })}
                  </span>
                  <span>{story.views_count} views</span>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Link href={`/write?storyId=${story.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit {story.story_type === "one_time" ? "Story" : "Series Info"}
                    </Link>
                  </Button>
                  {/* Add New Chapter button for parent series/novels */}
                  {(story.story_type === "series" || story.story_type === "novel") && story.series_id === null && (
                    <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Link href={`/write?seriesId=${story.id}&newChapter=true`}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Chapter
                      </Link>
                    </Button>
                  )}
                  <DeleteStoryButton storyId={story.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
