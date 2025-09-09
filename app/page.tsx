import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, BookOpen, Users, PenTool, Star } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

async function getFeaturedStories() {
  const supabase = await createClient()

  const { data: stories } = await supabase
    .from("stories")
    .select(`
      *,
      author:profiles(username, display_name, avatar_url)
    `)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(6)

  return stories || []
}

async function getRecentStories() {
  const supabase = await createClient()

  const { data: stories } = await supabase
    .from("stories")
    .select(`
      *,
      author:profiles(username, display_name, avatar_url)
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(8)

  return stories || []
}

export default async function HomePage() {
  const [featuredStories, recentStories] = await Promise.all([getFeaturedStories(), getRecentStories()])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <Heart className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              Share Your Heart, Heal Through Words
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              HeartEcho is a safe space where heartbreak becomes healing, where stories connect souls, and where every
              word matters in the journey of recovery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/auth/signup">Start Writing</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 bg-transparent">
                <Link href="/stories">Read Stories</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose HeartEcho?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A platform designed for authentic storytelling and genuine connection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <BookOpen className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <CardTitle>Multiple Story Formats</CardTitle>
                <CardDescription>
                  Share one-time posts, create ongoing series, or write full novels with chapters
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <CardTitle>Supportive Community</CardTitle>
                <CardDescription>
                  Connect with others who understand, comment, like, and support each other's journeys
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <PenTool className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <CardTitle>Author Tools</CardTitle>
                <CardDescription>
                  Comprehensive dashboard with analytics, subscriber management, and writing tools
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      {featuredStories.length > 0 && (
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold mb-2">Featured Stories</h2>
                <p className="text-muted-foreground">Handpicked stories that touched our hearts</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/stories?featured=true">View All</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredStories.map((story) => (
                <Card key={story.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                      <Badge variant="outline">{story.story_type.replace("_", " ")}</Badge>
                    </div>
                    <CardTitle className="line-clamp-2">
                      <Link href={`/story/${story.id}`} className="hover:text-primary">
                        {story.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {story.excerpt || story.content.substring(0, 150) + "..."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <Link href={`/profile/${story.author?.username}`} className="hover:text-primary">
                        by {story.author?.display_name || story.author?.username}
                      </Link>
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          {story.likes_count}
                        </span>
                        <span>{story.comments_count} comments</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Stories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Recent Stories</h2>
              <p className="text-muted-foreground">Fresh stories from our community</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/stories">View All</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentStories.map((story) => (
              <Card key={story.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{story.story_type.replace("_", " ")}</Badge>
                    {story.tags.length > 0 && <Badge variant="secondary">{story.tags[0]}</Badge>}
                  </div>
                  <CardTitle className="line-clamp-2 text-lg">
                    <Link href={`/story/${story.id}`} className="hover:text-primary">
                      {story.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {story.excerpt || story.content.substring(0, 100) + "..."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <Link href={`/profile/${story.author?.username}`} className="hover:text-primary truncate">
                      @{story.author?.username}
                    </Link>
                    <span className="flex items-center">
                      <Heart className="h-4 w-4 mr-1" />
                      {story.likes_count}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Share Your Story?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of writers who have found healing and connection through HeartEcho
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link href="/auth/signup">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
