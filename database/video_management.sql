-- 视频管理模块数据库设计
-- 创建时间: 2024-01-22

-- 1. 创建视频分类表
CREATE TABLE IF NOT EXISTS video_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建视频表
CREATE TABLE IF NOT EXISTS videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    poster_url TEXT,
    duration VARCHAR(20),
    category_id UUID REFERENCES video_categories(id) ON DELETE SET NULL,
    influencer_name VARCHAR(100),
    influencer_avatar TEXT,
    influencer_followers VARCHAR(50),
    influencer_rating DECIMAL(3,2) DEFAULT 0.00,
    views_count VARCHAR(50) DEFAULT '0',
    likes_count VARCHAR(50) DEFAULT '0',
    comments_count VARCHAR(50) DEFAULT '0',
    shares_count VARCHAR(50) DEFAULT '0',
    tags TEXT[], -- 使用PostgreSQL数组类型存储标签
    is_featured BOOLEAN DEFAULT false, -- 是否推荐
    is_active BOOLEAN DEFAULT true, -- 是否启用
    sort_order INTEGER DEFAULT 0, -- 排序
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为视频表添加更新时间触发器
CREATE TRIGGER update_videos_updated_at 
    BEFORE UPDATE ON videos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 为视频分类表添加更新时间触发器
CREATE TRIGGER update_video_categories_updated_at 
    BEFORE UPDATE ON video_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 4. 插入测试数据

-- 插入视频分类
INSERT INTO video_categories (name, description, sort_order) VALUES
('美妆', '美妆产品相关视频', 1),
('时尚', '时尚服装搭配视频', 2),
('数码', '数码产品测评视频', 3),
('生活', '生活用品推荐视频', 4),
('美食', '美食制作教程视频', 5),
('旅游', '旅游景点推荐视频', 6),
('教育', '教育学习相关视频', 7),
('运动', '运动健身相关视频', 8),
('娱乐', '娱乐休闲相关视频', 9),
('其他', '其他类型视频', 10)
ON CONFLICT (name) DO NOTHING;

-- 插入测试视频数据
INSERT INTO videos (
    title, 
    description, 
    video_url, 
    poster_url, 
    duration, 
    category_id, 
    influencer_name, 
    influencer_avatar, 
    influencer_followers, 
    influencer_rating, 
    views_count, 
    likes_count, 
    comments_count, 
    shares_count, 
    tags, 
    is_featured, 
    sort_order
) VALUES
(
    '美妆产品直播带货',
    '专业美妆达人直播带货，展示产品效果，互动性强，转化率高。',
    'https://v45.tiktokcdn-eu.com/a9e24ff1f75ad64fa0ead5942e50f4f0/68a98175/video/tos/alisg/tos-alisg-pve-0037c001/ocTRGvfQLiAnJVANRet6J8AfpAQDNFMHhAiGfW/?a=1233&bti=OUBzOTg7QGo6OjZAL3AjLTAzYCMxNDNg&ch=0&cr=13&dr=0&er=0&lr=all&net=0&cd=0|0|0|&cv=1&br=2990&bt=1495&cs=2&ds=4&ft=XsFb8q4fmbdPD12-cv-T3wULqi~AMeF~O5&mime_type=video_mp4&qs=15&rc=NTZoNjxkOzo7ZmQ3Ozc5OUBpajxrdGo5cmVzNDMzODczNEAwMl8zMzMxNWMxNDReMl41YSMzMWFgMmRzc2thLS1kMTFzcw==&vvpl=1&l=202508220852540B89F9C1380A9E19F763&btag=e000bd000',
    'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
    '2:35',
    (SELECT id FROM video_categories WHERE name = '美妆'),
    '张小美',
    'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    '125万',
    4.8,
    '15.2万',
    '2.8万',
    '1.2万',
    '5.6千',
    ARRAY['美妆', '直播带货', '产品展示', '互动性强'],
    true,
    1
),
(
    '时尚服装展示',
    '时尚达人展示最新服装搭配，引领潮流趋势，提升品牌影响力。',
    'https://v45.tiktokcdn-eu.com/a9e24ff1f75ad64fa0ead5942e50f4f0/68a98175/video/tos/alisg/tos-alisg-pve-0037c001/ocTRGvfQLiAnJVANRet6J8AfpAQDNFMHhAiGfW/?a=1233&bti=OUBzOTg7QGo6OjZAL3AjLTAzYCMxNDNg&ch=0&cr=13&dr=0&er=0&lr=all&net=0&cd=0|0|0|&cv=1&br=2990&bt=1495&cs=2&ds=4&ft=XsFb8q4fmbdPD12-cv-T3wULqi~AMeF~O5&mime_type=video_mp4&qs=15&rc=NTZoNjxkOzo7ZmQ3Ozc5OUBpajxrdGo5cmVzNDMzODczNEAwMl8zMzMxNWMxNDReMl41YSMzMWFgMmRzc2thLS1kMTFzcw==&vvpl=1&l=202508220852540B89F9C1380A9E19F763&btag=e000bd000',
    'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    '3:12',
    (SELECT id FROM video_categories WHERE name = '时尚'),
    '李时尚',
    'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
    '98万',
    4.6,
    '12.8万',
    '2.1万',
    '8.5千',
    '4.2千',
    ARRAY['时尚', '服装搭配', '潮流趋势', '品牌展示'],
    true,
    2
),
(
    '数码产品测评',
    '专业数码达人深度测评最新产品，客观分析优缺点，帮助用户做出购买决策。',
    'https://v45.tiktokcdn-eu.com/a9e24ff1f75ad64fa0ead5942e50f4f0/68a98175/video/tos/alisg/tos-alisg-pve-0037c001/ocTRGvfQLiAnJVANRet6J8AfpAQDNFMHhAiGfW/?a=1233&bti=OUBzOTg7QGo6OjZAL3AjLTAzYCMxNDNg&ch=0&cr=13&dr=0&er=0&lr=all&net=0&cd=0|0|0|&cv=1&br=2990&bt=1495&cs=2&ds=4&ft=XsFb8q4fmbdPD12-cv-T3wULqi~AMeF~O5&mime_type=video_mp4&qs=15&rc=NTZoNjxkOzo7ZmQ3Ozc5OUBpajxrdGo5cmVzNDMzODczNEAwMl8zMzMxNWMxNDReMl41YSMzMWFgMmRzc2thLS1kMTFzcw==&vvpl=1&l=202508220852540B89F9C1380A9E19F763&btag=e000bd000',
    'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
    '4:28',
    (SELECT id FROM video_categories WHERE name = '数码'),
    '王数码',
    'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
    '156万',
    4.9,
    '18.5万',
    '3.2万',
    '1.8万',
    '7.1千',
    ARRAY['数码', '产品测评', '技术分析', '购买指南'],
    true,
    3
),
(
    '生活用品推荐',
    '生活达人分享实用好物，提升生活品质，让每一天都更加美好。',
    'https://v45.tiktokcdn-eu.com/a9e24ff1f75ad64fa0ead5942e50f4f0/68a98175/video/tos/alisg/tos-alisg-pve-0037c001/ocTRGvfQLiAnJVANRet6J8AfpAQDNFMHhAiGfW/?a=1233&bti=OUBzOTg7QGo6OjZAL3AjLTAzYCMxNDNg&ch=0&cr=13&dr=0&er=0&lr=all&net=0&cd=0|0|0|&cv=1&br=2990&bt=1495&cs=2&ds=4&ft=XsFb8q4fmbdPD12-cv-T3wULqi~AMeF~O5&mime_type=video_mp4&qs=15&rc=NTZoNjxkOzo7ZmQ3Ozc5OUBpajxrdGo5cmVzNDMzODczNEAwMl8zMzMxNWMxNDReMl41YSMzMWFgMmRzc2thLS1kMTFzcw==&btag=e000bd000',
    'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
    '2:15',
    (SELECT id FROM video_categories WHERE name = '生活'),
    '陈生活',
    'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    '78万',
    4.7,
    '9.7万',
    '1.5万',
    '6.8千',
    '3.2千',
    ARRAY['生活', '好物推荐', '品质提升', '实用分享'],
    false,
    4
),
(
    '美食制作教程',
    '美食达人分享简单易学的家常菜制作方法，让每个人都能成为厨房高手。',
    'https://v45.tiktokcdn-eu.com/a9e24ff1f75ad64fa0ead5942e50f4f0/68a98175/video/tos/alisg/tos-alisg-pve-0037c001/ocTRGvfQLiAnJVANRet6J8AfpAQDNFMHhAiGfW/?a=1233&bti=OUBzOTg7QGo6OjZAL3AjLTAzYCMxNDNg&ch=0&cr=13&dr=0&er=0&lr=all&net=0&cd=0|0|0|&cv=1&br=2990&bt=1495&cs=2&ds=4&ft=XsFb8q4fmbdPD12-cv-T3wULqi~AMeF~O5&mime_type=video_mp4&qs=15&rc=NTZoNjxkOzo7ZmQ3Ozc5OUBpajxrdGo5cmVzNDMzODczNEAwMl8zMzMxNWMxNDReMl41YSMzMWFgMmRzc2thLS1kMTFzcw==&btag=e000bd000',
    'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
    '5:42',
    (SELECT id FROM video_categories WHERE name = '美食'),
    '刘美食',
    'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=150',
    '189万',
    4.9,
    '22.3万',
    '4.1万',
    '2.3万',
    '8.9千',
    ARRAY['美食', '制作教程', '家常菜', '厨房技巧'],
    true,
    5
),
(
    '旅游景点推荐',
    '旅行达人分享国内外精彩景点，提供实用的旅游攻略和注意事项。',
    'https://v45.tiktokcdn-eu.com/a9e24ff1f75ad64fa0ead5942e50f4f0/68a98175/video/tos/alisg/tos-alisg-pve-0037c001/ocTRGvfQLiAnJVANRet6J8AfpAQDNFMHhAiGfW/?a=1233&bti=OUBzOTg7QGo6OjZAL3AjLTAzYCMxNDNg&ch=0&cr=13&dr=0&er=0&lr=all&net=0&cd=0|0|0|&cv=1&br=2990&bt=1495&cs=2&ds=4&ft=XsFb8q4fmbdPD12-cv-T3wULqi~AMeF~O5&mime_type=video_mp4&qs=15&rc=NTZoNjxkOzo7ZmQ3Ozc5OUBpajxrdGo5cmVzNDMzODczNEAwMl8zMzMxNWMxNDReMl41YSMzMWFgMmRzc2thLS1kMTFzcw==&btag=e000bd000',
    'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=400',
    '3:55',
    (SELECT id FROM video_categories WHERE name = '旅游'),
    '赵旅行',
    'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=150',
    '142万',
    4.8,
    '16.8万',
    '2.9万',
    '1.4万',
    '6.7千',
    ARRAY['旅游', '景点推荐', '旅游攻略', '注意事项'],
    false,
    6
);

-- 5. 创建RLS策略（行级安全策略）

-- 启用RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_categories ENABLE ROW LEVEL SECURITY;

-- 创建策略：超级管理员可以访问所有数据
CREATE POLICY "超级管理员可以访问所有视频" ON videos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.user_type = 'admin'
        )
    );

CREATE POLICY "超级管理员可以访问所有视频分类" ON video_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.user_type = 'admin'
        )
    );

-- 创建策略：普通用户可以查看启用的视频和分类
CREATE POLICY "用户可以查看启用的视频" ON videos
    FOR SELECT USING (is_active = true);

CREATE POLICY "用户可以查看启用的视频分类" ON video_categories
    FOR SELECT USING (is_active = true);

-- 6. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_videos_category_id ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_is_active ON videos(is_active);
CREATE INDEX IF NOT EXISTS idx_videos_is_featured ON videos(is_featured);
CREATE INDEX IF NOT EXISTS idx_videos_sort_order ON videos(sort_order);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);
CREATE INDEX IF NOT EXISTS idx_video_categories_sort_order ON video_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_video_categories_is_active ON video_categories(is_active);

-- 7. 创建视图：视频列表视图（包含分类信息）
CREATE OR REPLACE VIEW videos_with_categories AS
SELECT 
    v.*,
    vc.name as category_name,
    vc.description as category_description
FROM videos v
LEFT JOIN video_categories vc ON v.category_id = vc.id
WHERE v.is_active = true
ORDER BY v.sort_order ASC, v.created_at DESC;

-- 8. 验证数据插入
SELECT '视频分类数量:' as info, COUNT(*) as count FROM video_categories
UNION ALL
SELECT '视频数量:', COUNT(*) FROM videos
UNION ALL
SELECT '推荐视频数量:', COUNT(*) FROM videos WHERE is_featured = true;

-- 9. 查看插入的数据
SELECT 
    v.title,
    vc.name as category,
    v.influencer_name,
    v.views_count,
    v.is_featured
FROM videos v
LEFT JOIN video_categories vc ON v.category_id = vc.id
ORDER BY v.sort_order; 