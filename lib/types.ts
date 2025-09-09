export interface Profile {
  id: string
  username: string
  display_name?: string
  bio?: string
  avatar_url?: string
  location?: string
  website?: string
  followers_count: number
  following_count: number
  stories_count: number
  created_at: string
  updated_at: string
}

export interface Story {
  id: string
  author_id: string
  title: string
  content: string
  excerpt?: string
  cover_image_url?: string
  story_type: "one_time" | "series" | "novel"
  status: "draft" | "published" | "completed" | "on_hold"
  tags: string[]
  genre?: string
  chapter_number: number
  series_id?: string | null // Can be null for standalone or parent series
  likes_count: number
  comments_count: number
  bookmarks_count: number
  views_count: number
  is_featured: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  author?: Profile
  is_liked?: boolean
  is_bookmarked?: boolean
  is_subscribed?: boolean
  chapters?: Story[] // Added for series/novel parent stories
}

export interface Comment {
  id: string
  story_id: string
  author_id: string
  content: string
  parent_id?: string
  likes_count: number
  created_at: string
  updated_at: string
  author?: Profile
  replies?: Comment[]
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}
