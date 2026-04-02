import { CloudNarrationTarget } from '../../data/voicePresets';

type ElevenLabsSuccess = {
  audioUrl: string;
  ok: true;
  providerLabel: string;
};

type ElevenLabsFailureReason =
  | 'missing-config'
  | 'request-failed'
  | 'unsupported-platform';

type ElevenLabsFailure = {
  detail: string;
  ok: false;
  providerLabel: string;
  reason: ElevenLabsFailureReason;
};

export type ElevenLabsSynthesisResult = ElevenLabsSuccess | ElevenLabsFailure;

type SynthesizeNarrationInput = {
  target: CloudNarrationTarget;
  text: string;
};

const ELEVENLABS_API_BASE_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

function getElevenLabsApiKey() {
  return process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY?.trim() ?? '';
}

function supportsGeneratedAudioPlayback() {
  return (
    typeof globalThis.Audio === 'function' &&
    typeof Blob !== 'undefined' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function'
  );
}

export async function synthesizeNarrationWithElevenLabs({
  target,
  text
}: SynthesizeNarrationInput): Promise<ElevenLabsSynthesisResult> {
  const apiKey = getElevenLabsApiKey();

  if (!apiKey) {
    return {
      detail: '未检测到 EXPO_PUBLIC_ELEVENLABS_API_KEY，已回退本地朗读',
      ok: false,
      providerLabel: target.label,
      reason: 'missing-config'
    };
  }

  if (!supportsGeneratedAudioPlayback()) {
    return {
      detail: '当前运行环境不支持直接播放云端生成音频，已回退本地朗读',
      ok: false,
      providerLabel: target.label,
      reason: 'unsupported-platform'
    };
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_BASE_URL}/${target.voiceId}`, {
      body: JSON.stringify({
        model_id: target.modelId,
        text,
        voice_settings: {
          similarity_boost: 0.72,
          stability: 0.42,
          style: 0.18,
          use_speaker_boost: true
        }
      }),
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      method: 'POST'
    });

    if (!response.ok) {
      return {
        detail: `ElevenLabs 请求失败（${response.status}）`,
        ok: false,
        providerLabel: target.label,
        reason: 'request-failed'
      };
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

    return {
      audioUrl: URL.createObjectURL(audioBlob),
      ok: true,
      providerLabel: target.label
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : '网络请求异常';

    return {
      detail: `ElevenLabs 请求异常：${detail}`,
      ok: false,
      providerLabel: target.label,
      reason: 'request-failed'
    };
  }
}
