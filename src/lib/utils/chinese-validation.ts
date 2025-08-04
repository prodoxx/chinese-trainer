/**
 * Utility functions for validating Traditional Chinese characters
 */

// Common simplified characters that should be rejected
const simplifiedCharacters = new Set([
  '爱', '国', '时', '会', '这', '来', '个', '们', '说', '为', '让', '过', '给', '还',
  '没', '对', '开', '见', '经', '头', '问', '现', '点', '让', '认', '关', '门', '闭',
  '问', '间', '闻', '买', '卖', '东', '车', '马', '鸟', '语', '读', '写', '话', '谈',
  '谢', '谁', '课', '费', '资', '贵', '货', '质', '购', '贸', '赛', '赢', '运', '远',
  '选', '边', '达', '迟', '递', '适', '迁', '邮', '邻', '郑', '释', '钟', '钱', '铁',
  '银', '错', '锦', '镇', '长', '队', '阵', '际', '陆', '阳', '阴', '陈', '险', '随',
  '难', '电', '题', '颜', '愿', '类', '饭', '饮', '馆', '饿', '驾', '骑', '验', '惊',
  '鱼', '鲁', '鸟', '鸡', '鸣', '鸭', '鹅', '鹰', '黄', '黑', '龙', '龟'
]);

// Unicode ranges for CJK characters
const CJK_UNIFIED_IDEOGRAPHS = /[\u4E00-\u9FFF]/;
const CJK_EXTENSION_A = /[\u3400-\u4DBF]/;
const CJK_EXTENSION_B = /[\u20000-\u2A6DF]/;
const CJK_COMPATIBILITY = /[\uF900-\uFAFF]/;

/**
 * Check if a character is a CJK character
 */
function isCJKCharacter(char: string): boolean {
  return CJK_UNIFIED_IDEOGRAPHS.test(char) ||
         CJK_EXTENSION_A.test(char) ||
         CJK_EXTENSION_B.test(char) ||
         CJK_COMPATIBILITY.test(char);
}

/**
 * Check if a character is likely simplified Chinese
 */
function isSimplifiedChinese(char: string): boolean {
  return simplifiedCharacters.has(char);
}

/**
 * Validate if a string contains only Traditional Chinese characters
 * @param text The text to validate
 * @returns Object with validation result and cleaned text
 */
export function validateTraditionalChinese(text: string): {
  isValid: boolean;
  cleanedText: string;
  errors: string[];
} {
  const errors: string[] = [];
  const cleanedChars: string[] = [];
  
  // Remove whitespace and convert to array of characters
  const chars = text.trim().split('');
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    
    // Check if it's a CJK character
    if (!isCJKCharacter(char)) {
      errors.push(`Character "${char}" at position ${i + 1} is not a Chinese character`);
      continue;
    }
    
    // Check if it's simplified Chinese
    if (isSimplifiedChinese(char)) {
      errors.push(`Character "${char}" at position ${i + 1} appears to be Simplified Chinese`);
      continue;
    }
    
    cleanedChars.push(char);
  }
  
  return {
    isValid: errors.length === 0 && cleanedChars.length > 0,
    cleanedText: cleanedChars.join(''),
    errors
  };
}

/**
 * Extract valid Traditional Chinese text from a string (used for imports)
 * This is more lenient - it extracts valid characters and ignores invalid ones
 * @param text The text to process
 * @returns The cleaned text containing only Traditional Chinese characters
 */
export function extractTraditionalChinese(text: string): string {
  const chars = text.trim().split('');
  const validChars: string[] = [];
  
  for (const char of chars) {
    // Keep only CJK characters that aren't simplified
    if (isCJKCharacter(char) && !isSimplifiedChinese(char)) {
      validChars.push(char);
    }
  }
  
  return validChars.join('');
}

/**
 * Check if text contains any non-Traditional Chinese characters
 * @param text The text to check
 * @returns true if the text contains only Traditional Chinese
 */
export function isTraditionalChineseOnly(text: string): boolean {
  if (!text.trim()) return false;
  
  const chars = text.trim().split('');
  return chars.every(char => isCJKCharacter(char) && !isSimplifiedChinese(char));
}