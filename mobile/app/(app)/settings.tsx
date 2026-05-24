import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenHeader, Toggle, Chip, SectionLabel } from '../../src/components/UI';
import { api, UserSettings } from '../../src/api/client';
import { colors } from '../../src/theme/colors';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<UserSettings>({
    autoRotateStrike: true,
    maidenOverAlert: true,
    confirmBeforeWicket: true,
    showWagonWheel: true,
    showRrrLive: true,
    autoExportPdf: false,
    defaultFormat: 'T20',
  });

  useEffect(() => {
    api.get<UserSettings>('/settings').then(setSettings).catch(() => {});
  }, []);

  const update = async (patch: Partial<UserSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      await api.patch('/settings', patch);
    } catch {
      /* revert on failure in production */
    }
  };

  const SettingRow = ({
    title,
    subtitle,
    value,
    onToggle,
  }: {
    title: string;
    subtitle: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      <Toggle value={value} onToggle={onToggle} />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader label="CRICSCORE" title="Preferences" />
      <ScrollView style={styles.body}>
        <SectionLabel title="SCORING" />
        <SettingRow
          title="Auto-rotate strike"
          subtitle="Swap on odd-run completions."
          value={settings.autoRotateStrike}
          onToggle={() => update({ autoRotateStrike: !settings.autoRotateStrike })}
        />
        <SettingRow
          title="Maiden over alert"
          subtitle="Notify when maiden bowled."
          value={settings.maidenOverAlert}
          onToggle={() => update({ maidenOverAlert: !settings.maidenOverAlert })}
        />
        <SettingRow
          title="Confirm before wicket"
          subtitle="Always show confirmation modal."
          value={settings.confirmBeforeWicket}
          onToggle={() => update({ confirmBeforeWicket: !settings.confirmBeforeWicket })}
        />

        <SectionLabel title="DISPLAY" />
        <SettingRow
          title="Show wagon wheel"
          subtitle="Per-ball zone tracking."
          value={settings.showWagonWheel}
          onToggle={() => update({ showWagonWheel: !settings.showWagonWheel })}
        />
        <SettingRow
          title="Show RRR live"
          subtitle="Required run rate in header."
          value={settings.showRrrLive}
          onToggle={() => update({ showRrrLive: !settings.showRrrLive })}
        />

        <SectionLabel title="EXPORT" />
        <SettingRow
          title="Auto-export to PDF"
          subtitle="On match completion."
          value={settings.autoExportPdf}
          onToggle={() => update({ autoExportPdf: !settings.autoExportPdf })}
        />

        <SectionLabel title="FORMAT DEFAULTS" />
        <View style={styles.chips}>
          {(['T20', 'ODI', 'Test'] as const).map((f) => (
            <Chip
              key={f}
              label={f}
              selected={settings.defaultFormat === f}
              onPress={() => update({ defaultFormat: f })}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1, marginRight: 12 },
  rowTitle: { color: colors.text, fontSize: 16 },
  rowSub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
});
