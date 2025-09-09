import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { MapPin, LinkIcon, BookOpen, Edit } from "lucide-react"
import { FollowButton } from "@/components/profile/follow-button" // Import the new component
import { StoryCardActions } from "@/components/story/story-card-actions" // Re-use for likes

async function getProfileAndStories(username: string) {
  const supabase = await createClient()

  // Fetch profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single()

  if (profileError || !profile) {
    console.error("Error fetching profile:", profileError)
    return { profile: null, stories: [], isFollowing: false, viewerId: null }
  }

  // Fetch stories by this author
  const { data: stories, error: storiesError } = await supabase
    .from("stories")
    .select(`
      *,
      author:profiles(username, display_name, avatar_url)
    `)
    .eq("author_id", profile.id)
    .eq("status", "published") // Only show published stories on public profile
    .order("published_at", { ascending: false })

  if (storiesError) {
    console.error("Error fetching stories for profile:", storiesError)
    return { profile, stories: [], isFollowing: false, viewerId: null }
  }

  // Check if current user is following this profile
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser()
  let isFollowing = false
  if (viewer && viewer.id !== profile.id) {
    const { data: followData } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", viewer.id)
      .eq("following_id", profile.id)
      .single()
    isFollowing = !!followData
  }

  return { profile, stories: stories || [], isFollowing, viewerId: viewer?.id || null }
}

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const { profile, stories, isFollowing, viewerId } = await getProfileAndStories(params.username)

  if (!profile) {
    notFound()
  }

  // Handle follow count updates
  const handleFollowChange = async (newIsFollowing: boolean) => {
    // This function is passed to the client component, so it needs to be a client-side update
    // For server-side rendering, we'll rely on re-fetching or optimistic updates.
    // For now, we'll just trigger a re-render of the page to reflect the change.
    // In a real app, you might use SWR/React Query for better data revalidation.
    "use server"
    // This is a placeholder for revalidation. In a full app, you'd revalidate path or mutate cache.
    // For now, the client component will handle its own state and the server will reflect on refresh.
  }

  const isOwnProfile = viewerId === profile.id

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/10 dark:to-pink-950/10 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-8 p-6 text-center shadow-lg">
          <CardContent className="flex flex-col items-center">
            <Avatar className="h-32 w-32 mb-4 border-4 border-red-300 dark:border-red-700">
              <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.username} />
              <AvatarFallback className="text-5xl font-bold bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300">
                {profile.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl font-bold mb-2">{profile.display_name || profile.username}</CardTitle>
            <CardDescription className="text-lg text-muted-foreground mb-4">@{profile.username}</CardDescription>

            {profile.bio && <p className="text-md text-muted-foreground max-w-prose mb-4">{profile.bio}</p>}

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-4">
              {profile.location && (
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {profile.location}
                </span>
              )}
              {profile.website && (
                <Link
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-primary"
                >
                  <LinkIcon className="h-4 w-4 mr-1" />
                  {profile.website.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0]}
                </Link>
              )}
              <span className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                {profile.stories_count} Stories
              </span>
            </div>

            <div className="flex space-x-4 mb-6">
              <div className="text-center">
                <p className="text-xl font-bold">{profile.followers_count}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{profile.following_count}</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
            </div>

            {viewerId && viewerId !== profile.id ? (
              <FollowButton
                profileId={profile.id}
                viewerId={viewerId}
                initialIsFollowing={isFollowing}
                onFollowChange={handleFollowChange}
              />
            ) : isOwnProfile ? (
              <Button asChild>
                <Link href="/settings">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>

        {/* Author's Stories Section */}
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <BookOpen className="h-6 w-6 mr-2 text-primary" />
          {isOwnProfile ? "Your Stories" : `${profile.display_name || profile.username}'s Stories`} ({stories.length})
        </h2>

        {stories.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg text-muted-foreground">
              {isOwnProfile ? "You haven't written any stories yet." : "This author hasn't published any stories yet."}
            </p>
            {isOwnProfile && (
              <Button asChild className="mt-4">
                <Link href="/write">Start Your First Story</Link>
              </Button>
            )}
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
                    <span className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={story.author?.avatar_url || "/placeholder.svg"}
                          alt={story.author?.username}
                        />
                        <AvatarFallback>{story.author?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <span>@{story.author?.username}</span>
                    </span>
                    <div className="flex items-center space-x-3">
                      <StoryCardActions storyId={story.id} initialLikesCount={story.likes_count} />
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
    </div>
  )
}
