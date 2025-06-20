/**
 * 文本处理工具函数
 */

/**
 * 截断文本到指定长度
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * 统计文本字符数（中文字符按1个字符计算）
 */
export const countCharacters = (text: string): number => {
  return text.length;
};

/**
 * 统计文本单词数
 */
export const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * 检查文本是否为空
 */
export const isEmpty = (text: string): boolean => {
  return !text || text.trim().length === 0;
};

/**
 * 清理文本（去除多余空格和换行）
 */
export const cleanText = (text: string): string => {
  return text
    .replace(/\s+/g, ' ') // 多个空格替换为单个空格
    .replace(/\n\s*\n/g, '\n') // 多个换行替换为单个换行
    .trim();
};

/**
 * 分割长文本为多个块
 */
export const splitTextIntoChunks = (text: string, maxChunkSize: number): string[] => {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  const paragraphs = text.split('\n');
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk ? '\n' : '') + paragraph;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = paragraph;
      } else {
        // 如果单个段落就超过了限制，需要进一步分割
        const sentences = paragraph.split(/[.!?]+/);
        for (const sentence of sentences) {
          if (sentence.trim()) {
            if (currentChunk.length + sentence.length + 1 <= maxChunkSize) {
              currentChunk += (currentChunk ? '.' : '') + sentence;
            } else {
              if (currentChunk) {
                chunks.push(currentChunk + '.');
              }
              currentChunk = sentence;
            }
          }
        }
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
};

/**
 * 检测文本主要语言（简单启发式）
 */
export const detectTextLanguage = (text: string): string => {
  const chineseChars = text.match(/[\u4e00-\u9fff]/g);
  const englishChars = text.match(/[a-zA-Z]/g);
  const japaneseChars = text.match(/[\u3040-\u309f\u30a0-\u30ff]/g);
  const koreanChars = text.match(/[\uac00-\ud7af]/g);

  const chineseCount = chineseChars ? chineseChars.length : 0;
  const englishCount = englishChars ? englishChars.length : 0;
  const japaneseCount = japaneseChars ? japaneseChars.length : 0;
  const koreanCount = koreanChars ? koreanChars.length : 0;

  const total = chineseCount + englishCount + japaneseCount + koreanCount;
  if (total === 0) return 'auto';

  if (chineseCount / total > 0.3) return 'zh';
  if (japaneseCount / total > 0.3) return 'ja';
  if (koreanCount / total > 0.3) return 'ko';
  if (englishCount / total > 0.5) return 'en';

  return 'auto';
}; 