import type { SpeechLocale } from "@rakazo/core";
import { recognitionLocaleTag } from "@rakazo/core";
import * as SecureStore from "expo-secure-store";

export const SPEECH_RECOGNITION_LANGUAGE_KEY = "rakazo.speech-recognition-language";

/** Stored value meaning follow the UI and device languages (today's behaviour). */
export const SYSTEM_SPEECH_RECOGNITION_LANGUAGE = "system";

/**
 * The saved recognition language, or `null` for system default.
 * An explicit BCP-47 tag is returned as stored.
 */
export async function loadSpeechRecognitionLanguage(): Promise<string | null> {
  const stored = await SecureStore.getItemAsync(SPEECH_RECOGNITION_LANGUAGE_KEY);
  if (!stored || stored === SYSTEM_SPEECH_RECOGNITION_LANGUAGE) return null;
  return stored;
}

/** Persist a BCP-47 tag, or clear the preference for system default. */
export async function saveSpeechRecognitionLanguage(tag: string | null): Promise<void> {
  if (!tag || tag === SYSTEM_SPEECH_RECOGNITION_LANGUAGE) {
    await SecureStore.deleteItemAsync(SPEECH_RECOGNITION_LANGUAGE_KEY);
    return;
  }
  await SecureStore.setItemAsync(SPEECH_RECOGNITION_LANGUAGE_KEY, tag);
}

/**
 * Tag passed to the on-device recognizer.
 * A saved preference wins; otherwise the UI locale and device language decide, as before.
 */
export function resolveSpeechRecognitionLanguage(options: {
  preference: string | null;
  uiLocale: SpeechLocale;
  deviceLanguage: string | null;
}): string {
  if (options.preference) return options.preference;
  return recognitionLocaleTag(options.uiLocale, options.deviceLanguage);
}

/** Human-readable label for a recognition locale tag in the current UI language. */
export function speechRecognitionLanguageLabel(tag: string, uiLocale: string): string {
  try {
    const names = new Intl.DisplayNames([uiLocale], { type: "language" });
    return names.of(tag) ?? tag;
  } catch {
    return tag;
  }
}
