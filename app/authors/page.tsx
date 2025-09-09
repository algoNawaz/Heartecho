import { CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users } from "lucide-react"

async function getAuthors() {
  const supabase = await createClient()

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false }) // Order by creation date

  if (error) {
    console.error("Error fetching authors:", error)
    return []
  }

  return profiles || []
}

export default async function AuthorsPage() {
  const authors = await getAuthors()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Users className="h-8 w-8 mr-3 text-primary" />
          Our Authors
        </h1>
        <p className="text-muted-foreground">Discover the voices behind the stories.</p>
      </div>

      {authors.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-muted-foreground">No authors found yet.</p>
          <Link href="/auth/signup" className="text-primary hover:underline mt-4 block">
            Be the first author!
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {authors.map((author) => (
            <Card
              key={author.id}
              className="hover:shadow-lg transition-shadow flex flex-col items-center text-center p-6"
            >
              <Avatar className="h-24 w-24 mb-4 border-2 border-red-300 dark:border-red-700">
                <AvatarImage src={author.avatar_url || "/placeholder.svg"} alt={author.username} />
                <AvatarFallback className="text-3xl font-semibold bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300">
                  {author.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl mb-2">
                <Link href={`/profile/${author.username}`} className="hover:text-primary">
                  {author.display_name || author.username}
                </Link>
              </CardTitle>
              <CardDescription className="text-muted-foreground mb-4">@{author.username}</CardDescription>
              {author.bio && <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{author.bio}</p>}
              <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
                <span>{author.stories_count} Stories</span>
                <span>{author.followers_count} Followers</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
