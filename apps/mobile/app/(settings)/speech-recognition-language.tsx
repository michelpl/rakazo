import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text } from "react-native";
import { Checkmark } from "../../components/row-accessories";
import { SettingsGroup, SettingsRow } from "../../components/settings-group";
import { mobileTokens } from "../../lib/appearance";
import { listRecognitionLocales } from "../../lib/dictation";
import { useI18n } from "../../lib/i18n";
import { native, useThemedStyles } from "../../lib/native";
import { useSideInsets } from "../../lib/side-insets";
import {
  loadSpeechRecognitionLanguage,
  saveSpeechRecognitionLanguage,
  speechRecognitionLanguageLabel,
} from "../../lib/speech-recognition-language";
import { errorText } from "../../lib/user-error";

export default function SpeechRecognitionLanguage() {
  const sideInsets = useSideInsets();
  const { t, locale } = useI18n();
  const styles = useThemedStyles(createStyles);
  const [preference, setPreference] = useState<string | null>(null);
  const [locales, setLocales] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void Promise.all([loadSpeechRecognitionLanguage(), listRecognitionLocales()])
        .then(([saved, available]) => {
          if (!alive) return;
          setPreference(saved);
          setLocales(available);
        })
        .catch((err: unknown) => {
          if (!alive) return;
          setLocales([]);
          setError(errorText(err, t("Could not load voice settings")));
        });
      return () => {
        alive = false;
      };
    }, [t]),
  );

  function choose(tag: string | null) {
    if (saving) return;
    if ((tag ?? null) === preference) return;
    const previous = preference;
    setSaving(true);
    setError(null);
    setPreference(tag);
    void saveSpeechRecognitionLanguage(tag)
      .catch((err: unknown) => {
        setPreference(previous);
        setError(errorText(err, t("Could not save that preference")));
      })
      .finally(() => setSaving(false));
  }

  const systemSelected = preference === null;

  return (
    <ScrollView
      style={[styles.screen, sideInsets]}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      {locales === null ? <ActivityIndicator color={native.secondaryLabel} /> : null}
      <SettingsGroup accessibilityLabel={t("Voice recognition language")}>
        <SettingsRow
          accessibilityRole="button"
          accessibilityLabel={t("System default")}
          accessibilityState={{ selected: systemSelected, disabled: saving }}
          dimmed={saving}
          disabled={saving}
          onPress={() => choose(null)}
          title={t("System default")}
          trailing={systemSelected ? <Checkmark /> : null}
        />
        {(locales ?? []).map((tag) => {
          const selected = preference === tag;
          const label = speechRecognitionLanguageLabel(tag, locale);
          return (
            <SettingsRow
              key={tag}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected, disabled: saving }}
              dimmed={saving}
              disabled={saving}
              onPress={() => choose(tag)}
              title={label}
              value={tag}
              trailing={selected ? <Checkmark /> : null}
            />
          );
        })}
      </SettingsGroup>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </ScrollView>
  );
}

function createStyles() {
  const tokens = mobileTokens();
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: native.groupedPage },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 12 },
    error: {
      color: tokens.destructive,
      fontSize: 15,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
  });
}
