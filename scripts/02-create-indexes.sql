-- Create indexes for better performance
CREATE INDEX idx_stories_author_id ON stories(author_id);
CREATE INDEX idx_stories_published_at ON stories(published_at DESC);
CREATE INDEX idx_stories_story_type ON stories(story_type);
CREATE INDEX idx_stories_series_id ON stories(series_id);
CREATE INDEX idx_stories_tags ON stories USING GIN(tags);
CREATE INDEX idx_comments_story_id ON comments(story_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_likes_story_id ON likes(story_id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
