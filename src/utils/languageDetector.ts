/**
 * 语言检测工具
 * 用于分析文本内容并判断主要语言
 */

export interface LanguageDetectionResult {
  detectedLanguage: 'zh' | 'en' | 'other';
  confidence: number;
  chineseRatio: number;
  englishRatio: number;
  otherRatio: number;
}

/**
 * 检测文本的主要语言
 * @param text 要检测的文本
 * @returns 语言检测结果
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  if (!text || text.trim().length === 0) {
    return {
      detectedLanguage: 'other',
      confidence: 0,
      chineseRatio: 0,
      englishRatio: 0,
      otherRatio: 0
    };
  }

  const cleanText = text.trim();
  
  // 统计各类字符数量
  let chineseCount = 0;
  let englishCount = 0;
  let otherCount = 0;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const code = char.charCodeAt(0);
    
    // 中文字符范围（包括中日韩统一表意文字）
    if (
      (code >= 0x4e00 && code <= 0x9fff) ||    // CJK统一表意文字
      (code >= 0x3400 && code <= 0x4dbf) ||    // CJK扩展A
      (code >= 0x20000 && code <= 0x2a6df) ||  // CJK扩展B
      (code >= 0x2a700 && code <= 0x2b73f) ||  // CJK扩展C
      (code >= 0x2b740 && code <= 0x2b81f) ||  // CJK扩展D
      (code >= 0x3000 && code <= 0x303f) ||    // CJK符号和标点
      (code >= 0xff00 && code <= 0xffef)       // 全角ASCII
    ) {
      chineseCount++;
    }
    // 英文字符（字母）
    else if (
      (code >= 0x41 && code <= 0x5a) ||        // A-Z
      (code >= 0x61 && code <= 0x7a)           // a-z
    ) {
      englishCount++;
    }
    // 其他字符（数字、标点、空格等不参与语言判定）
    else if (
      code > 0x7f ||                           // 非ASCII字符
      (code >= 0x30 && code <= 0x39)           // 数字也算作内容
    ) {
      otherCount++;
    }
  }

  // 计算比例
  const contentLength = chineseCount + englishCount + otherCount;
  const chineseRatio = contentLength > 0 ? chineseCount / contentLength : 0;
  const englishRatio = contentLength > 0 ? englishCount / contentLength : 0;
  const otherRatio = contentLength > 0 ? otherCount / contentLength : 0;

  // 判断主要语言
  let detectedLanguage: 'zh' | 'en' | 'other' = 'other';
  let confidence = 0;

  // 如果中文字符占比超过30%，认为是中文
  if (chineseRatio >= 0.3) {
    detectedLanguage = 'zh';
    confidence = chineseRatio;
  }
  // 如果英文字符占比超过50%，且中文字符占比小于20%，认为是英文
  else if (englishRatio >= 0.5 && chineseRatio < 0.2) {
    detectedLanguage = 'en';
    confidence = englishRatio;
  }
  // 如果英文字符占比超过70%，认为是英文（即使有少量中文）
  else if (englishRatio >= 0.7) {
    detectedLanguage = 'en';
    confidence = englishRatio;
  }
  // 如果英文和中文都有一定占比，以占比高的为准
  else if (chineseRatio > 0.1 || englishRatio > 0.3) {
    if (chineseRatio > englishRatio) {
      detectedLanguage = 'zh';
      confidence = chineseRatio;
    } else {
      detectedLanguage = 'en';
      confidence = englishRatio;
    }
  }
  // 其他情况认为是其他语言
  else {
    detectedLanguage = 'other';
    confidence = Math.max(chineseRatio, englishRatio, otherRatio);
  }

  return {
    detectedLanguage,
    confidence,
    chineseRatio,
    englishRatio,
    otherRatio
  };
}

/**
 * 根据检测到的语言自动推荐目标语言
 * @param detectedLanguage 检测到的源语言
 * @returns 推荐的目标语言
 */
export function suggestTargetLanguage(
  detectedLanguage: 'zh' | 'en' | 'other'
): string {
  switch (detectedLanguage) {
    case 'zh':
      // 中文 → 英文
      return 'en';
    case 'en':
      // 英文 → 中文
      return 'zh';
    case 'other':
    default:
      // 其他语言 → 中文
      return 'zh';
  }
}

/**
 * 检测文本并获取推荐的目标语言
 * @param text 输入文本
 * @param currentTarget 当前目标语言
 * @returns 推荐的目标语言
 */
export function detectAndSuggestTarget(text: string, currentTarget?: string): {
  detectedLanguage: 'zh' | 'en' | 'other';
  suggestedTarget: string;
  confidence: number;
  shouldSwitch: boolean;
} {
  const detection = detectLanguage(text);
  const suggestedTarget = suggestTargetLanguage(detection.detectedLanguage);
  
  // 只有在置信度足够高且目标语言确实需要改变时才建议切换
  const shouldSwitch = detection.confidence >= 0.3 && suggestedTarget !== currentTarget;
  
  return {
    detectedLanguage: detection.detectedLanguage,
    suggestedTarget,
    confidence: detection.confidence,
    shouldSwitch
  };
} 