export interface Language {
  code: string;
  name: string;
  flag: string;
  category: string;
  englishName: string;
}

// 扩展的语言列表，按字母分类
export const allLanguages: Language[] = [
  // 常用语言
  { code: 'auto', name: '自动检测', flag: '🌍', category: 'common', englishName: 'Auto Detect' },
  { code: 'zh', name: '中文(简体)', flag: '🇨🇳', category: 'common', englishName: 'Chinese (Simplified)' },
  { code: 'en', name: '英语', flag: '🇺🇸', category: 'common', englishName: 'English' },
  { code: 'ja', name: '日语', flag: '🇯🇵', category: 'common', englishName: 'Japanese' },
  { code: 'ko', name: '韩语', flag: '🇰🇷', category: 'common', englishName: 'Korean' },
  { code: 'fr', name: '法语', flag: '🇫🇷', category: 'common', englishName: 'French' },
  { code: 'de', name: '德语', flag: '🇩🇪', category: 'common', englishName: 'German' },
  { code: 'es', name: '西班牙语', flag: '🇪🇸', category: 'common', englishName: 'Spanish' },
  { code: 'ru', name: '俄语', flag: '🇷🇺', category: 'common', englishName: 'Russian' },
  { code: 'pt', name: '葡萄牙语', flag: '🇵🇹', category: 'common', englishName: 'Portuguese' },
  { code: 'it', name: '意大利语', flag: '🇮🇹', category: 'common', englishName: 'Italian' },
  { code: 'ar', name: '阿拉伯语', flag: '🇸🇦', category: 'common', englishName: 'Arabic' },
  { code: 'th', name: '泰语', flag: '🇹🇭', category: 'common', englishName: 'Thai' },
  { code: 'vi', name: '越南语', flag: '🇻🇳', category: 'common', englishName: 'Vietnamese' },

  // A
  { code: 'af', name: '南非荷兰语', flag: '🇿🇦', category: 'A', englishName: 'Afrikaans' },
  { code: 'sq', name: '阿尔巴尼亚语', flag: '🇦🇱', category: 'A', englishName: 'Albanian' },
  { code: 'am', name: '阿姆哈拉语', flag: '🇪🇹', category: 'A', englishName: 'Amharic' },
  { code: 'hy', name: '亚美尼亚语', flag: '🇦🇲', category: 'A', englishName: 'Armenian' },
  { code: 'az', name: '阿塞拜疆语', flag: '🇦🇿', category: 'A', englishName: 'Azerbaijani' },
  { code: 'ast', name: '阿斯图里亚斯语', flag: '🇪🇸', category: 'A', englishName: 'Asturian' },

  // B
  { code: 'eu', name: '巴斯克语', flag: '🏴', category: 'B', englishName: 'Basque' },
  { code: 'be', name: '白俄罗斯语', flag: '🇧🇾', category: 'B', englishName: 'Belarusian' },
  { code: 'bn', name: '孟加拉语', flag: '🇧🇩', category: 'B', englishName: 'Bengali' },
  { code: 'bs', name: '波斯尼亚语', flag: '🇧🇦', category: 'B', englishName: 'Bosnian' },
  { code: 'bg', name: '保加利亚语', flag: '🇧🇬', category: 'B', englishName: 'Bulgarian' },
  { code: 'my', name: '缅甸语', flag: '🇲🇲', category: 'B', englishName: 'Burmese' },

  // C
  { code: 'ca', name: '加泰罗尼亚语', flag: '🏴', category: 'C', englishName: 'Catalan' },
  { code: 'ceb', name: '宿务语', flag: '🇵🇭', category: 'C', englishName: 'Cebuano' },
  { code: 'zh-tw', name: '中文(繁体)', flag: '🇹🇼', category: 'C', englishName: 'Chinese (Traditional)' },
  { code: 'co', name: '科西嘉语', flag: '🇫🇷', category: 'C', englishName: 'Corsican' },
  { code: 'hr', name: '克罗地亚语', flag: '🇭🇷', category: 'C', englishName: 'Croatian' },
  { code: 'cs', name: '捷克语', flag: '🇨🇿', category: 'C', englishName: 'Czech' },

  // D
  { code: 'da', name: '丹麦语', flag: '🇩🇰', category: 'D', englishName: 'Danish' },
  { code: 'nl', name: '荷兰语', flag: '🇳🇱', category: 'D', englishName: 'Dutch' },

  // E
  { code: 'eo', name: '世界语', flag: '🌍', category: 'E', englishName: 'Esperanto' },
  { code: 'et', name: '爱沙尼亚语', flag: '🇪🇪', category: 'E', englishName: 'Estonian' },

  // F
  { code: 'fi', name: '芬兰语', flag: '🇫🇮', category: 'F', englishName: 'Finnish' },
  { code: 'fy', name: '弗里西语', flag: '🇳🇱', category: 'F', englishName: 'Frisian' },

  // G
  { code: 'gl', name: '加利西亚语', flag: '🇪🇸', category: 'G', englishName: 'Galician' },
  { code: 'ka', name: '格鲁吉亚语', flag: '🇬🇪', category: 'G', englishName: 'Georgian' },
  { code: 'el', name: '希腊语', flag: '🇬🇷', category: 'G', englishName: 'Greek' },
  { code: 'gu', name: '古吉拉特语', flag: '🇮🇳', category: 'G', englishName: 'Gujarati' },

  // H
  { code: 'ht', name: '海地克里奥尔语', flag: '🇭🇹', category: 'H', englishName: 'Haitian Creole' },
  { code: 'ha', name: '豪萨语', flag: '🇳🇬', category: 'H', englishName: 'Hausa' },
  { code: 'haw', name: '夏威夷语', flag: '🇺🇸', category: 'H', englishName: 'Hawaiian' },
  { code: 'he', name: '希伯来语', flag: '🇮🇱', category: 'H', englishName: 'Hebrew' },
  { code: 'hi', name: '印地语', flag: '🇮🇳', category: 'H', englishName: 'Hindi' },
  { code: 'hmn', name: '苗语', flag: '🇨🇳', category: 'H', englishName: 'Hmong' },
  { code: 'hu', name: '匈牙利语', flag: '🇭🇺', category: 'H', englishName: 'Hungarian' },

  // I
  { code: 'is', name: '冰岛语', flag: '🇮🇸', category: 'I', englishName: 'Icelandic' },
  { code: 'ig', name: '伊博语', flag: '🇳🇬', category: 'I', englishName: 'Igbo' },
  { code: 'id', name: '印尼语', flag: '🇮🇩', category: 'I', englishName: 'Indonesian' },
  { code: 'ga', name: '爱尔兰语', flag: '🇮🇪', category: 'I', englishName: 'Irish' },

  // J
  { code: 'jw', name: '爪哇语', flag: '🇮🇩', category: 'J', englishName: 'Javanese' },

  // K
  { code: 'kn', name: '卡纳达语', flag: '🇮🇳', category: 'K', englishName: 'Kannada' },
  { code: 'kk', name: '哈萨克语', flag: '🇰🇿', category: 'K', englishName: 'Kazakh' },
  { code: 'km', name: '高棉语', flag: '🇰🇭', category: 'K', englishName: 'Khmer' },
  { code: 'rw', name: '卢旺达语', flag: '🇷🇼', category: 'K', englishName: 'Kinyarwanda' },
  { code: 'ky', name: '柯尔克孜语', flag: '🇰🇬', category: 'K', englishName: 'Kyrgyz' },

  // L
  { code: 'lo', name: '老挝语', flag: '🇱🇦', category: 'L', englishName: 'Lao' },
  { code: 'la', name: '拉丁语', flag: '🏛️', category: 'L', englishName: 'Latin' },
  { code: 'lv', name: '拉脱维亚语', flag: '🇱🇻', category: 'L', englishName: 'Latvian' },
  { code: 'lt', name: '立陶宛语', flag: '🇱🇹', category: 'L', englishName: 'Lithuanian' },
  { code: 'lb', name: '卢森堡语', flag: '🇱🇺', category: 'L', englishName: 'Luxembourgish' },

  // M
  { code: 'mk', name: '马其顿语', flag: '🇲🇰', category: 'M', englishName: 'Macedonian' },
  { code: 'mg', name: '马尔加什语', flag: '🇲🇬', category: 'M', englishName: 'Malagasy' },
  { code: 'ms', name: '马来语', flag: '🇲🇾', category: 'M', englishName: 'Malay' },
  { code: 'ml', name: '马拉雅拉姆语', flag: '🇮🇳', category: 'M', englishName: 'Malayalam' },
  { code: 'mt', name: '马耳他语', flag: '🇲🇹', category: 'M', englishName: 'Maltese' },
  { code: 'mi', name: '毛利语', flag: '🇳🇿', category: 'M', englishName: 'Maori' },
  { code: 'mr', name: '马拉地语', flag: '🇮🇳', category: 'M', englishName: 'Marathi' },
  { code: 'mn', name: '蒙古语', flag: '🇲🇳', category: 'M', englishName: 'Mongolian' },

  // N
  { code: 'ne', name: '尼泊尔语', flag: '🇳🇵', category: 'N', englishName: 'Nepali' },
  { code: 'no', name: '挪威语', flag: '🇳🇴', category: 'N', englishName: 'Norwegian' },
  { code: 'ny', name: '齐切瓦语', flag: '🇲🇼', category: 'N', englishName: 'Nyanja' },

  // O
  { code: 'or', name: '奥里亚语', flag: '🇮🇳', category: 'O', englishName: 'Odia' },

  // P
  { code: 'ps', name: '普什图语', flag: '🇦🇫', category: 'P', englishName: 'Pashto' },
  { code: 'fa', name: '波斯语', flag: '🇮🇷', category: 'P', englishName: 'Persian' },
  { code: 'pl', name: '波兰语', flag: '🇵🇱', category: 'P', englishName: 'Polish' },
  { code: 'pa', name: '旁遮普语', flag: '🇮🇳', category: 'P', englishName: 'Punjabi' },

  // Q
  { code: 'qu', name: '克丘亚语', flag: '🇵🇪', category: 'Q', englishName: 'Quechua' },

  // R
  { code: 'ro', name: '罗马尼亚语', flag: '🇷🇴', category: 'R', englishName: 'Romanian' },

  // S
  { code: 'sm', name: '萨摩亚语', flag: '🇼🇸', category: 'S', englishName: 'Samoan' },
  { code: 'gd', name: '苏格兰盖尔语', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', category: 'S', englishName: 'Scots Gaelic' },
  { code: 'sr', name: '塞尔维亚语', flag: '🇷🇸', category: 'S', englishName: 'Serbian' },
  { code: 'st', name: '塞索托语', flag: '🇱🇸', category: 'S', englishName: 'Sesotho' },
  { code: 'sn', name: '修纳语', flag: '🇿🇼', category: 'S', englishName: 'Shona' },
  { code: 'sd', name: '信德语', flag: '🇵🇰', category: 'S', englishName: 'Sindhi' },
  { code: 'si', name: '僧伽罗语', flag: '🇱🇰', category: 'S', englishName: 'Sinhala' },
  { code: 'sk', name: '斯洛伐克语', flag: '🇸🇰', category: 'S', englishName: 'Slovak' },
  { code: 'sl', name: '斯洛文尼亚语', flag: '🇸🇮', category: 'S', englishName: 'Slovenian' },
  { code: 'so', name: '索马里语', flag: '🇸🇴', category: 'S', englishName: 'Somali' },
  { code: 'su', name: '巽他语', flag: '🇮🇩', category: 'S', englishName: 'Sundanese' },
  { code: 'sw', name: '斯瓦希里语', flag: '🇰🇪', category: 'S', englishName: 'Swahili' },
  { code: 'sv', name: '瑞典语', flag: '🇸🇪', category: 'S', englishName: 'Swedish' },

  // T
  { code: 'tl', name: '菲律宾语', flag: '🇵🇭', category: 'T', englishName: 'Tagalog' },
  { code: 'tg', name: '塔吉克语', flag: '🇹🇯', category: 'T', englishName: 'Tajik' },
  { code: 'ta', name: '泰米尔语', flag: '🇮🇳', category: 'T', englishName: 'Tamil' },
  { code: 'tt', name: '鞑靼语', flag: '🇷🇺', category: 'T', englishName: 'Tatar' },
  { code: 'te', name: '泰卢固语', flag: '🇮🇳', category: 'T', englishName: 'Telugu' },
  { code: 'tr', name: '土耳其语', flag: '🇹🇷', category: 'T', englishName: 'Turkish' },
  { code: 'tk', name: '土库曼语', flag: '🇹🇲', category: 'T', englishName: 'Turkmen' },

  // U
  { code: 'uk', name: '乌克兰语', flag: '🇺🇦', category: 'U', englishName: 'Ukrainian' },
  { code: 'ur', name: '乌尔都语', flag: '🇵🇰', category: 'U', englishName: 'Urdu' },
  { code: 'ug', name: '维吾尔语', flag: '🇨🇳', category: 'U', englishName: 'Uyghur' },
  { code: 'uz', name: '乌兹别克语', flag: '🇺🇿', category: 'U', englishName: 'Uzbek' },

  // V
  { code: 'vi', name: '越南语', flag: '🇻🇳', category: 'V', englishName: 'Vietnamese' },

  // W
  { code: 'cy', name: '威尔士语', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', category: 'W', englishName: 'Welsh' },

  // X
  { code: 'xh', name: '科萨语', flag: '🇿🇦', category: 'X', englishName: 'Xhosa' },

  // Y
  { code: 'yi', name: '意第绪语', flag: '🏴', category: 'Y', englishName: 'Yiddish' },
  { code: 'yo', name: '约鲁巴语', flag: '🇳🇬', category: 'Y', englishName: 'Yoruba' },

  // Z
  { code: 'zu', name: '祖鲁语', flag: '🇿🇦', category: 'Z', englishName: 'Zulu' },
];

// 按类别分组
export const getLanguagesByCategory = () => {
  const categories: { [key: string]: Language[] } = {};
  
  allLanguages.forEach(lang => {
    if (!categories[lang.category]) {
      categories[lang.category] = [];
    }
    categories[lang.category].push(lang);
  });
  
  return categories;
};

// 获取字母分类的顺序
export const alphabetOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

// 语言代码到语言名称的映射函数
export const getAdvancedLanguageName = (code: string): string => {
  const language = allLanguages.find(lang => lang.code === code);
  return language ? language.name : code;
}; 