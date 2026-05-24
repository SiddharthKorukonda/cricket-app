import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Input, PrimaryButton } from '../../src/components/UI';
import { colors } from '../../src/theme/colors';
import { validatePasswordClient, validateUsernameClient } from '../../src/utils/helpers';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    const uErr = validateUsernameClient(username.trim());
    if (uErr) newErrors.username = uErr;
    const pErr = validatePasswordClient(password);
    if (pErr) newErrors.password = pErr;
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    setLoading(true);
    try {
      await register({ firstName, lastName, username, password, confirmPassword });
      router.replace('/(app)/(tabs)');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Registration failed';
      if (msg.includes('Username')) setErrors({ username: msg });
      else if (msg.includes('Password')) setErrors({ password: msg });
      else setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>CRICSCORE</Text>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Register as a player to track your stats</Text>

        {errors.general ? <Text style={styles.errorBanner}>{errors.general}</Text> : null}

        <Input label="FIRST NAME" value={firstName} onChangeText={setFirstName} placeholder="First name" error={errors.firstName} />
        <Input label="LAST NAME" value={lastName} onChangeText={setLastName} placeholder="Last name" error={errors.lastName} />
        <Input
          label="USERNAME"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholder="Choose a unique username"
          error={errors.username}
        />
        <Input
          label="PASSWORD"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Letters, numbers & symbols"
          error={errors.password}
        />
        <Input
          label="RE-ENTER PASSWORD"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="Confirm password"
          error={errors.confirmPassword}
        />

        <PrimaryButton title="Create account" onPress={handleRegister} loading={loading} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60, paddingBottom: 40 },
  brand: { color: colors.greenMuted, fontSize: 14, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  title: { color: colors.text, fontSize: 32, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: colors.textMuted, fontSize: 16, marginBottom: 24 },
  errorBanner: {
    backgroundColor: 'rgba(231,76,60,0.15)',
    color: colors.red,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: colors.textMuted },
  link: { color: colors.greenLight, fontWeight: '600' },
});
