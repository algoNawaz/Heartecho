"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Settings, Upload, Save, User } from "lucide-react"
import type { Profile } from "@/lib/types"

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [location, setLocation] = useState("")
  const [website, setWebsite] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/signin")
        return
      }
      setUser(user)

      const { data: profileData, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) {
        toast({
          title: "Error loading profile",
          description: error.message,
          variant: "destructive",
        })
      } else if (profileData) {
        setProfile(profileData)
        setDisplayName(profileData.display_name || "")
        setBio(profileData.bio || "")
        setLocation(profileData.location || "")
        setWebsite(profileData.website || "")
        setAvatarUrl(profileData.avatar_url || null)
      }
      setLoading(false)
    }
    loadProfile()
  }, [supabase, router, toast])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      setAvatarUrl(URL.createObjectURL(file)) // For immediate preview
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) {
      toast({
        title: "Error",
        description: "User not logged in or profile not loaded.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    let newAvatarUrl = avatarUrl

    try {
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop()
        const fileName = `${user.id}-${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile, {
          cacheControl: "3600",
          upsert: true, // Overwrite if file with same name exists
        })

        if (uploadError) {
          throw uploadError
        }

        const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath)

        newAvatarUrl = publicUrlData.publicUrl
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          bio: bio,
          location: location,
          website: website,
          avatar_url: newAvatarUrl,
        })
        .eq("id", user.id)

      if (updateError) {
        throw updateError
      }

      toast({
        title: "Profile updated!",
        description: "Your profile information has been saved.",
      })
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading profile settings...</p>
      </div>
    )
  }

  if (!user) {
    return null // Redirect handled by useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Settings className="h-8 w-8 mr-3 text-primary" />
          Profile Settings
        </h1>
        <p className="text-muted-foreground">Manage your public profile information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your display name, bio, and other details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24 border-2 border-red-300 dark:border-red-700">
                <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={profile?.username || "User Avatar"} />
                <AvatarFallback className="text-3xl font-semibold bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300">
                  {profile?.username?.charAt(0).toUpperCase() || <User className="h-12 w-12" />}
                </AvatarFallback>
              </Avatar>
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <Button asChild variant="outline">
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Avatar
                  </span>
                </Button>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={loading}
                />
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={profile?.username || ""} disabled />
              <p className="text-sm text-muted-foreground">Your username cannot be changed.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="Your public display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us a little about yourself"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  placeholder="e.g., New York, USA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  placeholder="Your personal website or social link"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
