import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { StoryCardActions } from "@/components/story/story-card-actions"

async function getStories() {
  const supabase = await createClient()

  const { data: stories, error } = await supabase
    .from("stories")
    .select(`
      *,
      author:profiles(username, display_name, avatar_url)
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false })

  if (error) {
    console.error("Error fetching stories:", error)
    return []
  }

  return stories || []
}

export default async function StoriesPage() {
  const stories = await getStories()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">All Stories</h1>
        <p className="text-muted-foreground">Browse heartbreak stories from our community.</p>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-muted-foreground">No stories published yet. Be the first to share!</p>
          <Link href="/write" className="text-primary hover:underline mt-4 block">
            Start writing your story
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <Card key={story.id} className="hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{story.story_type.replace("_", " ")}</Badge>
                  {story.genre && <Badge variant="secondary">{story.genre}</Badge>}
                </div>
                <CardTitle className="line-clamp-2 text-xl">
                  <Link href={`/story/${story.id}`} className="hover:text-primary">
                    {story.title}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-3 mt-2">
                  {story.excerpt || story.content.substring(0, 150) + "..."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <Link
                    href={`/profile/${story.author?.username}`}
                    className="flex items-center space-x-2 hover:text-primary truncate"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={story.author?.avatar_url || "/placeholder.svg"} alt={story.author?.username} />
                      <AvatarFallback>{story.author?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <span>@{story.author?.username}</span>
                  </Link>
                  <div className="flex items-center space-x-3">
                    <StoryCardActions storyId={story.id} initialLikesCount={story.likes_count} />
                    {/* Make comments count clickable */}
                    <Link href={`/story/${story.id}#comments`} className="hover:text-primary">
                      {story.comments_count} comments
                    </Link>
                  </div>
                </div>
                <p className="text-xs text-right mt-2">
                  Published {formatDistanceToNow(new Date(story.published_at), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
