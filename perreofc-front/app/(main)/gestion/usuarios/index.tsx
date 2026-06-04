/**
 * Renders the index screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Platform, Modal, KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { Search, UserPlus, ChevronLeft, ChevronRight, X, Eye, EyeOff, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../../../src/hooks/useTheme';
import { useRole } from '../../../../src/hooks/useRole';
import { api } from '../../../../src/services/api';
import { typography } from '../../../../src/theme/typography';
import { brand, state } from '../../../../src/theme/colors';
import { User, UserRole } from '../../../../src/types';
import { Avatar } from '../../../../src/components/ui/Avatar';
import { Button } from '../../../../src/components/ui/Button';

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
type CreatableRole = 'jugador' | 'admin' | 'superadmin';

const ALL_ROLE_FILTERS: Array<{ key: RoleFilter; label: string }> = [
  { key: 'todos',      label: 'Todos' },
  { key: 'aficionado', label: 'Aficionados' },
  { key: 'jugador',    label: 'Jugadores' },
  { key: 'admin',      label: 'Admins' },
];

// Roles que admin (no superadmin) puede ver/gestionar
const ADMIN_ALLOWED_ROLES: UserRole[] = ['jugador', 'admin'];

type UnlinkedPlayer = { id: number; fullName: string; firstName: string; lastName: string; photoUrl: string | null };

type CreateModalStep = 'role' | 'form';

// ── Modal de creación de usuario ──────────────────────────────────────────────

function CreateUserModal({
  visible,
  isSuperAdmin,
  onClose,
  onCreated,
}: {
  visible: boolean;
  isSuperAdmin: boolean;
  onClose: () => void;
  onCreated: (user: User, password: string) => void;
}) {
  const { colors } = useTheme();
  const [step, setStep] = useState<CreateModalStep>('role');
  const [selectedRole, setSelectedRole] = useState<CreatableRole | null>(null);

  // Jugador: lista de jugadores sin cuenta
  const [unlinkedPlayers, setUnlinkedPlayers] = useState<UnlinkedPlayer[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<UnlinkedPlayer | null>(null);

  // Campos del formulario
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('Perreofc@2026');
  const [showPassword, setShowPassword] = useState(false);

  // Estado
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creatableRoles: CreatableRole[] = isSuperAdmin
    ? ['jugador', 'admin', 'superadmin']
    : ['jugador', 'admin'];

  // Resetear al cerrar
  const resetAndClose = () => {
    setStep('role');
    setSelectedRole(null);
    setSelectedPlayer(null);
    setPlayerSearch('');
    setFirstName(''); setLastName(''); setUsername('');
    setEmail(''); setPassword('Perreofc@2026');
    setError(null);
    onClose();
  };

  const handleSelectRole = (role: CreatableRole) => {
    setSelectedRole(role);
    setError(null);
    if (role === 'jugador') {
      setLoadingPlayers(true);
      api.getUnlinkedPlayers()
        .then((players) => { setUnlinkedPlayers(players); setLoadingPlayers(false); })
        .catch(() => { setLoadingPlayers(false); });
    }
    setStep('form');
  };

  const handleSelectPlayer = (player: UnlinkedPlayer) => {
    setSelectedPlayer(player);
    setFirstName(player.firstName ?? '');
    setLastName(player.lastName ?? '');
    const generatedUsername = `${(player.firstName ?? '').toLowerCase()}_${(player.lastName ?? '').toLowerCase()}`
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    setUsername(generatedUsername);
    const normalize = (s: string) =>
      s.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    const first = normalize(player.firstName ?? '');
    const last  = normalize((player.lastName ?? '').split(' ')[0]);
    setEmail(`${first}.${last}@perreofc.com`);
    setError(null);
  };

  const filteredPlayers = unlinkedPlayers.filter((p) =>
    p.fullName.toLowerCase().includes(playerSearch.toLowerCase()),
  );

  const handleSubmit = async () => {
    if (!selectedRole) return;
    setError(null);

    if (selectedRole === 'jugador' && !selectedPlayer) {
      setError('Debes seleccionar un jugador de la lista');
      return;
    }
    if (!email.trim()) { setError('El email es obligatorio'); return; }
    if (!username.trim()) { setError('El username es obligatorio'); return; }
    if (!firstName.trim()) { setError('El nombre es obligatorio'); return; }
    if (!lastName.trim()) { setError('El apellido es obligatorio'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }

    setSubmitting(true);
    try {
      const payload: any = {
        role: selectedRole,
        email: email.trim(),
        password,
        username: username.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };
      if (selectedRole === 'jugador' && selectedPlayer) {
        payload.playerId = selectedPlayer.id;
      }
      const newUser = await api.createAdminUser(payload);
      onCreated(newUser as unknown as User, password);
      resetAndClose();
    } catch (err: any) {
      const msg = err?.data?.error ?? err?.message ?? 'Error al crear el usuario';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const roleColor = selectedRole ? ROLE_COLORS[selectedRole] : brand.orange;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <View style={{
          backgroundColor: colors.bgAlt,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          maxHeight: '90%',
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
            borderBottomWidth: 1, borderBottomColor: colors.border,
          }}>
            {step === 'form' && (
              <TouchableOpacity
                onPress={() => { setStep('role'); setSelectedRole(null); setSelectedPlayer(null); setError(null); }}
                style={{ padding: 4, marginRight: 8 }}
                activeOpacity={0.7}
              >
                <ChevronLeft size={22} color={colors.text} />
              </TouchableOpacity>
            )}
            <Text style={{ ...typography.h3, color: colors.text, flex: 1 }}>
              {step === 'role' ? 'Crear usuario' : `Nuevo ${selectedRole ? ROLE_LABELS[selectedRole] : ''}`}
            </Text>
            <TouchableOpacity onPress={resetAndClose} style={{ padding: 4 }} activeOpacity={0.7}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* ── PASO 1: seleccionar rol ─────────────────────────────────── */}
          {step === 'role' && (
            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
              <Text style={{ ...typography.body, color: colors.textMuted, marginBottom: 4 }}>
                Elige el tipo de cuenta que quieres crear:
              </Text>
              {creatableRoles.map((role) => {
                const rc = ROLE_COLORS[role];
                return (
                  <TouchableOpacity
                    key={role}
                    onPress={() => handleSelectRole(role)}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 14,
                      padding: 16, borderRadius: 14,
                      backgroundColor: colors.card,
                      borderWidth: 1.5, borderColor: colors.border,
                    }}
                  >
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: rc }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_600SemiBold' }}>
                        {ROLE_LABELS[role]}
                      </Text>
                      <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                        {role === 'jugador' && 'Se vincula a un jugador existente del equipo'}
                        {role === 'admin' && 'Acceso al panel de gestión'}
                        {role === 'superadmin' && 'Acceso total al sistema'}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* ── PASO 2: formulario ─────────────────────────────────────── */}
          {step === 'form' && (
            <ScrollView
              contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* JUGADOR: selector de jugador */}
              {selectedRole === 'jugador' && (
                <View style={{ gap: 10 }}>
                  <Text style={{ ...typography.label, color: colors.textMuted }}>JUGADOR</Text>

                  {/* Buscador */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    backgroundColor: colors.card,
                    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
                    paddingHorizontal: 10, height: 40,
                  }}>
                    <Search size={14} color={colors.textMuted} />
                    <TextInput
                      value={playerSearch}
                      onChangeText={setPlayerSearch}
                      placeholder="Buscar jugador..."
                      placeholderTextColor={colors.textMuted}
                      style={{
                        flex: 1, ...typography.body, color: colors.text, fontSize: 14,
                        ...(Platform.OS === 'web' ? { outline: 'none' } as any : {}),
                      }}
                    />
                  </View>

                  {/* Lista de jugadores */}
                  {loadingPlayers ? (
                    <ActivityIndicator color={colors.accent} style={{ marginVertical: 12 }} />
                  ) : (
                    <View style={{
                      borderRadius: 12, borderWidth: 1, borderColor: colors.border,
                      overflow: 'hidden', maxHeight: 200,
                    }}>
                      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                        {filteredPlayers.length === 0 ? (
                          <View style={{ padding: 16, alignItems: 'center' }}>
                            <Text style={{ ...typography.caption, color: colors.textMuted }}>
                              {playerSearch ? 'Sin resultados' : 'Todos los jugadores ya tienen cuenta'}
                            </Text>
                          </View>
                        ) : (
                          filteredPlayers.map((player, idx) => {
                            const isSelected = selectedPlayer?.id === player.id;
                            return (
                              <TouchableOpacity
                                key={player.id}
                                onPress={() => handleSelectPlayer(player)}
                                activeOpacity={0.75}
                                style={{
                                  flexDirection: 'row', alignItems: 'center', gap: 10,
                                  paddingHorizontal: 14, paddingVertical: 10,
                                  backgroundColor: isSelected ? `${brand.blue}18` : colors.card,
                                  borderBottomWidth: idx < filteredPlayers.length - 1 ? 1 : 0,
                                  borderBottomColor: colors.border,
                                }}
                              >
                                <View style={{
                                  width: 8, height: 8, borderRadius: 4,
                                  backgroundColor: isSelected ? brand.blue : colors.border,
                                }} />
                                <Text style={{
                                  ...typography.body, fontSize: 14,
                                  color: isSelected ? brand.blue : colors.text,
                                  fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                                  flex: 1,
                                }}>
                                  {player.fullName}
                                </Text>
                              </TouchableOpacity>
                            );
                          })
                        )}
                      </ScrollView>
                    </View>
                  )}

                  {selectedPlayer && (
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                      backgroundColor: `${brand.blue}12`,
                      borderRadius: 10, padding: 10,
                      borderWidth: 1, borderColor: `${brand.blue}44`,
                    }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: brand.blue }} />
                      <Text style={{ ...typography.caption, color: brand.blue, fontFamily: 'Inter_600SemiBold', flex: 1 }}>
                        Seleccionado: {selectedPlayer.fullName}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Campos comunes */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.label, color: colors.textMuted, marginBottom: 6 }}>NOMBRE</Text>
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Nombre"
                    placeholderTextColor={colors.textMuted}
                    editable={selectedRole !== 'jugador' || !selectedPlayer}
                    style={{
                      ...typography.body, fontSize: 14,
                      color: colors.text,
                      backgroundColor: (selectedRole === 'jugador' && selectedPlayer) ? colors.cardAlt : colors.card,
                      borderRadius: 10, borderWidth: 1, borderColor: colors.border,
                      paddingHorizontal: 12, paddingVertical: 10,
                      ...(Platform.OS === 'web' ? { outline: 'none' } as any : {}),
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.label, color: colors.textMuted, marginBottom: 6 }}>APELLIDO</Text>
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Apellido"
                    placeholderTextColor={colors.textMuted}
                    editable={selectedRole !== 'jugador' || !selectedPlayer}
                    style={{
                      ...typography.body, fontSize: 14,
                      color: colors.text,
                      backgroundColor: (selectedRole === 'jugador' && selectedPlayer) ? colors.cardAlt : colors.card,
                      borderRadius: 10, borderWidth: 1, borderColor: colors.border,
                      paddingHorizontal: 12, paddingVertical: 10,
                      ...(Platform.OS === 'web' ? { outline: 'none' } as any : {}),
                    }}
                  />
                </View>
              </View>

              <View>
                <Text style={{ ...typography.label, color: colors.textMuted, marginBottom: 6 }}>USERNAME</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="username_sin_espacios"
                  autoCapitalize="none"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    ...typography.body, fontSize: 14,
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
                    paddingHorizontal: 12, paddingVertical: 10,
                    ...(Platform.OS === 'web' ? { outline: 'none' } as any : {}),
                  }}
                />
              </View>

              <View>
                <Text style={{ ...typography.label, color: colors.textMuted, marginBottom: 6 }}>EMAIL</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="correo@ejemplo.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    ...typography.body, fontSize: 14,
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
                    paddingHorizontal: 12, paddingVertical: 10,
                    ...(Platform.OS === 'web' ? { outline: 'none' } as any : {}),
                  }}
                />
              </View>

              <View>
                <Text style={{ ...typography.label, color: colors.textMuted, marginBottom: 6 }}>CONTRASEÑA TEMPORAL</Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    placeholderTextColor={colors.textMuted}
                    style={{
                      ...typography.body, fontSize: 14,
                      color: colors.text,
                      backgroundColor: colors.card,
                      borderRadius: 10, borderWidth: 1, borderColor: colors.border,
                      paddingHorizontal: 12, paddingVertical: 10,
                      paddingRight: 44,
                      ...(Platform.OS === 'web' ? { outline: 'none' } as any : {}),
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' }}
                    activeOpacity={0.7}
                  >
                    {showPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
                  </TouchableOpacity>
                </View>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 4 }}>
                  El usuario deberá cambiar esta contraseña al iniciar sesión.
                </Text>
              </View>

              {/* Error */}
              {error && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  backgroundColor: `${state.error}12`,
                  borderRadius: 10, padding: 12,
                  borderWidth: 1, borderColor: `${state.error}44`,
                }}>
                  <AlertTriangle size={16} color={state.error} />
                  <Text style={{ ...typography.caption, color: state.error, flex: 1 }}>{error}</Text>
                </View>
              )}

              <Button
                label={submitting ? 'Creando...' : `Crear ${selectedRole ? ROLE_LABELS[selectedRole] : ''}`}
                variant="primary"
                fullWidth
                onPress={handleSubmit}
                disabled={submitting}
              />
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Modal de aviso de contraseña ──────────────────────────────────────────────

function PasswordReminderModal({
  visible,
  password,
  username,
  onClose,
}: {
  visible: boolean;
  password: string;
  username: string;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 32 }}>
        <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 24, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={22} color={brand.orange} />
            <Text style={{ ...typography.h3, color: colors.text, flex: 1 }}>Usuario creado</Text>
          </View>
          <Text style={{ ...typography.body, color: colors.textMuted, lineHeight: 22 }}>
            La cuenta <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>@{username}</Text> ha sido creada correctamente.
          </Text>
          <View style={{
            backgroundColor: `${brand.orange}12`,
            borderRadius: 12, padding: 14,
            borderWidth: 1, borderColor: `${brand.orange}44`,
            gap: 6,
          }}>
            <Text style={{ ...typography.label, color: brand.orange }}>⚠️ RECUERDA COMUNICAR AL USUARIO:</Text>
            <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_600SemiBold', marginTop: 2 }}>
              Contraseña temporal: {password}
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 4 }}>
              El usuario debe cambiar esta contraseña la primera vez que inicie sesión.
            </Text>
          </View>
          <Button label="Entendido" variant="primary" fullWidth onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────

export default function GestionUsuariosScreen() {
  const { colors } = useTheme();
  const { isSuperAdmin } = useRole();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('todos');

  // Modal crear usuario
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reminderVisible, setReminderVisible] = useState(false);
  const [reminderPassword, setReminderPassword] = useState('');
  const [reminderUsername, setReminderUsername] = useState('');

  // Filtros de rol visibles según rol del usuario actual
  const roleFilters = isSuperAdmin
    ? ALL_ROLE_FILTERS
    : ALL_ROLE_FILTERS.filter((f) => f.key === 'todos' || ADMIN_ALLOWED_ROLES.includes(f.key as UserRole));

  useFocusEffect(useCallback(() => {
    setLoading(true);
    api.getUsers().then((u) => { setUsers(u); setLoading(false); });
  }, []));

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

  const handleUserCreated = (newUser: User, password: string) => {
    setUsers((prev) => [newUser, ...prev]);
    setReminderPassword(password);
    setReminderUsername(newUser.username);
    setReminderVisible(true);
  };

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
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4, marginRight: 8 }}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ ...typography.h3, color: colors.text, flex: 1 }}>Usuarios</Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${brand.orange}18`, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
            activeOpacity={0.7}
            onPress={() => setShowCreateModal(true)}
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
                  onPress={() => router.push(`/(main)/gestion/usuarios/${user.id}` as any)}
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

      {/* Modal crear usuario */}
      <CreateUserModal
        visible={showCreateModal}
        isSuperAdmin={isSuperAdmin}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleUserCreated}
      />

      {/* Aviso contraseña temporal */}
      <PasswordReminderModal
        visible={reminderVisible}
        password={reminderPassword}
        username={reminderUsername}
        onClose={() => setReminderVisible(false)}
      />
    </View>
  );
}
