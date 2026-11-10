import * as SecureStore from "expo-secure-store";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadSpeechRecognitionLanguage,
  resolveSpeechRecognitionLanguage,
  SYSTEM_SPEECH_RECOGNITION_LANGUAGE,
  saveSpeechRecognitionLanguage,
  speechRecognitionLanguageLabel,
} from "./speech-recognition-language";

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

describe("speech recognition language preference", () => {
  beforeEach(() => {
    vi.mocked(SecureStore.getItemAsync).mockReset();
    vi.mocked(SecureStore.setItemAsync).mockReset();
    vi.mocked(SecureStore.deleteItemAsync).mockReset();
  });

  it("treats a missing or system value as no preference", async () => {
    vi.mocked(SecureStore.getItemAsync).mockResolvedValueOnce(null);
    await expect(loadSpeechRecognitionLanguage()).resolves.toBeNull();

    vi.mocked(SecureStore.getItemAsync).mockResolvedValueOnce(SYSTEM_SPEECH_RECOGNITION_LANGUAGE);
    await expect(loadSpeechRecognitionLanguage()).resolves.toBeNull();
  });

  it("returns a stored BCP-47 tag", async () => {
    vi.mocked(SecureStore.getItemAsync).mockResolvedValueOnce("pt-BR");
    await expect(loadSpeechRecognitionLanguage()).resolves.toBe("pt-BR");
  });

  it("clears storage for system default and saves an explicit tag", async () => {
    await saveSpeechRecognitionLanguage(null);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledOnce();

    await saveSpeechRecognitionLanguage(SYSTEM_SPEECH_RECOGNITION_LANGUAGE);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);

    await saveSpeechRecognitionLanguage("pt-BR");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(expect.any(String), "pt-BR");
  });

  it("resolves system default from the UI and device languages", () => {
    expect(
      resolveSpeechRecognitionLanguage({
        preference: null,
        uiLocale: "en",
        deviceLanguage: "pt-BR",
      }),
    ).toBe("pt-BR");

    expect(
      resolveSpeechRecognitionLanguage({
        preference: null,
        uiLocale: "en",
        deviceLanguage: "en-US",
      }),
    ).toBe("en-US");
  });

  it("passes a saved preference through unchanged", () => {
    expect(
      resolveSpeechRecognitionLanguage({
        preference: "pt-BR",
        uiLocale: "en",
        deviceLanguage: "en-US",
      }),
    ).toBe("pt-BR");
  });

  it("labels a recognition locale for the UI language", () => {
    expect(speechRecognitionLanguageLabel("pt-BR", "en")).toMatch(/portuguese/i);
  });
});
