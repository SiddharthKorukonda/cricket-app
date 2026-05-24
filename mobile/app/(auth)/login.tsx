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

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!username.trim() || !password) {
      setError('Please enter username and password');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password, rememberMe);
      router.replace('/(app)/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
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
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue scoring</Text>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        <Input
          label="USERNAME"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Enter username"
        />
        <Input
          label="PASSWORD"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Enter password"
        />

        <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxOn]}>
            {rememberMe && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.rememberText}>Remember me</Text>
        </TouchableOpacity>

        <PrimaryButton title="Sign in" onPress={handleLogin} loading={loading} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Register</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 80, justifyContent: 'center' },
  brand: {
    color: colors.greenMuted,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: { color: colors.text, fontSize: 32, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: colors.textMuted, fontSize: 16, marginBottom: 32 },
  errorBanner: {
    backgroundColor: 'rgba(231,76,60,0.15)',
    color: colors.red,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.green, borderColor: colors.green },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  rememberText: { color: colors.textMuted, fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: colors.textMuted },
  link: { color: colors.greenLight, fontWeight: '600' },
});
