/**
 * 智能语言切换Hook
 * 根据用户输入内容自动检测语言并切换目标语言
 */

import { useCallback, useRef, useEffect } from 'react';
import { detectAndSuggestTarget } from '@/utils/languageDetector';
// import { toast } from '@/components/ui'; // 暂时注释，后续可能需要

export interface UseSmartLanguageSwitchOptions {
  /** 当前目标语言 */
  targetLanguage: string;
  /** 设置目标语言的函数 */  
  setTargetLanguage: (lang: string) => void;
  /** 是否启用智能切换 */
  enabled?: boolean;
  /** 检测延迟（毫秒），避免频繁检测 */
  debounceMs?: number;
  /** 最小文本长度才触发检测 */
  minTextLength?: number;
  /** 是否显示切换提示 */
  showToast?: boolean;
}

export interface UseSmartLanguageSwitchReturn {
  /** 处理文本输入变化 */
  handleTextChange: (text: string) => void;
  /** 最后一次检测结果 */
  lastDetection: {
    detectedLanguage: 'zh' | 'en' | 'other';
    confidence: number;
    suggestedTarget: string;
  } | null;
  /** 是否刚刚发生了语言切换 */
  justSwitched: boolean;
}

export function useSmartLanguageSwitch({
  targetLanguage,
  setTargetLanguage,
  enabled = true,
  debounceMs = 300,
  minTextLength = 1,
}: UseSmartLanguageSwitchOptions): UseSmartLanguageSwitchReturn {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDetectionRef = useRef<UseSmartLanguageSwitchReturn['lastDetection']>(null);
  const lastSwitchTextRef = useRef<string>(''); // 记录上次触发切换的文本，避免重复切换
  const justSwitchedRef = useRef<boolean>(false);

  const handleTextChange = useCallback((text: string) => {
    if (!enabled || !text || text.trim().length < minTextLength) {
      return;
    }

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 设置新的检测定时器
    timeoutRef.current = setTimeout(() => {
      const cleanText = text.trim();
      
      // 如果文本和上次触发切换的文本相同，跳过检测
      if (cleanText === lastSwitchTextRef.current) {
        return;
      }

      const result = detectAndSuggestTarget(cleanText, targetLanguage);
      lastDetectionRef.current = result;

      // 如果建议切换且置信度足够高
      if (result.shouldSwitch && result.confidence >= 0.3) {
        // 更新目标语言
        setTargetLanguage(result.suggestedTarget);
        
        // 记录这次切换的文本
        lastSwitchTextRef.current = cleanText;

        // 设置切换状态
        justSwitchedRef.current = true;
        
        // 2秒后重置切换状态
        setTimeout(() => {
          justSwitchedRef.current = false;
        }, 2000);

        // 暂时注释掉提示消息，后续可能需要时再启用
        // if (showToast) {
        //   const sourceLanguageName = getLanguageDisplayName(result.detectedLanguage);
        //   const targetLanguageName = getLanguageDisplayName(result.suggestedTarget);
        //   
        //   toast.success(`🧠 检测到${sourceLanguageName}，已自动设置翻译为${targetLanguageName}`);
        // }
      }
    }, debounceMs);
  }, [enabled, minTextLength, debounceMs, targetLanguage, setTargetLanguage]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    handleTextChange,
    lastDetection: lastDetectionRef.current,
    justSwitched: justSwitchedRef.current
  };
}

/**
 * 获取语言的显示名称
 * 暂时注释，后续可能需要时再启用
 */
// function getLanguageDisplayName(languageCode: string): string {
//   const languageNames: Record<string, string> = {
//     'zh': '中文',
//     'en': '英文',
//     'other': '其他语言'
//   };
//   
//   return languageNames[languageCode] || languageCode;
// } 