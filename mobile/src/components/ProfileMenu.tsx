import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <TouchableOpacity style={styles.iconBtn} onPress={() => setOpen(true)}>
        <Ionicons name="person-circle-outline" size={32} color={colors.text} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setOpen(false);
                router.push('/(app)/account');
              }}
            >
              <Ionicons name="person-outline" size={20} color={colors.text} />
              <Text style={styles.menuText}>Your Account</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setOpen(false);
                router.push('/(app)/settings');
              }}
            >
              <Ionicons name="settings-outline" size={20} color={colors.text} />
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconBtn: { padding: 4 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 16,
  },
  menu: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 180,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuText: { color: colors.text, fontSize: 16 },
  divider: { height: 1, backgroundColor: colors.border },
});
