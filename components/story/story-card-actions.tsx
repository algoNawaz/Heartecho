"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Heart } from "lucide-react"

interface StoryCardActionsProps {
  storyId: string
  initialLikesCount: number
}

export function StoryCardActions({ storyId, initialLikesCount }: StoryCardActionsProps) {
  const [user, setUser] = useState<any>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const checkLikeStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: like } = await supabase
          .from("likes")
          .select("id")
          .eq("user_id", user.id)
          .eq("story_id", storyId)
          .single()
        setIsLiked(!!like)
      }
    }
    checkLikeStatus()
  }, [supabase, storyId])

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
        await supabase.from("likes").delete().eq("user_id", user.id).eq("story_id", storyId)
        setIsLiked(false)
        setLikesCount((prev) => prev - 1)
      } else {
        await supabase.from("likes").insert({ user_id: user.id, story_id: storyId })
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

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={loading}
      className="flex items-center space-x-1 p-0 h-auto text-sm text-muted-foreground hover:text-primary"
    >
      <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
      <span>{likesCount}</span>
    </Button>
  )
}
