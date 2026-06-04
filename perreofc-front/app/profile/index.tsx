/**
 * Renders the index screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import {
  LogOut,
  User,
  Lock,
  Bell,
  FileText,
  Moon,
  Sun,
  ChevronRight,
  Trophy,
  Camera,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react-native';
import { ImagePickerSheet, PickedImage } from '../../src/components/ui/ImagePickerSheet';
import { meApi } from '../../src/services/api/modules/me';
import { uploadFile } from '../../src/services/api/modules/upload';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { useTheme } from '../../src/hooks/useTheme';
import { haptics } from '../../src/utils/haptics';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { useNotificationsStore } from '../../src/store/useNotificationsStore';
import { useRole } from '../../src/hooks/useRole';
import { typography } from '../../src/theme/typography';
import { brand } from '../../src/theme/colors';

// ── Role badge colors ─────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  aficionado:  brand.orange,
  jugador:     brand.blue,
  admin:       brand.green,
  superadmin:  '#8B5CF6',
};

const ROLE_LABELS: Record<string, string> = {
  aficionado:  'Aficionado',
  jugador:     'Jugador',
  admin:       'Admin',
  superadmin:  'Superadmin',
};

// ── Tappable avatar ───────────────────────────────────────────────────────────
function TappableAvatar({
  avatarUrl,
  initials,
  color,
  size = 80,
  onPress,
  uploading,
}: {
  avatarUrl?: string | null;
  initials: string;
  color: string;
  size?: number;
  onPress: () => void;
  uploading: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={{ position: 'relative' }}>
      {avatarUrl ? (
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          overflow: 'hidden',
          borderWidth: 2, borderColor: color,
        }}>
          <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} resizeMode="cover" />
        </View>
      ) : (
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: `${color}22`,
          borderWidth: 2, borderColor: color,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{
            fontFamily: 'BebasNeue_400Regular',
            fontSize: size * 0.38,
            color, letterSpacing: 1,
          }}>
            {initials}
          </Text>
        </View>
      )}
      <View style={{
        position: 'absolute', bottom: 0, right: 0,
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: color,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: 'white',
      }}>
        {uploading
          ? <ActivityIndicator size="small" color="#fff" />
          : <Camera size={12} color="#fff" />
        }
      </View>
    </TouchableOpacity>
  );
}

// ── Menu row ──────────────────────────────────────────────────────────────────
function MenuRow({
  icon,
  label,
  subtitle,
  onPress,
  danger,
  disabled,
  right,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  disabled?: boolean;
  right?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 14,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View style={{ width: 22, alignItems: 'center' }}>{icon}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{
          ...typography.body,
          color: danger ? '#EF4444' : colors.text,
          fontFamily: 'Inter_500Medium',
        }}>
          {label}
        </Text>
        {subtitle && (
          <Text style={{ ...typography.caption, color: colors.textMuted }}>
            {subtitle}
          </Text>
        )}
      </View>
      {right ?? (disabled ? null : <ChevronRight size={16} color={colors.textMuted} />)}
    </TouchableOpacity>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <Text style={{
      ...typography.label,
      color: colors.textMuted,
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 8,
    }}>
      {label}
    </Text>
  );
}

// ── Confirm logout modal ──────────────────────────────────────────────────────
function ConfirmLogoutModal({ visible, onCancel, onConfirm }: { visible: boolean; onCancel: () => void; onConfirm: () => void }) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 24,
          width: '100%',
          maxWidth: 340,
          gap: 16,
        }}>
          <Text style={{ ...typography.h3, color: colors.text }}>Cerrar sesión</Text>
          <Text style={{ ...typography.body, color: colors.textMuted, lineHeight: 22 }}>
            ¿Seguro que quieres cerrar sesión? Tendrás que volver a iniciar sesión para acceder a la app.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={onCancel}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
              activeOpacity={0.75}
            >
              <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_600SemiBold' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center' }}
              activeOpacity={0.75}
            >
              <Text style={{ ...typography.body, color: '#fff', fontFamily: 'Inter_600SemiBold' }}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { scheme, toggle } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { isAficionado, isSuperAdmin } = useRole();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarPick = async (images: PickedImage[]) => {
    const image = images[0];
    if (!image?.isLocal) return;
    setAvatarUploading(true);
    try {
      const { publicUrl } = await uploadFile('/upload/avatar', image.uri);
      const updated = await meApi.updateProfile({ avatarUrl: publicUrl });
      updateUser({ avatarUrl: updated.avatarUrl });
    } catch {
      // silent - user sees no change, can retry
    } finally {
      setAvatarUploading(false);
    }
  };

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const roleColor = ROLE_COLORS[user.role] ?? brand.orange;
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  const fullName = `${user.firstName} ${user.lastName}`;
  const isDark = scheme === 'dark';

  const handleLogout = async () => {
    haptics.medium();
    setShowLogoutModal(false);
    await logout();
    router.replace('/(auth)/login' as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 60 }}>
        {/* ── User card ── */}
        <MotiView
          from={{ opacity: 0, translateY: -8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350 }}
        >
        <View style={{
          alignItems: 'center',
          paddingVertical: 32,
          paddingHorizontal: 16,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: 12,
        }}>
          <TappableAvatar
            avatarUrl={user.avatarUrl}
            initials={initials}
            color={roleColor}
            size={80}
            onPress={() => setShowAvatarPicker(true)}
            uploading={avatarUploading}
          />

          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ ...typography.h2, color: colors.text }}>{fullName}</Text>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>@{user.username}</Text>
          </View>

          {/* Role + points row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ backgroundColor: `${roleColor}22`, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5 }}>
              <Text style={{ ...typography.label, color: roleColor, fontFamily: 'Inter_700Bold' }}>
                {ROLE_LABELS[user.role] ?? user.role}
              </Text>
            </View>
            {isAficionado && (
              <View style={{ backgroundColor: `${brand.orange}15`, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={{ fontSize: 14 }}>🍑</Text>
                <Text style={{ ...typography.label, color: brand.orange, fontFamily: 'Inter_700Bold' }}>
                  {user.points.toLocaleString('es-ES')} pts
                </Text>
              </View>
            )}
          </View>

          <Text style={{ ...typography.caption, color: colors.textMuted }}>{user.email}</Text>
        </View>
        </MotiView>

        {/* ── Cuenta ── */}
        <SectionHeader label="CUENTA" />
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          <MenuRow
            icon={<User size={18} color={colors.textMuted} />}
            label="Editar perfil"
            subtitle={!isAficionado ? 'Gestionado por el administrador del club' : undefined}
            disabled={!isAficionado}
            onPress={() => router.push('/profile/edit' as any)}
          />
          <MenuRow
            icon={<Lock size={18} color={colors.textMuted} />}
            label="Cambiar contraseña"
            onPress={() => router.push('/profile/password' as any)}
          />
          <MenuRow
            icon={<Bell size={18} color={colors.textMuted} />}
            label="Notificaciones"
            onPress={() => router.push('/profile/notifications' as any)}
            right={
              unreadCount > 0 ? (
                <View style={{
                  minWidth: 22, height: 22, borderRadius: 11,
                  backgroundColor: '#EF4444',
                  alignItems: 'center', justifyContent: 'center',
                  paddingHorizontal: 5,
                }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              ) : undefined
            }
          />
          <MenuRow
            icon={<SlidersHorizontal size={18} color={colors.textMuted} />}
            label="Preferencias de notificaciones"
            onPress={() => router.push('/profile/notif-preferences' as any)}
          />
        </View>

        {/* ── Preferencias ── */}
        <SectionHeader label="PREFERENCIAS" />
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          <MenuRow
            icon={isDark ? <Moon size={18} color={colors.textMuted} /> : <Sun size={18} color={colors.textMuted} />}
            label={isDark ? 'Modo oscuro' : 'Modo claro'}
            onPress={() => { haptics.light(); toggle(); }}
            right={
              <Switch
                value={isDark}
                onValueChange={() => { haptics.light(); toggle(); }}
                trackColor={{ false: colors.border, true: `${brand.orange}88` }}
                thumbColor={isDark ? brand.orange : colors.textMuted}
                ios_backgroundColor={colors.border}
              />
            }
          />
        </View>

        {/* ── Club ── */}
        {isAficionado && (
          <>
            <SectionHeader label="CLUB" />
            <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
              <MenuRow
                icon={<Trophy size={18} color={brand.orange} />}
                label="Top Fans"
                onPress={() => router.push('/leaderboard' as any)}
              />
            </View>
          </>
        )}

        {/* ── Legal ── */}
        <SectionHeader label="INFORMACIÓN" />
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          <MenuRow
            icon={<FileText size={18} color={colors.textMuted} />}
            label="Términos y condiciones"
            onPress={() => router.push('/profile/terms' as any)}
          />
        </View>

        {/* ── Sesión ── */}
        <SectionHeader label="SESIÓN" />
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          <MenuRow
            icon={<LogOut size={18} color="#EF4444" />}
            label="Cerrar sesión"
            danger
            onPress={() => setShowLogoutModal(true)}
            right={null}
          />
          {isAficionado && (
            <MenuRow
              icon={<Trash2 size={18} color="#EF4444" />}
              label="Eliminar cuenta"
              subtitle="Requiere confirmación por email"
              danger
              onPress={() => router.push('/profile/delete-account' as any)}
              right={null}
            />
          )}
        </View>

        {/* App version */}
        <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: 32 }}>
          Perreo FC · v1.0.0
        </Text>
      </ScrollView>

      <ImagePickerSheet
        visible={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        onPick={handleAvatarPick}
        title="Foto de perfil"
        allowsMultiple={false}
        galleryOnly
        cropToSquare
        warning="Si subes una foto inapropiada, tu cuenta será baneada."
      />

      <ConfirmLogoutModal
        visible={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </View>
  );
}
