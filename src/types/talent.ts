// Talent type definition
export type TalentType = 'live-host' | 'account-manager' | 'video-editor';

// Question type definition
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
  maxSize: number; // Unit: MB
  maxFiles: number;
  description: string;
}

export type Question = SelectQuestion | CheckboxQuestion | TextQuestion | FileQuestion;

// Talent type configuration type
interface TalentTypeInfo {
  label: string;
  description: string;
  icon: string;
  questions: Question[];
}

export type TalentTypeConfig = {
  [K in TalentType]: TalentTypeInfo;
};

// Experience options
export const experienceOptions = [
  { value: 'newbie', label: 'Newbie' },
  { value: '1-6', label: '1-6 months' },
  { value: '6-12', label: '6 months-1 year' },
  { value: '1-3', label: '1-3 years' },
  { value: '3+', label: '3+ years' }
];

// Live streaming and operation category options
export const liveCategories = [
  { value: 'beauty', label: 'Beauty & Skincare' },
  { value: 'fashion', label: 'Fashion & Apparel' },
  { value: 'food', label: 'Food & Beverage' },
  { value: 'digital', label: 'Digital & Tech' },
  { value: 'pet', label: 'Pet Supplies' },
  { value: 'household', label: 'Home & Household' }
];

// Host style options
export const hostStyles = [
  { value: 'vlog', label: 'Lifestyle Vlog' },
  { value: 'entertainment', label: 'Comedy & Entertainment' },
  { value: 'professional', label: 'Professional Explanation' },
  { value: 'emotional', label: 'Emotional Connection' }
];

// Operation platform options
export const platformOptions = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' }
];

// Operation skill options
export const operationSkills = [
  { value: 'content', label: 'Content Planning' },
  { value: 'data', label: 'Data Analysis' },
  { value: 'community', label: 'Community Management' },
  { value: 'marketing', label: 'Marketing & Promotion' }
];

// Editing software options
export const editingSoftware = [
  { value: 'pr', label: 'Premiere Pro' },
  { value: 'ae', label: 'After Effects' },
  { value: 'fcpx', label: 'Final Cut Pro' },
  { value: 'vegas', label: 'Vegas Pro' }
];

// Editing type options
export const editingTypeOptions = [
  { value: 'short-form-tiktok', label: 'Short-form TikTok videos' },
  { value: 'tiktok-livestream', label: 'TikTok livestream clips' },
  { value: 'tiktok-ugc', label: 'TikTok UGC editing' }
];

// Editing style options
export const editingStyles = [
  { value: 'vlog', label: 'Vlog Editing' },
  { value: 'commercial', label: 'Commercial Advertising' },
  { value: 'short', label: 'Short Video' },
  { value: 'documentary', label: 'Documentary Style' }
];

// Talent type configuration
export const talentTypeConfig: TalentTypeConfig = {
  'live-host': {
    label: 'Livestream Host',
    description: 'Go live and boost brand sales through your engaging hosting style.',
    icon: 'fas fa-microphone-alt',
    questions: [
      {
        key: 'experience',
        label: 'Live Streaming Experience',
        type: 'select',
        options: [
          { value: 'no-experience', label: 'No experience yet' },
          { value: 'some-experience', label: 'Some experience' },
          { value: 'regular-host', label: 'Regular livestream host' },
          { value: 'professional-host', label: 'Professional host' }
        ]
      },
      {
        key: 'categories',
        label: 'Expertise Categories',
        type: 'checkbox',
        options: liveCategories
      },
      {
        key: 'styles',
        label: 'Host Style',
        type: 'checkbox',
        options: hostStyles
      }
    ]
  },
  'account-manager': {
    label: 'UGC On-Camera Creator',
    description: 'Create authentic on-camera UGC videos for brands',
    icon: 'fas fa-chart-line',
    questions: [
      {
        key: 'experience',
        label: 'Can you appear on camera?',
        type: 'select',
        options: [
          { value: 'talking-head', label: 'Talking Head (direct-to-camera)' },
          { value: 'lifestyle', label: 'Lifestyle / Daily scenes' },
          { value: 'both', label: 'Both' },
          { value: 'voice-over', label: 'Voice-over only (no on-camera)' }
        ]
      },
      {
        key: 'categories',
        label: 'Content Category',
        type: 'checkbox',
        options: [
          { value: 'beauty', label: 'Beauty & Skincare' },
          { value: 'fashion', label: 'Fashion & Apparel' },
          { value: 'fitness', label: 'Fitness / Health' },
          { value: 'food', label: 'Food & Beverage' },
          { value: 'tech', label: 'Tech / Gadgets' },
          { value: 'home', label: 'Home / Pet / Kids' }
        ]
      },
      {
        key: 'portfolioFiles',
        label: 'Introduction Video (Optional)',
        type: 'file',
        accept: 'image/*,video/*',
        maxSize: 50,
        maxFiles: 3,
        description: 'Please briefly introduce yourself and confirm you can appear on camera'
      }
    ]
  },
  'video-editor': {
    label: 'Video Creator',
    description: 'Produce high-quality product or marketing videos',
    icon: 'fas fa-video',
    questions: [
      {
        key: 'experience',
        label: 'Editing Experience',
        type: 'select',
        options: experienceOptions
      },
      {
        key: 'software',
        label: 'Editing Type',
        type: 'checkbox',
        options: editingTypeOptions
      }
    ]
  }
}; 