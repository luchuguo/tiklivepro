import { supabase } from './supabase'

// 创建管理员账号的函数
export async function createAdminAccount() {
  try {
    // 1. 创建管理员用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@tiklive.pro',
      password: 'admin888',
    })

    if (authError) {
      console.error('Error creating admin user:', authError)
      return { success: false, error: authError.message }
    }

    if (authData.user) {
      // 2. 创建管理员资料
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          user_type: 'admin',
        })

      if (profileError) {
        console.error('Error creating admin profile:', profileError)
        return { success: false, error: profileError.message }
      }

      // 3. 添加管理员权限
      const permissions = [
        'user_management',
        'task_management', 
        'system_settings',
        'data_analytics',
        'content_moderation'
      ]

      for (const permission of permissions) {
        await supabase
          .from('admin_permissions')
          .insert({
            admin_id: authData.user.id,
            permission_name: permission,
            granted_by: authData.user.id
          })
      }

      // 4. 记录管理员创建日志
      await supabase
        .from('admin_logs')
        .insert({
          admin_id: authData.user.id,
          action_type: 'admin_account_created',
          description: '管理员账号创建成功'
        })

      return { success: true, user: authData.user }
    }

    return { success: false, error: '用户创建失败' }
  } catch (error) {
    console.error('Error in createAdminAccount:', error)
    return { success: false, error: '创建管理员账号时发生错误' }
  }
}

// 验证管理员权限
export async function verifyAdminPermission(userId: string, permission: string) {
  try {
    const { data, error } = await supabase
      .from('admin_permissions')
      .select('*')
      .eq('admin_id', userId)
      .eq('permission_name', permission)
      .single()

    return { hasPermission: !!data, error }
  } catch (error) {
    return { hasPermission: false, error }
  }
}

// 记录管理员操作
export async function logAdminAction(
  adminId: string,
  actionType: string,
  targetType?: string,
  targetId?: string,
  description?: string
) {
  try {
    const { error } = await supabase
      .from('admin_logs')
      .insert({
        admin_id: adminId,
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        description: description
      })

    return { success: !error, error }
  } catch (error) {
    return { success: false, error }
  }
}