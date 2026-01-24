// 国家数据定义
export interface Country {
  code: string;      // 国家代码（如 CN, US, JP）
  name: string;      // 中文名称
  nameEn: string;    // 英文名称
}

// 常用国家列表（主要面向东南亚和中国市场）
export const countries: Country[] = [
  { code: 'US', name: '美国', nameEn: 'United States' },
  { code: 'CN', name: '中国', nameEn: 'China' },
  { code: 'SG', name: '新加坡', nameEn: 'Singapore' },
  { code: 'MY', name: '马来西亚', nameEn: 'Malaysia' },
  { code: 'TH', name: '泰国', nameEn: 'Thailand' },
  { code: 'VN', name: '越南', nameEn: 'Vietnam' },
  { code: 'PH', name: '菲律宾', nameEn: 'Philippines' },
  { code: 'ID', name: '印度尼西亚', nameEn: 'Indonesia' },
  { code: 'HK', name: '香港', nameEn: 'Hong Kong' },
  { code: 'TW', name: '台湾', nameEn: 'Taiwan (China)' },
  { code: 'CA', name: '加拿大', nameEn: 'Canada' },
  { code: 'GB', name: '英国', nameEn: 'United Kingdom' },
  { code: 'AU', name: '澳大利亚', nameEn: 'Australia' },
  { code: 'NZ', name: '新西兰', nameEn: 'New Zealand' },
  { code: 'JP', name: '日本', nameEn: 'Japan' },
  { code: 'KR', name: '韩国', nameEn: 'South Korea' },
  { code: 'IN', name: '印度', nameEn: 'India' },
  { code: 'OTHER', name: '其他', nameEn: 'Other' },
];

// 获取国家名称的辅助函数
export const getCountryName = (code: string): string => {
  const country = countries.find(c => c.code === code);
  return country ? country.name : code;
};

// 获取国家英文名称的辅助函数
export const getCountryNameEn = (code: string): string => {
  const country = countries.find(c => c.code === code);
  return country ? country.nameEn : code;
};

// 根据名称搜索国家
export const searchCountries = (query: string): Country[] => {
  if (!query.trim()) return countries;
  
  const lowerQuery = query.toLowerCase();
  return countries.filter(country => 
    country.name.toLowerCase().includes(lowerQuery) ||
    country.nameEn.toLowerCase().includes(lowerQuery) ||
    country.code.toLowerCase().includes(lowerQuery)
  );
};
