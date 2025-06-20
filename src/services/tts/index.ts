/**
 * TTS 服务统一导出
 */

export {
  getTTSService,
  initTTSService,
  speakText,
  stopSpeaking,
  isSpeaking,
} from './ttsService';

export type {
  TTSConfig,
  TTSRequest,
  TTSResponse,
} from './ttsService'; 