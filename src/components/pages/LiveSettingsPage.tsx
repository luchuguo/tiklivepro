import { useState, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from '@/lib/supabase';
import { Influencer } from '@/lib/supabase';
import { Loader, Save, X, Video } from 'lucide-react';
import { Link } from 'react-router-dom';

const LiveSettingsPage = () => {
  const user = useUser();
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 表单数据状态
  const [formData, setFormData] = useState({
    tiktok_profile_url: '',
    tiktok_followers_count: 0,
    avg_play_count: 0,
    avg_engagement_rate: 0,
    has_tiktok_shop: false,
    live_venue: '',
    weekly_schedule: '',
    bilingual_live: false,
    languages: [] as string[],
  });
  
  const [newLanguage, setNewLanguage] = useState('');

  // 获取达人数据
  const fetchInfluencerProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data: influencerData, error: influencerError } = await supabase
        .from('influencers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (influencerError) {
        console.error('获取达人资料失败:', influencerError);
        setError('获取资料失败，请重试');
      } else if (influencerData) {
        setInfluencer(influencerData);
        // 填充直播相关表单数据
        setFormData({
          tiktok_profile_url: influencerData.tiktok_profile_url || '',
          tiktok_followers_count: influencerData.tiktok_followers_count || 0,
          avg_play_count: influencerData.avg_play_count || 0,
          avg_engagement_rate: influencerData.avg_engagement_rate || 0,
          has_tiktok_shop: influencerData.has_tiktok_shop || false,
          live_venue: influencerData.live_venue || '',
          weekly_schedule: influencerData.weekly_schedule || '',
          bilingual_live: influencerData.bilingual_live || false,
          languages: influencerData.languages || [],
        });
      }
    } catch (error) {
      console.error('获取达人资料时发生错误:', error);
      setError('获取资料时发生错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInfluencerProfile();
    }
  }, [user]);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // 添加语言
  const handleAddLanguage = () => {
    if (!newLanguage.trim()) return;
    if (formData.languages.includes(newLanguage.trim())) {
      alert('该语言已存在');
      return;
    }
    setFormData(prev => ({
      ...prev,
      languages: [...prev.languages, newLanguage.trim()]
    }));
    setNewLanguage('');
  };

  // 移除语言
  const handleRemoveLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }));
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !influencer) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const updateData = {
        ...formData,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('influencers')
        .update(updateData)
        .eq('id', influencer.id);
      
      if (error) {
        console.error('更新直播设置失败:', error);
        setError('更新失败，请重试');
      } else {
        setSuccess('直播设置已成功更新');
        // 刷新数据
        fetchInfluencerProfile();
      }
    } catch (error) {
      console.error('更新直播设置时发生错误:', error);
      setError('更新时发生错误，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-pink-500" />
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">直播设置</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* TikTok账号信息 */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">TikTok账号信息</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TikTok账号链接
              </label>
              <input
                type="url"
                name="tiktok_profile_url"
                value={formData.tiktok_profile_url}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="https://www.tiktok.com/@your_account"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TikTok粉丝数量
              </label>
              <input
                type="number"
                name="tiktok_followers_count"
                value={formData.tiktok_followers_count}
                onChange={handleInputChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="请输入粉丝数量"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                平均播放量
              </label>
              <input
                type="number"
                name="avg_play_count"
                value={formData.avg_play_count}
                onChange={handleInputChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="请输入平均播放量"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                平均互动率（%）
              </label>
              <input
                type="number"
                name="avg_engagement_rate"
                value={formData.avg_engagement_rate}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="请输入平均互动率"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="has_tiktok_shop"
                  checked={formData.has_tiktok_shop}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="ml-2 text-sm text-gray-700">已开通TikTok Shop</span>
              </label>
            </div>
          </div>
        </div>
        
        {/* 直播信息 */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">直播信息</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                直播场地
              </label>
              <select
                name="live_venue"
                value={formData.live_venue}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">请选择直播场地</option>
                <option value="专业直播间">专业直播间</option>
                <option value="家庭环境">家庭环境</option>
                <option value="户外">户外</option>
                <option value="办公室">办公室</option>
                <option value="其他">其他</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                每周直播档期
              </label>
              <textarea
                name="weekly_schedule"
                value={formData.weekly_schedule}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                placeholder="如：星期二，20：00-24：00；星期六，14：00-18：00"
              />
              <p className="mt-1 text-sm text-gray-500">
                请按格式输入：星期几，时间段（例如：星期二，20:00-24:00）
              </p>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="bilingual_live"
                  checked={formData.bilingual_live}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="ml-2 text-sm text-gray-700">可以双语直播（英语/中文）</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                支持的语言
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.languages.map((lang, index) => (
                  <div key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center">
                    <span>{lang}</span>
                    <button 
                      type="button"
                      onClick={() => handleRemoveLanguage(lang)}
                      className="ml-2 text-blue-700 hover:text-blue-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <select
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">选择语言...</option>
                  {['中文', '英语', '日语', '韩语', '法语', '德语', '西班牙语', '其他']
                    .filter(lang => !formData.languages.includes(lang))
                    .map(language => (
                      <option key={language} value={language}>{language}</option>
                    ))
                  }
                </select>
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 提交按钮 */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>保存设置</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LiveSettingsPage;
