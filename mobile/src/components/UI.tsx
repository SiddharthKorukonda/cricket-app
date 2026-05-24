import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';

export function ScreenHeader({
  label,
  title,
  right,
}: {
  label?: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          {label && <Text style={styles.headerLabel}>{label}</Text>}
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        {right}
      </View>
    </View>
  );
}

export function Input({
  label,
  error,
  ...props
}: TextInputProps & { label?: string; error?: string }) {
  return (
    <View style={styles.inputWrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.textDim}
        style={[styles.input, error && styles.inputError]}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, (disabled || loading) && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{title}</Text>}
    </TouchableOpacity>
  );
}

export function OutlineButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.outlineBtn} onPress={onPress}>
      <Text style={styles.outlineBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

export function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${(step / total) * 100}%` }]} />
    </View>
  );
}

export function Toggle({
  value,
  onToggle,
}: {
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.toggle, value && styles.toggleOn]}
      onPress={onToggle}
    >
      <View style={[styles.toggleKnob, value && styles.toggleKnobOn]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.header,
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  headerLabel: {
    color: colors.greenMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: '700' },
  inputWrap: { marginBottom: 16 },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  inputError: { borderColor: colors.red },
  error: { color: colors.red, fontSize: 12, marginTop: 4 },
  primaryBtn: {
    backgroundColor: colors.green,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  outlineBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
  },
  outlineBtnText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  chipTextSelected: { color: colors.text, fontWeight: '600' },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.bgInput,
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.green },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgInput,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: colors.green },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleKnobOn: { alignSelf: 'flex-end' },
});
