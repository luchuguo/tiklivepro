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
  { value: 'maternal', label: 'Maternal & Baby' },
  { value: 'digital', label: 'Digital & Tech' },
  { value: 'pet', label: 'Pet Supplies' },
  { value: 'household', label: 'Home & Household' }
];

// Host style options
export const hostStyles = [
  { value: 'drama', label: 'Drama & Storytelling' },
  { value: 'vlog', label: 'Lifestyle Vlog' },
  { value: 'entertainment', label: 'Comedy & Entertainment' },
  { value: 'knowledge', label: 'Knowledge & Education' },
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
        options: experienceOptions
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
      },
      {
        key: 'achievement',
        label: 'Best Achievement',
        type: 'text',
        placeholder: 'e.g., Peak viewers 5000 / Single session sales $20,000'
      },
      {
        key: 'portfolio',
        label: 'Portfolio Showcase',
        type: 'text',
        placeholder: 'Please provide 2-3 representative live streaming video links'
      },
      {
        key: 'portfolioFiles',
        label: 'Related Case Studies',
        type: 'file',
        accept: 'image/*,video/*',
        maxSize: 50,
        maxFiles: 3,
        description: 'Please upload live streaming sales related images or videos (max 3 files, each file no more than 50MB)'
      }
    ]
  },
  'account-manager': {
    label: 'UGC On-Camera Creator',
    description: 'Manage brand pages and grow engagement',
    icon: 'fas fa-chart-line',
    questions: [
      {
        key: 'experience',
        label: 'Can you appear on camera?',
        type: 'select',
        options: [
          { value: 'yes-talking', label: 'Yes – Talking Head / Lifestyle' }
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
        key: 'skills',
        label: 'On-camera language',
        type: 'checkbox',
        options: [
          { value: 'english', label: 'English' },
          { value: 'chinese', label: 'Chinese' },
          { value: 'bilingual', label: 'Bilingual' }
        ]
      },
      {
        key: 'cases',
        label: 'Price per video (USD)',
        type: 'select',
        options: [
          { value: 'under-50', label: '<$50' },
          { value: '50-100', label: '$50–100' },
          { value: '100-200', label: '$100–200' },
          { value: '200-plus', label: '$200+' }
        ]
      },
      {
        key: 'portfolio',
        label: 'Contact Information',
        type: 'text',
        placeholder: 'Telegram / WhatsApp (at least fill in one)'
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
        label: 'Proficient Software',
        type: 'checkbox',
        options: editingSoftware
      },
      {
        key: 'styles',
        label: 'Expertise Styles',
        type: 'checkbox',
        options: editingStyles
      },
      {
        key: 'portfolio',
        label: 'Portfolio Showcase',
        type: 'text',
        placeholder: 'Please provide 2-3 representative work links'
      },
      {
        key: 'portfolioFiles',
        label: 'Related Case Studies',
        type: 'file',
        accept: 'image/*,video/*',
        maxSize: 50,
        maxFiles: 3,
        description: 'Please upload video editing works (max 3 files, each file no more than 50MB)'
      }
    ]
  }
}; 