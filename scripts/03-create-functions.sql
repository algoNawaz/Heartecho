-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update counters
CREATE OR REPLACE FUNCTION update_story_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'likes' THEN
      UPDATE stories SET likes_count = likes_count + 1 WHERE id = NEW.story_id;
    ELSIF TG_TABLE_NAME = 'comments' THEN
      UPDATE stories SET comments_count = comments_count + 1 WHERE id = NEW.story_id;
    ELSIF TG_TABLE_NAME = 'bookmarks' THEN
      UPDATE stories SET bookmarks_count = bookmarks_count + 1 WHERE id = NEW.story_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'likes' THEN
      UPDATE stories SET likes_count = likes_count - 1 WHERE id = OLD.story_id;
    ELSIF TG_TABLE_NAME = 'comments' THEN
      UPDATE stories SET comments_count = comments_count - 1 WHERE id = OLD.story_id;
    ELSIF TG_TABLE_NAME = 'bookmarks' THEN
      UPDATE stories SET bookmarks_count = bookmarks_count - 1 WHERE id = OLD.story_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for counters
CREATE TRIGGER update_likes_count AFTER INSERT OR DELETE ON likes FOR EACH ROW EXECUTE FUNCTION update_story_counts();
CREATE TRIGGER update_comments_count AFTER INSERT OR DELETE ON comments FOR EACH ROW EXECUTE FUNCTION update_story_counts();
CREATE TRIGGER update_bookmarks_count AFTER INSERT OR DELETE ON bookmarks FOR EACH ROW EXECUTE FUNCTION update_story_counts();

-- Function to update follow counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    UPDATE profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_follow_counts_trigger AFTER INSERT OR DELETE ON follows FOR EACH ROW EXECUTE FUNCTION update_follow_counts();
