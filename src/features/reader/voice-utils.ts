import { Voice, VoiceQuality } from 'expo-speech';

import { VoicePreset } from '../../types/book';

export type VoiceMatchReason = 'unique' | 'approximate' | 'default';

export type VoiceMatchResult = {
  reason: VoiceMatchReason;
  score: number;
  voice: Voice | null;
};

const FEMALE_HINTS = ['female', 'woman', 'girl'];
const MALE_HINTS = ['male', 'man', 'boy'];
const MINIMUM_MATCH_SCORE = 8;

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeLocale(value: string) {
  return value.toLowerCase().replace(/_/g, '-').trim();
}

function getLocaleFamily(value: string) {
  return normalizeLocale(value).split('-')[0];
}

function stableHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }

  return hash;
}

function getVoiceHaystack(voice: Voice) {
  return normalizeText(`${voice.name} ${voice.identifier} ${voice.language}`);
}

function scoreVoice(voice: Voice, preset: VoicePreset) {
  const haystack = getVoiceHaystack(voice);
  const normalizedLanguage = normalizeLocale(voice.language);
  const primaryLocale = preset.localeHints[0];
  const normalizedPrimaryLocale = normalizeLocale(primaryLocale);
  const primaryFamily = getLocaleFamily(primaryLocale);
  const supportedFamilies = new Set(preset.localeHints.map(getLocaleFamily));
  let score = 0;

  for (const localeHint of preset.localeHints) {
    const normalizedHint = normalizeText(localeHint);
    const normalizedLocaleHint = normalizeLocale(localeHint);

    if (normalizedLanguage === normalizedLocaleHint) {
      score += localeHint === primaryLocale ? 28 : 18;
      break;
    }

    if (normalizedLanguage.startsWith(`${normalizedLocaleHint}-`)) {
      score += localeHint === primaryLocale ? 22 : 14;
      break;
    }

    if (normalizedHint && haystack.includes(normalizedHint)) {
      score += localeHint === primaryLocale ? 16 : 10;
      break;
    }
  }

  if (getLocaleFamily(normalizedLanguage) === primaryFamily) {
    score += 12;
  } else if (!supportedFamilies.has(getLocaleFamily(normalizedLanguage))) {
    score -= 18;
  }

  for (const keyword of preset.keywords) {
    const normalizedKeyword = normalizeText(keyword);

    if (!normalizedKeyword) {
      continue;
    }

    if (haystack.includes(normalizedKeyword)) {
      score += normalizedKeyword.includes(' ') ? 12 : 9;
    }
  }

  const genderHints = preset.gender === 'female' ? FEMALE_HINTS : MALE_HINTS;
  const oppositeGenderHints = preset.gender === 'female' ? MALE_HINTS : FEMALE_HINTS;

  if (genderHints.some((hint) => haystack.includes(hint))) {
    score += 8;
  }

  if (oppositeGenderHints.some((hint) => haystack.includes(hint))) {
    score -= 8;
  }

  for (const avoidKeyword of preset.avoidKeywords ?? []) {
    if (haystack.includes(normalizeText(avoidKeyword))) {
      score -= 10;
    }
  }

  if (voice.quality === VoiceQuality.Enhanced) {
    score += 4;
  }

  if (voice.quality === VoiceQuality.Default) {
    score += 1;
  }

  return score;
}

type RankedVoice = {
  score: number;
  tieBreaker: number;
  voice: Voice;
};

function rankVoicesForPreset(voices: Voice[], preset: VoicePreset) {
  return voices
    .map<RankedVoice>((voice) => ({
      score: scoreVoice(voice, preset),
      tieBreaker: stableHash(`${preset.id}:${voice.identifier}`),
      voice
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.tieBreaker !== left.tieBreaker) {
        return right.tieBreaker - left.tieBreaker;
      }

      return left.voice.identifier.localeCompare(right.voice.identifier);
    });
}

export function resolveVoiceAssignments(voices: Voice[], presets: VoicePreset[]) {
  const assignments: Record<string, VoiceMatchResult> = {};

  if (!voices.length) {
    return assignments;
  }

  const rankedByPreset = presets.map((preset) => ({
    candidates: rankVoicesForPreset(voices, preset),
    preset
  }));

  rankedByPreset.sort((left, right) => {
    const leftViable = left.candidates.filter((candidate) => candidate.score >= MINIMUM_MATCH_SCORE).length;
    const rightViable = right.candidates.filter(
      (candidate) => candidate.score >= MINIMUM_MATCH_SCORE
    ).length;

    if (leftViable !== rightViable) {
      return leftViable - rightViable;
    }

    return (right.candidates[0]?.score ?? 0) - (left.candidates[0]?.score ?? 0);
  });

  const usedVoiceIdentifiers = new Set<string>();

  for (const { preset, candidates } of rankedByPreset) {
    const preferredCandidate =
      candidates.find(
        (candidate) =>
          candidate.score >= MINIMUM_MATCH_SCORE && !usedVoiceIdentifiers.has(candidate.voice.identifier)
      ) ??
      candidates.find((candidate) => !usedVoiceIdentifiers.has(candidate.voice.identifier)) ??
      candidates[0];

    if (!preferredCandidate || preferredCandidate.score <= 0) {
      assignments[preset.id] = {
        reason: 'default',
        score: preferredCandidate?.score ?? 0,
        voice: null
      };
      continue;
    }

    const isUnique = !usedVoiceIdentifiers.has(preferredCandidate.voice.identifier);

    assignments[preset.id] = {
      reason:
        isUnique && preferredCandidate.score >= MINIMUM_MATCH_SCORE + 6 ? 'unique' : 'approximate',
      score: preferredCandidate.score,
      voice: preferredCandidate.voice
    };

    usedVoiceIdentifiers.add(preferredCandidate.voice.identifier);
  }

  return assignments;
}

export function resolveVoiceForPreset(voices: Voice[], preset: VoicePreset) {
  return resolveVoiceAssignments(voices, [preset])[preset.id]?.voice ?? null;
}
