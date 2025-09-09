import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Story } from "@/lib/types"

interface RelatedStoriesProps {
  stories: Story[]
  currentStoryId: string
}

export function RelatedStories({ stories, currentStoryId }: RelatedStoriesProps) {
  if (!stories || stories.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Related Stories</h3>
      <div className="space-y-4">
        {stories.map((story) =>
          story.id !== currentStoryId ? (
            <Card key={story.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-2">
                  <Link href={`/story/${story.id}`} className="hover:text-primary">
                    {story.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {story.excerpt || story.content.substring(0, 75) + "..."}
                </p>
              </CardContent>
            </Card>
          ) : null,
        )}
      </div>
    </div>
  )
}
