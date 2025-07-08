import { supabase } from './supabase'

// 创建管理员账号的函数
export async function createAdminAccount() {
  try {
    console.log('开始创建管理员账号...')
    
    // 1. 先检查是否已经存在管理员
    const existingAdmin = await checkAdminExists()
    if (existingAdmin) {
      console.log('管理员账号已存在')
      return { success: true, message: '管理员账号已存在' }
    }
    
    // 2. 注册管理员用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@tiklive.pro',
      password: 'admin888',
    })

    console.log('注册响应:', { authData, authError })

    if (authError) {
      console.error('创建用户失败:', authError)
      
      // 如果用户已存在，尝试登录并设置为管理员
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        console.log('用户已存在，尝试设置为管理员...')
        
        // 尝试登录获取用户信息
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'admin@tiklive.pro',
          password: 'admin888',
        })
        
        if (signInError) {
          console.error('登录失败:', signInError)
          return { success: false, error: `登录失败: ${signInError.message}` }
        }
        
        if (signInData.user) {
          // 设置为管理员
          await createAdminProfile(signInData.user.id)
          return { success: true, user: signInData.user }
        }
      }
      
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: '用户创建失败' }
    }

    console.log('用户创建成功:', authData.user.id)

    // 3. 创建管理员资料和权限
    await createAdminProfile(authData.user.id)

    console.log('管理员账号创建完成')
    return { success: true, user: authData.user }

  } catch (error) {
    console.error('创建管理员账号时发生错误:', error)
    return { success: false, error: '创建管理员账号时发生错误，请重试' }
  }
}

// 创建管理员资料的辅助函数
async function createAdminProfile(userId: string) {
  try {
    console.log('开始创建管理员资料...')
    
    // 创建用户资料
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        user_type: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (profileError) {
      console.error('创建用户资料失败:', profileError)
      throw profileError
    }

    console.log('用户资料创建成功')

    // 添加管理员权限
    const permissions = [
      'user_management',
      'task_management', 
      'system_settings',
      'data_analytics',
      'content_moderation'
    ]

    for (const permission of permissions) {
      const { error: permError } = await supabase
        .from('admin_permissions')
        .upsert({
          admin_id: userId,
          permission_name: permission,
          granted_by: userId,
          granted_at: new Date().toISOString()
        }, {
          onConflict: 'admin_id,permission_name'
        })

      if (permError) {
        console.error(`添加权限 ${permission} 失败:`, permError)
        // 不抛出错误，继续添加其他权限
      }
    }

    console.log('管理员权限添加成功')

    // 记录创建日志
    const { error: logError } = await supabase
      .from('admin_logs')
      .insert({
        admin_id: userId,
        action_type: 'admin_account_created',
        description: '管理员账号创建成功',
        created_at: new Date().toISOString()
      })

    if (logError) {
      console.error('记录日志失败:', logError)
      // 不抛出错误，日志失败不影响主要功能
    }

  } catch (error) {
    console.error('创建管理员资料时出错:', error)
    throw error
  }
}

// 检查管理员是否存在
export async function checkAdminExists() {
  try {
    console.log('检查管理员是否存在...')
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_type', 'admin')
      .limit(1)

    console.log('管理员检查结果:', { data, error })

    if (error) {
      console.error('检查管理员失败:', error)
      return false
    }

    const exists = data && data.length > 0
    console.log('管理员是否存在:', exists)
    return exists
  } catch (error) {
    console.error('检查管理员时发生错误:', error)
    return false
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
        description: description,
        created_at: new Date().toISOString()
      })

    return { success: !error, error }
  } catch (error) {
    return { success: false, error }
  }
}