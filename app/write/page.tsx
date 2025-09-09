"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PenTool, Save, X, Plus, TriangleAlert } from "lucide-react"
import type { Profile, Story } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function WritePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [storyId, setStoryId] = useState<string | null>(null) // For editing existing story/chapter
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [storyType, setStoryType] = useState<"one_time" | "series" | "novel">("one_time")
  const [genre, setGenre] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [status, setStatus] = useState<"draft" | "published">("published")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // New states for chapter management
  const [isNewChapterMode, setIsNewChapterMode] = useState(false)
  const [parentSeriesId, setParentSeriesId] = useState<string | null>(null)
  const [availableSeries, setAvailableSeries] = useState<Story[]>([])
  const [nextChapterNumber, setNextChapterNumber] = useState<number>(1)

  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  useEffect(() => {
    const loadPageData = async () => {
      setLoading(true)
      setError("")
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/signin")
        return
      }
      setUser(user)

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        setError(`Failed to load profile: ${profileError.message}`)
      } else if (!profileData) {
        setError(
          "Your user profile is missing. Please ensure you have completed the signup process or contact support.",
        )
      }
      setProfile(profileData)

      // Fetch user's existing series/novels for chapter selection
      const { data: seriesData, error: seriesError } = await supabase
        .from("stories")
        .select("id, title, story_type, chapter_number")
        .eq("author_id", user.id)
        .in("story_type", ["series", "novel"])
        .is("series_id", null) // Only fetch parent series/novels
        .order("created_at", { ascending: false })

      if (seriesError) {
        console.error("Error fetching user series:", seriesError)
      } else {
        setAvailableSeries(seriesData || [])
      }

      // Check for editing an existing story/chapter
      const idFromUrl = searchParams.get("storyId")
      if (idFromUrl) {
        setStoryId(idFromUrl)
        const { data: storyData, error: storyError } = await supabase
          .from("stories")
          .select("*")
          .eq("id", idFromUrl)
          .eq("author_id", user.id) // Ensure author owns the story
          .single()

        if (storyError) {
          setError(`Failed to load story for editing: ${storyError.message}`)
          toast({
            title: "Error loading story",
            description: "Could not load story for editing. You might not have permission.",
            variant: "destructive",
          })
          router.push("/dashboard")
          return
        }

        if (storyData) {
          setTitle(storyData.title)
          setContent(storyData.content)
          setExcerpt(storyData.excerpt || "")
          setStoryType(storyData.story_type)
          setGenre(storyData.genre || "")
          setTags(storyData.tags || [])
          setStatus(storyData.status)
          setParentSeriesId(storyData.series_id || null)
          setNextChapterNumber(storyData.chapter_number) // When editing, this is the current chapter number
        }
      }

      // Check for adding a new chapter to an existing series
      const seriesIdFromUrl = searchParams.get("seriesId")
      const newChapterFlag = searchParams.get("newChapter") === "true"

      if (seriesIdFromUrl && newChapterFlag) {
        setIsNewChapterMode(true)
        setParentSeriesId(seriesIdFromUrl)
        // Fetch the parent series to get its type and determine next chapter number
        const { data: parentSeries, error: parentError } = await supabase
          .from("stories")
          .select("id, story_type")
          .eq("id", seriesIdFromUrl)
          .eq("author_id", user.id)
          .single()

        if (parentError || !parentSeries) {
          setError("Failed to load parent series for new chapter.")
          toast({
            title: "Error",
            description: "Could not load parent series for new chapter.",
            variant: "destructive",
          })
          router.push("/dashboard")
          return
        }
        setStoryType(parentSeries.story_type) // Inherit type from parent

        // Determine the next chapter number
        const { data: maxChapterData, error: maxChapterError } = await supabase
          .from("stories")
          .select("chapter_number")
          .eq("series_id", seriesIdFromUrl)
          .order("chapter_number", { ascending: false })
          .limit(1)
          .single()

        if (maxChapterError && maxChapterError.code !== "PGRST116") {
          console.error("Error fetching max chapter number:", maxChapterError)
        }

        const nextNum = (maxChapterData?.chapter_number || 0) + 1
        setNextChapterNumber(nextNum)
        setTitle(`Chapter ${nextNum}`) // Pre-fill title for new chapter
      }

      setLoading(false)
    }
    loadPageData()
  }, [supabase, router, toast, searchParams])

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) {
      setError("User or profile data is missing. Please sign in again or ensure your profile exists.")
      toast({
        title: "Authentication Error",
        description: "Please sign in again or ensure your profile exists.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError("")

    const currentPublishedAt = status === "published" ? new Date().toISOString() : null

    let chapterNumToSave = nextChapterNumber
    let seriesIdToSave = parentSeriesId

    // Logic for new series/novel (first chapter)
    if (!storyId && (storyType === "series" || storyType === "novel") && !isNewChapterMode) {
      chapterNumToSave = 1
      seriesIdToSave = null // Parent series/novel will have series_id as null
    } else if (!storyId && storyType === "one_time") {
      chapterNumToSave = 1
      seriesIdToSave = null
    }

    const storyData = {
      author_id: user.id,
      title,
      content,
      excerpt: excerpt || content.substring(0, 200),
      story_type: storyType,
      genre: genre || null,
      tags,
      status,
      published_at: currentPublishedAt,
      chapter_number: chapterNumToSave,
      series_id: seriesIdToSave,
    }

    try {
      let data: Story | null = null
      let insertError: any = null
      let updateError: any = null

      if (storyId) {
        // Editing existing story/chapter
        const { data: updatedData, error: err } = await supabase
          .from("stories")
          .update(storyData)
          .eq("id", storyId)
          .eq("author_id", user.id) // Ensure author owns the story
          .select()
          .single()
        data = updatedData
        updateError = err
      } else {
        // Creating new story/chapter
        const { data: insertedData, error: err } = await supabase.from("stories").insert(storyData).select().single()
        data = insertedData
        insertError = err
      }

      if (insertError || updateError) {
        const err = insertError || updateError
        console.error("Story submission error:", err)
        let errorMessage = `Failed to ${storyId ? "update" : "publish"} story: ${err.message}`
        if (err.code === "23503") {
          errorMessage =
            "Failed to create story: Your profile might be missing or not correctly linked. Please try signing up again with a new email, or contact support."
        }
        setError(errorMessage)
        toast({
          title: `${storyId ? "Update" : "Publishing"} Failed`,
          description: errorMessage,
          variant: "destructive",
        })
      } else {
        setSuccess(true)
        toast({
          title: `Story ${storyId ? "Updated" : "Published"}!`,
          description: `Your story has been successfully ${storyId ? "updated" : "published"}.`,
          variant: "success",
        })
        setTimeout(() => {
          router.push(`/story/${data?.id}`)
        }, 2000)
      }
    } catch (err: any) {
      console.error("Unexpected story submission error:", err)
      const errorMessage =
        err.message || `An unexpected error occurred while ${storyId ? "updating" : "publishing"} your story.`
      setError(errorMessage)
      toast({
        title: `${storyId ? "Update" : "Publishing"} Failed`,
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveDraft = async () => {
    if (!user || !profile) {
      setError("User or profile data is missing. Cannot save draft.")
      toast({
        title: "Authentication Error",
        description: "Please sign in again or ensure your profile exists.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError("")

    let chapterNumToSave = nextChapterNumber
    let seriesIdToSave = parentSeriesId

    if (!storyId && (storyType === "series" || storyType === "novel") && !isNewChapterMode) {
      chapterNumToSave = 1
      seriesIdToSave = null
    } else if (!storyId && storyType === "one_time") {
      chapterNumToSave = 1
      seriesIdToSave = null
    }

    const draftData = {
      author_id: user.id,
      title: title || "Untitled Draft",
      content,
      excerpt,
      story_type: storyType,
      genre,
      tags,
      status: "draft",
      published_at: null,
      chapter_number: chapterNumToSave,
      series_id: seriesIdToSave,
    }

    try {
      if (storyId) {
        const { error: updateError } = await supabase
          .from("stories")
          .update(draftData)
          .eq("id", storyId)
          .eq("author_id", user.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("stories").insert(draftData)
        if (insertError) throw insertError
      }

      setSuccess(true)
      toast({
        title: "Draft Saved!",
        description: "Your story has been saved as a draft.",
        variant: "success",
      })
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (err: any) {
      console.error("Unexpected draft save error:", err)
      const errorMessage = err.message || "An unexpected error occurred while saving your draft."
      setError(errorMessage)
      toast({
        title: "Draft Save Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <p className="text-lg text-muted-foreground">Loading user session and story data...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <PenTool className="h-8 w-8 mr-3 text-primary" />
          {storyId ? "Edit Your Story" : isNewChapterMode ? `Write Chapter ${nextChapterNumber}` : "Write Your Story"}
        </h1>
        <p className="text-muted-foreground">Share your heartbreak story with the community. Your words matter.</p>
      </div>

      {success && (
        <Alert className="mb-6">
          <AlertDescription>Story saved successfully! Redirecting...</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5" />
            Error
          </AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!profile && user && (
        <Alert className="mb-6" variant="default">
          <AlertTitle className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5" />
            Profile Missing!
          </AlertTitle>
          <AlertDescription>
            It looks like your user profile hasn't been created yet. This is required to publish stories.
            <br />
            **Please try signing up with a new email address.** If the issue persists, contact support.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="write" className="space-y-6">
        <TabsList>
          <TabsTrigger value="write">Write</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="write">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Story Details</CardTitle>
                <CardDescription>Basic information about your story</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isNewChapterMode ? (
                  <div className="space-y-2">
                    <Label htmlFor="parentSeries">Part of Series/Novel</Label>
                    <Select
                      value={parentSeriesId || ""}
                      onValueChange={(value) => setParentSeriesId(value)}
                      disabled={true} // Disable selection when in new chapter mode
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a series/novel" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSeries.map((series) => (
                          <SelectItem key={series.id} value={series.id}>
                            {series.title} ({series.story_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      This is chapter {nextChapterNumber} of the selected {storyType}.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storyType">Story Type</Label>
                      <Select value={storyType} onValueChange={(value: any) => setStoryType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one_time">One-time Post</SelectItem>
                          <SelectItem value="series">New Story Series</SelectItem>
                          <SelectItem value="novel">New Novel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="genre">Genre (Optional)</Label>
                      <Select value={genre} onValueChange={setGenre}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a genre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breakup">Breakup</SelectItem>
                          <SelectItem value="loss">Loss</SelectItem>
                          <SelectItem value="unrequited">Unrequited Love</SelectItem>
                          <SelectItem value="betrayal">Betrayal</SelectItem>
                          <SelectItem value="divorce">Divorce</SelectItem>
                          <SelectItem value="friendship">Friendship</SelectItem>
                          <SelectItem value="family">Family</SelectItem>
                          <SelectItem value="healing">Healing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Give your story a compelling title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags (Optional)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" variant="outline" onClick={addTag} disabled={tags.length >= 5}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Add up to 5 tags to help readers find your story</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt (Optional)</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="A brief description of your story (will be auto-generated if left empty)"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Story</CardTitle>
                <CardDescription>Write your heartbreak story. Be authentic and honest.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Start writing your story here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                  className="resize-none"
                  required
                />
                <p className="text-sm text-muted-foreground mt-2">{content.length} characters</p>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-2">
                <Button type="submit" disabled={loading || !profile}>
                  {loading ? (storyId ? "Updating..." : "Publishing...") : storyId ? "Update Story" : "Publish Story"}
                </Button>
                <Button type="button" variant="outline" onClick={saveDraft} disabled={loading || !profile}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving Draft..." : "Save Draft"}
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>{title || "Untitled Story"}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{storyType.replace("_", " ")}</Badge>
                {genre && <Badge variant="secondary">{genre}</Badge>}
                {isNewChapterMode && <Badge variant="secondary">Chapter {nextChapterNumber}</Badge>}
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                {content ? (
                  <div className="whitespace-pre-wrap">{content}</div>
                ) : (
                  <p className="text-muted-foreground italic">Your story content will appear here...</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
