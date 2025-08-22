import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default [
  {
    url: '/api/task-detail',
    method: 'GET',
    response: async ({ query }) => {
      try {
        const { id } = query;
        
        if (!id) {
          return {
            status: 400,
            body: { error: 'Task ID is required' }
          };
        }

        console.log(`本地API: 获取任务详情: ${id}`);

        // 从 Supabase 获取任务详情，包含关联数据
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            company:companies(
              id,
              company_name,
              contact_person,
              industry,
              company_size,
              website,
              description,
              logo_url,
              is_verified
            ),
            category:task_categories(
              id,
              name,
              description,
              icon
            )
          `)
          .eq('id', id)
          .single();

        if (error) {
          console.error(`Supabase 查询任务详情失败: ${id}`, error);
          
          if (error.code === 'PGRST116') {
            return {
              status: 404,
              body: { error: 'Task not found' }
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
            body: { error: 'Task not found' }
          };
        }

        console.log(`本地API: 成功获取任务详情: ${id}`);

        return {
          status: 200,
          body: data
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