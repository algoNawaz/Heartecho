-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Stories policies
CREATE POLICY "Published stories are viewable by everyone" ON stories FOR SELECT USING (status = 'published');
CREATE POLICY "Authors can view their own stories" ON stories FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Authors can insert their own stories" ON stories FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their own stories" ON stories FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete their own stories" ON stories FOR DELETE USING (auth.uid() = author_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can like stories" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike stories" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid() = author_id);

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can bookmark stories" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can subscribe to stories" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsubscribe from stories" ON subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can insert reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view their own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);
