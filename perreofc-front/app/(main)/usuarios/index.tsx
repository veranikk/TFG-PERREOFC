/**
 * Renders the index screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Search, UserPlus, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '../../../src/hooks/useTheme';
import { useRole } from '../../../src/hooks/useRole';
import { api } from '../../../src/services/api';
import { typography } from '../../../src/theme/typography';
import { brand, state } from '../../../src/theme/colors';
import { User, UserRole } from '../../../src/types';
import { Avatar } from '../../../src/components/ui/Avatar';

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

type RoleFilter = 'todos' | UserRole;

const ALL_ROLE_FILTERS: Array<{ key: RoleFilter; label: string }> = [
  { key: 'todos',      label: 'Todos' },
  { key: 'aficionado', label: 'Aficionados' },
  { key: 'jugador',    label: 'Jugadores' },
  { key: 'admin',      label: 'Admins' },
];

// Roles que admin (no superadmin) puede ver/gestionar
const ADMIN_ALLOWED_ROLES: UserRole[] = ['jugador', 'admin'];


export default function UsuariosScreen() {
  const { colors } = useTheme();
  const { isSuperAdmin } = useRole();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('todos');

  // Filtros de rol visibles según rol del usuario actual
  const roleFilters = isSuperAdmin
    ? ALL_ROLE_FILTERS
    : ALL_ROLE_FILTERS.filter((f) => f.key === 'todos' || ADMIN_ALLOWED_ROLES.includes(f.key as UserRole));

  useEffect(() => {
    api.getUsers().then((u) => { setUsers(u); setLoading(false); });
  }, []);

  const filtered = users.filter((u) => {
    // Admin solo ve jugadores y admins
    if (!isSuperAdmin && !ADMIN_ALLOWED_ROLES.includes(u.role)) return false;
    const matchesRole = roleFilter === 'todos' || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q
      || u.username.toLowerCase().includes(q)
      || u.firstName.toLowerCase().includes(q)
      || u.lastName.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 16,
        paddingTop: 12, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        gap: 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ ...typography.h3, color: colors.text, flex: 1 }}>Usuarios</Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${brand.orange}18`, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
            activeOpacity={0.7}
          >
            <UserPlus size={14} color={brand.orange} />
            <Text style={{ ...typography.caption, color: brand.orange, fontFamily: 'Inter_600SemiBold' }}>Crear</Text>
          </TouchableOpacity>
        </View>

        {/* Buscador */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: colors.cardAlt,
          borderRadius: 12, borderWidth: 1, borderColor: colors.border,
          paddingHorizontal: 12, height: 42,
        }}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre, email o @"
            placeholderTextColor={colors.textMuted}
            style={{
              flex: 1,
              ...typography.body,
              color: colors.text,
              fontSize: 14,
              ...(Platform.OS === 'web' ? { outline: 'none' } as any : {}),
            }}
          />
        </View>

        {/* Filtros de rol */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {roleFilters.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setRoleFilter(key)}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 14, paddingVertical: 6,
                borderRadius: 9999,
                backgroundColor: roleFilter === key ? colors.accent : colors.card,
                borderWidth: 1,
                borderColor: roleFilter === key ? colors.accent : colors.border,
              }}
            >
              <Text style={{
                ...typography.caption,
                color: roleFilter === key ? '#fff' : colors.textMuted,
                fontFamily: 'Inter_600SemiBold',
              }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={{ ...typography.caption, color: colors.textMuted, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
            {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
          </Text>

          {filtered.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 48, gap: 10 }}>
              <Search size={40} color={colors.textMuted} />
              <Text style={{ ...typography.body, color: colors.textMuted }}>Sin resultados</Text>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>
                Prueba con otro nombre o cambia el filtro
              </Text>
            </View>
          )}

          <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            {filtered.map((user) => {
              const roleColor = ROLE_COLORS[user.role];
              return (
                <TouchableOpacity
                  key={user.id}
                  onPress={() => router.push(`/(main)/usuarios/${user.id}` as any)}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 16, paddingVertical: 12,
                    backgroundColor: colors.card,
                    borderBottomWidth: 1, borderBottomColor: colors.border,
                    gap: 12,
                  }}
                >
                  <Avatar
                    uri={user.avatarUrl}
                    name={`${user.firstName} ${user.lastName}`}
                    size="sm"
                    style={{ borderWidth: 1.5, borderColor: ROLE_COLORS[user.role] }}
                  />
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_600SemiBold' }}>
                        {user.firstName} {user.lastName}
                      </Text>
                      {user.banned && (
                        <View style={{ backgroundColor: `${state.error}22`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                          <Text style={{ ...typography.label, color: state.error, fontSize: 10 }}>BANEADO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>@{user.username} · {user.email}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <View style={{ backgroundColor: `${roleColor}22`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ ...typography.label, color: roleColor, fontFamily: 'Inter_700Bold', fontSize: 10 }}>
                        {ROLE_LABELS[user.role]}
                      </Text>
                    </View>
                    {user.role === 'aficionado' && (
                      <Text style={{ ...typography.caption, color: colors.textMuted, fontSize: 11 }}>
                        {user.points} 🍑
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
