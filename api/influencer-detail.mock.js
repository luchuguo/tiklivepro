import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default [
  {
    url: '/api/influencer-detail',
    method: 'GET',
    response: async ({ query }) => {
      try {
        const { id } = query;
        
        if (!id) {
          return {
            status: 400,
            body: { error: 'Influencer ID is required' }
          };
        }

        console.log(`本地API: 获取达人详情: ${id}`);

        // 从 Supabase 获取达人详情
        const { data, error } = await supabase
          .from('influencers')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error(`Supabase 查询达人详情失败: ${id}`, error);
          
          if (error.code === 'PGRST116') {
            return {
              status: 404,
              body: { error: 'Influencer not found' }
            };
          }
          
          return {
            status: 500,
            body: { error: error.message }
          };
        }

        if (!data) {
          return {
            status: 404,
            body: { error: 'Influencer not found' }
          };
        }

        console.log(`本地API: 成功获取达人详情: ${id}`);

        // 获取达人的任务历史
        const { data: taskHistory, error: taskError } = await supabase
          .from('task_applications')
          .select(`
            *,
            task:tasks(
              id,
              title,
              budget_min,
              budget_max,
              status,
              company:companies(company_name)
            )
          `)
          .eq('influencer_id', id)
          .order('applied_at', { ascending: false })
          .limit(10);

        if (taskError) {
          console.error('获取任务历史失败:', taskError);
        }

        // 获取达人的直播记录
        const { data: liveSessions, error: liveError } = await supabase
          .from('live_sessions')
          .select(`
            *,
            task:tasks(
              id,
              title,
              company:companies(company_name)
            )
          `)
          .eq('influencer_id', id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (liveError) {
          console.error('获取直播记录失败:', liveError);
        }

        // 组合完整数据
        const completeData = {
          ...data,
          taskHistory: taskHistory || [],
          liveSessions: liveSessions || []
        };

        return {
          status: 200,
          body: completeData
        };

      } catch (error) {
        console.error('本地API处理错误:', error);
        return {
          status: 500,
          body: { error: 'Internal Server Error' }
        };
      }
    }
  }
]; 