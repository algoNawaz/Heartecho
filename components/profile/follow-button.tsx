"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { UserPlus, UserMinus } from "lucide-react"

interface FollowButtonProps {
  profileId: string // The ID of the profile being viewed
  viewerId: string // The ID of the currently logged-in user
  initialIsFollowing: boolean
  onFollowChange: (isFollowing: boolean) => void
}

export function FollowButton({ profileId, viewerId, initialIsFollowing, onFollowChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Ensure state is in sync if initialIsFollowing changes (e.g., after a refresh)
  useEffect(() => {
    setIsFollowing(initialIsFollowing)
  }, [initialIsFollowing])

  const handleFollowToggle = async () => {
    setLoading(true)
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", viewerId)
          .eq("following_id", profileId)

        if (error) throw error
        setIsFollowing(false)
        onFollowChange(false)
        toast({
          title: "Unfollowed",
          description: "You are no longer following this author.",
        })
      } else {
        // Follow
        const { error } = await supabase.from("follows").insert({ follower_id: viewerId, following_id: profileId })

        if (error) throw error
        setIsFollowing(true)
        onFollowChange(true)
        toast({
          title: "Following",
          description: "You are now following this author!",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleFollowToggle} disabled={loading}>
      {isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  )
}
