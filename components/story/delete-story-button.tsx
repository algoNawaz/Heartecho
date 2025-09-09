"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Trash2 } from "lucide-react"

interface DeleteStoryButtonProps {
  storyId: string
  onDeleteSuccess?: () => void
}

export function DeleteStoryButton({ storyId, onDeleteSuccess }: DeleteStoryButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.from("stories").delete().eq("id", storyId)

      if (error) {
        throw error
      }

      toast({
        title: "Story Deleted!",
        description: "Your story has been successfully removed.",
      })
      if (onDeleteSuccess) {
        onDeleteSuccess()
      } else {
        router.refresh() // Refresh the current page to reflect changes
      }
    } catch (error: any) {
      toast({
        title: "Error deleting story",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={loading}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your story and remove its data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
