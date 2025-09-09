"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import type { Comment, Profile } from "@/lib/types"

interface CommentsProps {
  storyId: string
}

export function Comments({ storyId }: CommentsProps) {
  const [comments, setComments] = useState<
    (Comment & { author: Profile; replies?: (Comment & { author: Profile })[] })[]
  >([])
  const [newCommentContent, setNewCommentContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchComments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        author:profiles(id, username, display_name, avatar_url)
      `,
      )
      .eq("story_id", storyId)
      .is("parent_id", null) // Fetch top-level comments
      .order("created_at", { ascending: true })

    if (error) {
      toast({
        title: "Error fetching comments",
        description: error.message,
        variant: "destructive",
      })
    } else {
      // For a more complete threading, you'd fetch replies separately or use a recursive CTE in SQL
      // For now, we'll just display top-level comments
      setComments(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
    fetchComments()
  }, [storyId, supabase])

  const handlePostComment = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to post comments.",
        variant: "destructive",
      })
      return
    }
    if (!newCommentContent.trim()) {
      toast({
        title: "Empty comment",
        description: "Comment cannot be empty.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from("comments")
      .insert({
        story_id: storyId,
        author_id: user.id,
        content: newCommentContent.trim(),
      })
      .select(
        `
        *,
        author:profiles(id, username, display_name, avatar_url)
      `,
      )
      .single()

    if (error) {
      toast({
        title: "Error posting comment",
        description: error.message,
        variant: "destructive",
      })
    } else if (data) {
      setComments((prev) => [...prev, data])
      setNewCommentContent("")
      toast({
        title: "Comment posted!",
        description: "Your comment has been added.",
      })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Comments ({comments.length})</h2>

      {/* New Comment Input */}
      <Card>
        <CardContent className="pt-6">
          {user ? (
            <div className="space-y-4">
              <Textarea
                placeholder="Write your comment here..."
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                rows={3}
                disabled={loading}
              />
              <Button onClick={handlePostComment} disabled={loading}>
                {loading ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-center">
              <Link href="/auth/signin" className="text-primary hover:underline">
                Sign in
              </Link>{" "}
              to leave a comment.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Comments List */}
      {loading && comments.length === 0 ? (
        <p className="text-center text-muted-foreground">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-center text-muted-foreground">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={comment.author?.avatar_url || "/placeholder.svg"}
                      alt={comment.author?.username}
                    />
                    <AvatarFallback>{comment.author?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Link
                      href={`/profile/${comment.author?.username}`}
                      className="font-semibold text-sm hover:text-primary"
                    >
                      {comment.author?.display_name || comment.author?.username}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{comment.content}</p>
                {/* Future: Add like/reply buttons here */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
