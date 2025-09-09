"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Heart, Bookmark, Share2, Flag, Bell, BellOff } from "lucide-react"
import type { Story } from "@/lib/types"

interface StoryActionsProps {
  story: Story
}

export function StoryActions({ story }: StoryActionsProps) {
  const [user, setUser] = useState<any>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [likesCount, setLikesCount] = useState(story.likes_count)
  const [bookmarksCount, setBookmarksCount] = useState(story.bookmarks_count)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Check if user has liked the story
        const { data: like } = await supabase
          .from("likes")
          .select("id")
          .eq("user_id", user.id)
          .eq("story_id", story.id)
          .single()
        setIsLiked(!!like)

        // Check if user has bookmarked the story
        const { data: bookmark } = await supabase
          .from("bookmarks")
          .select("id")
          .eq("user_id", user.id)
          .eq("story_id", story.id)
          .single()
        setIsBookmarked(!!bookmark)

        // Check if user is subscribed (for series/novels)
        if (story.story_type !== "one_time") {
          const { data: subscription } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("user_id", user.id)
            .eq("story_id", story.id)
            .single()
          setIsSubscribed(!!subscription)
        }
      }
    }

    getUser()
  }, [supabase, story.id, story.story_type])

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like stories.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      if (isLiked) {
        await supabase.from("likes").delete().eq("user_id", user.id).eq("story_id", story.id)
        setIsLiked(false)
        setLikesCount((prev) => prev - 1)
      } else {
        await supabase.from("likes").insert({ user_id: user.id, story_id: story.id })
        setIsLiked(true)
        setLikesCount((prev) => prev + 1)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update like status.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBookmark = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to bookmark stories.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      if (isBookmarked) {
        await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("story_id", story.id)
        setIsBookmarked(false)
        setBookmarksCount((prev) => prev - 1)
      } else {
        await supabase.from("bookmarks").insert({ user_id: user.id, story_id: story.id })
        setIsBookmarked(true)
        setBookmarksCount((prev) => prev + 1)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bookmark status.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe to stories.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      if (isSubscribed) {
        await supabase.from("subscriptions").delete().eq("user_id", user.id).eq("story_id", story.id)
        setIsSubscribed(false)
        toast({
          title: "Unsubscribed",
          description: "You will no longer receive updates for this story.",
        })
      } else {
        await supabase.from("subscriptions").insert({ user_id: user.id, story_id: story.id })
        setIsSubscribed(true)
        toast({
          title: "Subscribed",
          description: "You will receive updates when new chapters are posted.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription status.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: story.title,
          text: story.excerpt || "Check out this heartbreak story on HeartEcho",
          url: window.location.href,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Story link copied to clipboard.",
      })
    }
  }

  const handleReport = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to report content.",
        variant: "destructive",
      })
      return
    }

    // This would open a report modal in a real implementation
    toast({
      title: "Report submitted",
      description: "Thank you for helping keep our community safe.",
    })
  }

  return (
    <div className="flex items-center justify-between border-t border-b py-4">
      <div className="flex items-center space-x-2">
        <Button
          variant={isLiked ? "default" : "outline"}
          size="sm"
          onClick={handleLike}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
          <span>{likesCount}</span>
        </Button>

        <Button
          variant={isBookmarked ? "default" : "outline"}
          size="sm"
          onClick={handleBookmark}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
          <span>{bookmarksCount}</span>
        </Button>

        {story.story_type !== "one_time" && (
          <Button
            variant={isSubscribed ? "default" : "outline"}
            size="sm"
            onClick={handleSubscribe}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            {isSubscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            <span>{isSubscribed ? "Unsubscribe" : "Subscribe"}</span>
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>

        <Button variant="outline" size="sm" onClick={handleReport}>
          <Flag className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
