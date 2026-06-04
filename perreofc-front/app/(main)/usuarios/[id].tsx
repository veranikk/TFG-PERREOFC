/**
 * Renders the id screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, ShieldBan, ShieldCheck, Trash2, ChevronDown, User as UserIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '../../../src/utils/haptics';
import { useTheme } from '../../../src/hooks/useTheme';
import { api } from '../../../src/services/api';
import { Button } from '../../../src/components/ui/Button';
import { Avatar } from '../../../src/components/ui/Avatar';
import { typography } from '../../../src/theme/typography';
import { brand, state } from '../../../src/theme/colors';
import { User, UserRole } from '../../../src/types';

const ROLE_COLORS: Record<UserRole, string> = {
  aficionado: brand.orange,
  jugador:    brand.blue,
  admin:      brand.green,
  superadmin: '#8B5CF6',
};

const ROLE_LABELS: Record<UserRole, string> = {
  aficionado: 'Aficionado',
  jugador:    'Jugador',
  admin:      'Admin',
  superadmin: 'Superadmin',
};

const ALL_ROLES: UserRole[] = ['aficionado', 'jugador', 'admin', 'superadmin'];

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border,
    }}>
      <Text style={{ ...typography.body, color: colors.textMuted }}>{label}</Text>
      <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_500Medium', flex: 1, textAlign: 'right' }} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ConfirmModal({
  visible, title, message, confirmLabel, onCancel, onConfirm, destructive,
}: {
  visible: boolean; title: string; message: string; confirmLabel: string;
  onCancel: () => void; onConfirm: () => void; destructive?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 32 }}>
        <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 24, gap: 16 }}>
          <Text style={{ ...typography.h3, color: colors.text }}>{title}</Text>
          <Text style={{ ...typography.body, color: colors.textMuted, lineHeight: 22 }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Cancelar" variant="ghost" onPress={onCancel} style={{ flex: 1 }} />
            <Button label={confirmLabel} variant={destructive ? 'destructive' : 'primary'} onPress={onConfirm} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function UsuarioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    api.getUser(id).then((u) => { setUser(u); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!user || deleted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <UserIcon size={48} color={colors.textMuted} />
        <Text style={{ ...typography.body, color: colors.textMuted }}>Usuario no encontrado</Text>
        <Button label="Volver" variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  const roleColor = ROLE_COLORS[user.role];
  const joinedDate = (() => {
    try {
      return new Date(user.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch { return user.createdAt; }
  })();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: insets.top + 12, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ ...typography.h3, color: colors.text, flex: 1, marginLeft: 8 }} numberOfLines={1}>
          {user.firstName} {user.lastName}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Avatar card */}
        <View style={{
          alignItems: 'center', gap: 12,
          paddingVertical: 28, paddingHorizontal: 16,
          backgroundColor: colors.card,
          borderBottomWidth: 1, borderBottomColor: colors.border,
        }}>
          <Avatar
            uri={user.avatarUrl}
            name={`${user.firstName} ${user.lastName}`}
            size="lg"
            style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: roleColor }}
          />
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ ...typography.h2, color: colors.text }}>{user.firstName} {user.lastName}</Text>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>@{user.username}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <View style={{ backgroundColor: `${roleColor}22`, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5 }}>
              <Text style={{ ...typography.label, color: roleColor, fontFamily: 'Inter_700Bold' }}>
                {ROLE_LABELS[user.role]}
              </Text>
            </View>
            {user.banned && (
              <View style={{ backgroundColor: `${state.error}22`, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5 }}>
                <Text style={{ ...typography.label, color: state.error, fontFamily: 'Inter_700Bold' }}>BANEADO</Text>
              </View>
            )}
          </View>
        </View>

        {/* Info */}
        <Text style={{ ...typography.label, color: colors.textMuted, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>INFORMACIÓN</Text>
        <View style={{ backgroundColor: colors.card, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
          <InfoRow label="Email"      value={user.email} />
          <InfoRow label="ID"         value={user.id} />
          <InfoRow label="Se unió"    value={joinedDate} />
          {user.role === 'aficionado' && (
            <InfoRow label="Puntos" value={`${user.points.toLocaleString('es-ES')} 🍑`} />
          )}
        </View>

        {/* Cambiar rol */}
        <Text style={{ ...typography.label, color: colors.textMuted, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>ACCIONES</Text>
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {/* Role picker */}
          <TouchableOpacity
            onPress={() => setShowRolePicker(true)}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: colors.card,
              borderRadius: 14, padding: 16,
              borderWidth: 1, borderColor: colors.border,
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.label, color: colors.textMuted, marginBottom: 3 }}>ROL</Text>
              <Text style={{ ...typography.body, color: roleColor, fontFamily: 'Inter_600SemiBold' }}>
                {ROLE_LABELS[user.role]}
              </Text>
            </View>
            <ChevronDown size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Ban / Unban */}
          <TouchableOpacity
            onPress={() => setShowBanConfirm(true)}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: user.banned ? `${brand.green}12` : `${state.error}12`,
              borderRadius: 14, padding: 16,
              borderWidth: 1, borderColor: user.banned ? brand.green : state.error,
            }}
          >
            {user.banned
              ? <ShieldCheck size={20} color={brand.green} />
              : <ShieldBan size={20} color={state.error} />
            }
            <Text style={{ ...typography.body, color: user.banned ? brand.green : state.error, fontFamily: 'Inter_600SemiBold' }}>
              {user.banned ? 'Desbanear usuario' : 'Banear usuario'}
            </Text>
          </TouchableOpacity>

          {/* Eliminar cuenta */}
          <TouchableOpacity
            onPress={() => setShowDeleteConfirm(true)}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: `${state.error}12`,
              borderRadius: 14, padding: 16,
              borderWidth: 1, borderColor: `${state.error}44`,
            }}
          >
            <Trash2 size={20} color={state.error} />
            <Text style={{ ...typography.body, color: state.error, fontFamily: 'Inter_600SemiBold' }}>
              Eliminar cuenta
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Role picker modal */}
      <Modal visible={showRolePicker} transparent animationType="slide" onRequestClose={() => setShowRolePicker(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <View style={{ backgroundColor: colors.bgAlt, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 }}>
            <Text style={{ ...typography.h3, color: colors.text, marginBottom: 4 }}>Cambiar rol</Text>
            {ALL_ROLES.map((role) => {
              const rc = ROLE_COLORS[role];
              const isActive = user.role === role;
              return (
                <TouchableOpacity
                  key={role}
                  onPress={() => { setUser((u) => u ? { ...u, role } : u); setShowRolePicker(false); }}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 14,
                    padding: 14, borderRadius: 12,
                    backgroundColor: isActive ? `${rc}18` : colors.card,
                    borderWidth: 1.5, borderColor: isActive ? rc : colors.border,
                  }}
                >
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: rc }} />
                  <Text style={{ ...typography.body, color: isActive ? rc : colors.text, fontFamily: isActive ? 'Inter_700Bold' : 'Inter_400Regular', flex: 1 }}>
                    {ROLE_LABELS[role]}
                  </Text>
                  {isActive && <Text style={{ ...typography.caption, color: rc }}>Actual</Text>}
                </TouchableOpacity>
              );
            })}
            <Button label="Cancelar" variant="ghost" fullWidth onPress={() => setShowRolePicker(false)} />
          </View>
        </View>
      </Modal>

      {/* Ban confirm */}
      <ConfirmModal
        visible={showBanConfirm}
        title={user.banned ? '¿Desbanear usuario?' : '¿Banear usuario?'}
        message={user.banned
          ? `@${user.username} volverá a poder acceder a la app.`
          : `@${user.username} no podrá iniciar sesión hasta que sea desbaneado.`
        }
        confirmLabel={user.banned ? 'Desbanear' : 'Banear'}
        destructive={!user.banned}
        onCancel={() => setShowBanConfirm(false)}
        onConfirm={() => { haptics.warning(); setUser((u) => u ? { ...u, banned: !u.banned } : u); setShowBanConfirm(false); }}
      />

      {/* Delete confirm */}
      <ConfirmModal
        visible={showDeleteConfirm}
        title="¿Eliminar cuenta?"
        message={`La cuenta de @${user.username} será eliminada permanentemente. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => { haptics.error(); setShowDeleteConfirm(false); setDeleted(true); }}
      />
    </View>
  );
}
