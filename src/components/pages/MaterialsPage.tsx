import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Plus, Trash2, Loader, Save, X, Video, Star, Shield, MapPin } from "lucide-react";

export function MaterialsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 基本信息
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nickname, setNickname] = useState("");
  const [location, setLocation] = useState("");

  // TikTok账号信息
  const [tiktokAccount, setTiktokAccount] = useState("");
  const [tiktokProfileUrl, setTiktokProfileUrl] = useState("");
  const [tiktokFollowersCount, setTiktokFollowersCount] = useState("");
  const [avgPlayCount, setAvgPlayCount] = useState("");
  const [avgEngagementRate, setAvgEngagementRate] = useState("");
  const [hasTiktokShop, setHasTiktokShop] = useState(false);

  // 专业信息
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [newTag, setNewTag] = useState("");

  // 直播信息
  const [liveVenue, setLiveVenue] = useState("");
  const [weeklySchedule, setWeeklySchedule] = useState("");
  const [bilingualLive, setBilingualLive] = useState(false);
  const [languages, setLanguages] = useState<string[]>([]);

  // 可选择的选项
  const availableCategories = [
    "美妆护肤",
    "家居厨房用品",
    "清洁类工具",
    "宠物用品",
    "时尚服饰配件",
    "数码配件",
    "身体护理",
    "珠宝首饰",
    "美食饮品",
    "其他",
  ];

  const liveVenues = [
    "专业直播间",
    "家庭环境",
    "户外",
    "办公室",
    "其他",
  ];

  const languageOptions = [
    "中文",
    "英语",
    "日语",
    "韩语",
    "法语",
    "德语",
    "西班牙语",
    "其他",
  ];

  // 获取用户信息
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login-test");
          return;
        }

        const { data: influencer, error: fetchError } = await supabase
          .from("influencers")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(); // 使用 maybeSingle 而不是 single，避免 406 错误

        if (fetchError) {
          console.error("获取用户资料失败:", fetchError);
          setError("获取资料失败，请重试");
          return;
        }
        
        if (!influencer) {
          console.log("用户资料不存在，可能是新用户");
          setError("用户资料不存在");
          return;
        }

        if (influencer) {
          // 填充表单数据
          setFirstName(influencer.first_name || "");
          setLastName(influencer.last_name || "");
          setPhoneNumber(influencer.phone_number || "");
          setNickname(influencer.nickname || "");
          setLocation(influencer.location || "");
          setTiktokAccount(influencer.tiktok_account || "");
          setTiktokProfileUrl(influencer.tiktok_profile_url || "");
          setTiktokFollowersCount(influencer.tiktok_followers_count || "");
          setAvgPlayCount(influencer.avg_play_count || "");
          setAvgEngagementRate(influencer.avg_engagement_rate || "");
          setHasTiktokShop(influencer.has_tiktok_shop || false);
          setCategories(influencer.categories || []);
          setTags(influencer.tags || []);
          setHourlyRate(influencer.hourly_rate || "");
          setExperienceYears(influencer.experience_years || "");
          setLiveVenue(influencer.live_venue || "");
          setWeeklySchedule(influencer.weekly_schedule || "");
          setBilingualLive(influencer.bilingual_live || false);
          setLanguages(influencer.languages || []);
        }
      } catch (error) {
        console.error("获取用户资料时发生错误:", error);
        setError("获取资料时发生错误，请重试");
      }
    };

    fetchUserProfile();
  }, [navigate]);

  // 处理标签添加
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (tags.includes(newTag.trim())) {
      setError("该标签已存在");
      return;
    }
    setTags([...tags, newTag.trim()]);
    setNewTag("");
    setError("");
  };

  // 处理标签删除
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("请先登录");
        return;
      }

      const updateData = {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        nickname,
        location,
        tiktok_account: tiktokAccount,
        tiktok_profile_url: tiktokProfileUrl,
        tiktok_followers_count: tiktokFollowersCount,
        avg_play_count: avgPlayCount,
        avg_engagement_rate: avgEngagementRate,
        has_tiktok_shop: hasTiktokShop,
        categories,
        tags,
        hourly_rate: hourlyRate,
        experience_years: experienceYears,
        live_venue: liveVenue,
        weekly_schedule: weeklySchedule,
        bilingual_live: bilingualLive,
        languages,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("influencers")
        .update(updateData)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("更新资料失败:", updateError);
        setError("更新失败，请重试");
      } else {
        setSuccess("资料更新成功！");
        setTimeout(() => {
          navigate("/influencer-profile");
        }, 2000);
      }
    } catch (error) {
      console.error("更新资料时发生错误:", error);
      setError("更新失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">材料补充</h1>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 基础信息区域 */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  基础信息
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      姓 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="请输入姓"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="请输入名"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      手机号码 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="请输入手机号码"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      昵称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="请输入昵称"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      所在地
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="请输入所在城市"
                    />
                  </div>
                </div>
              </div>

              {/* TikTok账号信息区域 */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Video className="w-5 h-5 mr-2" />
                  TikTok账号信息
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TikTok账号 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={tiktokAccount}
                      onChange={(e) => setTiktokAccount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="请输入TikTok账号"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TikTok账号链接 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={tiktokProfileUrl}
                      onChange={(e) => setTiktokProfileUrl(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="https://www.tiktok.com/@username"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TikTok粉丝数量 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={tiktokFollowersCount}
                      onChange={(e) => setTiktokFollowersCount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="请输入粉丝数量"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      平均播放量
                    </label>
                    <input
                      type="number"
                      value={avgPlayCount}
                      onChange={(e) => setAvgPlayCount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="请输入平均播放量"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      平均互动率 (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={avgEngagementRate}
                      onChange={(e) => setAvgEngagementRate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="请输入互动率"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hasTiktokShop}
                        onChange={(e) => setHasTiktokShop(e.target.checked)}
                        className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        已开通TikTok Shop（小黄车）
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 专业信息区域 */}
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  专业信息
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      时薪 (美元/小时)
                    </label>
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="请输入时薪"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      经验年限（年）
                    </label>
                    <input
                      type="number"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="请输入经验年限"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    擅长领域
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableCategories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={categories.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCategories([...categories, category]);
                            } else {
                              setCategories(
                                categories.filter((c) => c !== category)
                              );
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    技能标签
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full flex items-center"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="添加新标签 (如：美妆博主)"
                      onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>

              {/* 直播信息区域 */}
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Video className="w-5 h-5 mr-2" />
                  直播信息
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      直播场地
                    </label>
                    <select
                      value={liveVenue}
                      onChange={(e) => setLiveVenue(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">请选择直播场地</option>
                      {liveVenues.map((venue) => (
                        <option key={venue} value={venue}>
                          {venue}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={bilingualLive}
                        onChange={(e) => setBilingualLive(e.target.checked)}
                        className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        可以双语直播（英语/中文）
                      </span>
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    每周直播档期
                  </label>
                  <textarea
                    value={weeklySchedule}
                    onChange={(e) => setWeeklySchedule(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                    placeholder="如：星期二，20：00-24：00；星期六，14：00-18：00"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    请按格式输入：星期几，时间段（例如：星期二，20:00-24:00）
                  </p>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    支持的语言
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {languageOptions.map((lang) => (
                      <label key={lang} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={languages.includes(lang)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setLanguages([...languages, lang]);
                            } else {
                              setLanguages(languages.filter((l) => l !== lang));
                            }
                          }}
                          className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{lang}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>保存中...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>保存资料</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MaterialsPage;

