// 达人类型定义
export type TalentType = 'live-host' | 'account-manager' | 'video-editor';

// 问题类型定义
interface BaseQuestion {
  key: string;
  label: string;
  type: 'select' | 'checkbox' | 'text' | 'file';
}

interface SelectQuestion extends BaseQuestion {
  type: 'select';
  options: Array<{ value: string; label: string }>;
}

interface CheckboxQuestion extends BaseQuestion {
  type: 'checkbox';
  options: Array<{ value: string; label: string }>;
}

interface TextQuestion extends BaseQuestion {
  type: 'text';
  placeholder: string;
}

interface FileQuestion extends BaseQuestion {
  type: 'file';
  accept: string;
  maxSize: number; // 单位：MB
  maxFiles: number;
  description: string;
}

export type Question = SelectQuestion | CheckboxQuestion | TextQuestion | FileQuestion;

// 达人类型配置类型
interface TalentTypeInfo {
  label: string;
  description: string;
  icon: string;
  questions: Question[];
}

export type TalentTypeConfig = {
  [K in TalentType]: TalentTypeInfo;
};

// 经验选项
export const experienceOptions = [
  { value: 'newbie', label: '新手小白' },
  { value: '1-6', label: '1-6个月' },
  { value: '6-12', label: '6个月-1年' },
  { value: '1-3', label: '1-3年' },
  { value: '3+', label: '3年以上' }
];

// 直播和运营品类选项
export const liveCategories = [
  { value: 'beauty', label: '美妆护肤' },
  { value: 'fashion', label: '服装鞋帽' },
  { value: 'food', label: '食品饮料' },
  { value: 'maternal', label: '母婴用品' },
  { value: 'digital', label: '3C数码' },
  { value: 'pet', label: '宠物用品' },
  { value: 'household', label: '家居百货' }
];

// 主播风格选项
export const hostStyles = [
  { value: 'drama', label: '情景剧情型' },
  { value: 'vlog', label: '生活方式Vlog' },
  { value: 'entertainment', label: '搞笑娱乐型' },
  { value: 'knowledge', label: '知识干货型' },
  { value: 'professional', label: '专业讲解型' },
  { value: 'emotional', label: '情感共鸣型' }
];

// 运营平台选项
export const platformOptions = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' }
];

// 运营技能选项
export const operationSkills = [
  { value: 'content', label: '内容策划' },
  { value: 'data', label: '数据分析' },
  { value: 'community', label: '社群运营' },
  { value: 'marketing', label: '营销推广' }
];

// 剪辑软件选项
export const editingSoftware = [
  { value: 'pr', label: 'Premiere Pro' },
  { value: 'ae', label: 'After Effects' },
  { value: 'fcpx', label: 'Final Cut Pro' },
  { value: 'vegas', label: 'Vegas Pro' }
];

// 剪辑风格选项
export const editingStyles = [
  { value: 'vlog', label: 'Vlog剪辑' },
  { value: 'commercial', label: '商业广告' },
  { value: 'short', label: '短视频' },
  { value: 'documentary', label: '纪实风格' }
];

// 达人类型配置
export const talentTypeConfig: TalentTypeConfig = {
  'live-host': {
    label: '代播达人',
    description: '专业直播带货，助力品牌提升销量',
    icon: 'fas fa-microphone-alt',
    questions: [
      {
        key: 'experience',
        label: '直播经验',
        type: 'select',
        options: experienceOptions
      },
      {
        key: 'categories',
        label: '擅长品类',
        type: 'checkbox',
        options: liveCategories
      },
      {
        key: 'styles',
        label: '主播风格',
        type: 'checkbox',
        options: hostStyles
      },
      {
        key: 'achievement',
        label: '最高成绩',
        type: 'text',
        placeholder: '例如：最高在线人数5000人 / 单场销售额20万元'
      },
      {
        key: 'portfolio',
        label: '作品展示',
        type: 'text',
        placeholder: '请提供2-3个代表性直播视频链接'
      },
      {
        key: 'portfolioFiles',
        label: '相关案例展示',
        type: 'file',
        accept: 'image/*,video/*',
        maxSize: 50,
        maxFiles: 3,
        description: '请上传直播带货相关的图片或视频（最多3个文件，每个文件不超过50MB）'
      }
    ]
  },
  'account-manager': {
    label: '账号运营',
    description: '专业账号运营，助力品牌提升影响力',
    icon: 'fas fa-chart-line',
    questions: [
      {
        key: 'experience',
        label: '运营经验',
        type: 'select',
        options: experienceOptions
      },
      {
        key: 'categories',
        label: '擅长品类',
        type: 'checkbox',
        options: liveCategories
      },
      {
        key: 'skills',
        label: '专业技能',
        type: 'checkbox',
        options: operationSkills
      },
      {
        key: 'cases',
        label: '成功案例',
        type: 'text',
        placeholder: '例如：帮助客户账号涨粉100万，月均销售额提升200%'
      },
      {
        key: 'portfolio',
        label: '作品展示',
        type: 'text',
        placeholder: '请提供2-3个代表性账号作品链接'
      },
      {
        key: 'portfolioFiles',
        label: '相关案例展示',
        type: 'file',
        accept: 'image/*,video/*',
        maxSize: 50,
        maxFiles: 3,
        description: '请上传账号运营相关的图片或视频（最多3个文件，每个文件不超过50MB）'
      }
    ]
  },
  'video-editor': {
    label: '视频剪辑',
    description: '专业视频剪辑，打造优质内容',
    icon: 'fas fa-video',
    questions: [
      {
        key: 'experience',
        label: '剪辑经验',
        type: 'select',
        options: experienceOptions
      },
      {
        key: 'software',
        label: '擅长软件',
        type: 'checkbox',
        options: editingSoftware
      },
      {
        key: 'styles',
        label: '擅长风格',
        type: 'checkbox',
        options: editingStyles
      },
      {
        key: 'portfolio',
        label: '作品展示',
        type: 'text',
        placeholder: '请提供2-3个代表作品链接'
      },
      {
        key: 'portfolioFiles',
        label: '相关案例展示',
        type: 'file',
        accept: 'image/*,video/*',
        maxSize: 50,
        maxFiles: 3,
        description: '请上传视频剪辑作品（最多3个文件，每个文件不超过50MB）'
      }
    ]
  }
}; 