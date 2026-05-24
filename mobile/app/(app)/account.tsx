import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { ScreenHeader } from '../../src/components/UI';
import { colors } from '../../src/theme/colors';

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <ScreenHeader label="CRICSCORE" title="Your Account" />
      <ScrollView style={styles.body}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName[0]}
            {user?.lastName[0]}
          </Text>
        </View>
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.username}>@{user?.username}</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>First name</Text>
          <Text style={styles.cardValue}>{user?.firstName}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Last name</Text>
          <Text style={styles.cardValue}>{user?.lastName}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Username</Text>
          <Text style={styles.cardValue}>@{user?.username}</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, alignItems: 'center' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  avatarText: { color: colors.text, fontSize: 28, fontWeight: '700' },
  name: { color: colors.text, fontSize: 24, fontWeight: '700' },
  username: { color: colors.greenLight, fontSize: 14, marginBottom: 24 },
  card: {
    width: '100%',
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: { color: colors.textMuted, fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  cardValue: { color: colors.text, fontSize: 16 },
  logoutBtn: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  logoutText: { color: colors.red, fontWeight: '600' },
});
