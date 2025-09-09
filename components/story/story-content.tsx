import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import type { Story } from "@/lib/types"

interface StoryContentProps {
  story: Story & { author: any }
}

export function StoryContent({ story }: StoryContentProps) {
  return (
    <article className="space-y-8">
      {/* Story Header */}
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline">{story.story_type.replace("_", " ")}</Badge>
          {story.genre && <Badge variant="secondary">{story.genre}</Badge>}
          {story.is_featured && <Badge variant="default">Featured</Badge>}
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-primary-foreground bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
          {story.title}
        </h1>

        {story.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {story.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-sm px-3 py-1">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Author Info */}
      <Card className="shadow-lg border-2 border-red-100 dark:border-red-900">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-14 w-14 border-2 border-red-300 dark:border-red-700">
              <AvatarImage src={story.author?.avatar_url || "/placeholder.svg"} alt={story.author?.username} />
              <AvatarFallback className="text-lg font-semibold bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300">
                {story.author?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Link href={`/profile/${story.author?.username}`} className="font-bold text-lg hover:text-primary">
                  {story.author?.display_name || story.author?.username}
                </Link>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(story.published_at), { addSuffix: true })}
                </span>
              </div>
              {story.author?.bio && <p className="text-sm text-muted-foreground mt-1">{story.author.bio}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Story Content with Decorative Background */}
      <Card
        className="shadow-xl border-2 border-pink-200 dark:border-pink-800 overflow-hidden"
        style={{
          backgroundImage: `url('/images/paper-texture.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundBlendMode: "overlay",
          backgroundColor: "var(--background)", // Ensure background color blends
        }}
      >
        <CardContent className="pt-8 pb-8 px-6 md:px-10 relative z-10">
          <div className="prose prose-lg prose-gray dark:prose-invert max-w-none text-foreground/90">
            <div className="whitespace-pre-wrap text-base leading-relaxed font-serif">{story.content}</div>
          </div>
        </CardContent>
      </Card>

      {/* Story Stats */}
      <div className="flex flex-wrap items-center justify-between text-sm text-muted-foreground border-t pt-4">
        <div className="flex items-center space-x-4">
          <span>{story.views_count} views</span>
          <span>{story.likes_count} likes</span>
          <span>{story.comments_count} comments</span>
          <span>{story.bookmarks_count} bookmarks</span>
        </div>
        <span className="mt-2 md:mt-0">
          Published {formatDistanceToNow(new Date(story.published_at), { addSuffix: true })}
        </span>
      </div>
    </article>
  )
}
