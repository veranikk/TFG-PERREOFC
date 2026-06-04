/**
 * Renders the leaderboard screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Pencil, Search, Plus, Minus, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../../src/hooks/useTheme';
import { haptics } from '../../../src/utils/haptics';
import { Button } from '../../../src/components/ui/Button';
import { typography } from '../../../src/theme/typography';
import { brand } from '../../../src/theme/colors';
import { api } from '../../../src/services/api';

type Entry = {
  userId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  points: number;
};

function AdjustModal({
  entry,
  onClose,
  onSave,
}: {
  entry: Entry;
  onClose: () => void;
  onSave: (userId: string, delta: number) => Promise<void>;
}) {
  const { colors } = useTheme();
  const [amount, setAmount] = useState('0');
  const [mode, setMode] = useState<'add' | 'subtract'>('add');
  const [loading, setLoading] = useState(false);

  const parsedAmount = parseInt(amount) || 0;
  const delta = mode === 'add' ? parsedAmount : -parsedAmount;
  const resultPoints = Math.max(0, entry.points + delta);

  const handleApply = async () => {
    if (parsedAmount === 0) return;
    setLoading(true);
    await onSave(entry.userId, delta);
    setLoading(false);
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 32 }}>
        <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 24, gap: 16 }}>
          <Text style={{ ...typography.h3, color: colors.text }}>Ajustar puntos</Text>
          <Text style={{ ...typography.body, color: colors.textMuted }}>
            @{entry.username} · {entry.points.toLocaleString('es-ES')} 🍑 actuales
          </Text>

          {/* Toggle añadir / quitar */}
          <View style={{ flexDirection: 'row', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
            <TouchableOpacity
              onPress={() => setMode('add')}
              activeOpacity={0.7}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 6, paddingVertical: 10,
                backgroundColor: mode === 'add' ? `${brand.green}22` : 'transparent',
              }}
            >
              <Plus size={14} color={mode === 'add' ? brand.green : colors.textMuted} />
              <Text style={{ ...typography.label, color: mode === 'add' ? brand.green : colors.textMuted, fontFamily: 'Inter_600SemiBold' }}>
                Añadir
              </Text>
            </TouchableOpacity>
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <TouchableOpacity
              onPress={() => setMode('subtract')}
              activeOpacity={0.7}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 6, paddingVertical: 10,
                backgroundColor: mode === 'subtract' ? '#ff444422' : 'transparent',
              }}
            >
              <Minus size={14} color={mode === 'subtract' ? '#ff4444' : colors.textMuted} />
              <Text style={{ ...typography.label, color: mode === 'subtract' ? '#ff4444' : colors.textMuted, fontFamily: 'Inter_600SemiBold' }}>
                Quitar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input cantidad */}
          <View>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: 6 }}>
              Cantidad de puntos
            </Text>
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.text,
                fontFamily: 'Inter_400Regular',
                fontSize: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              placeholderTextColor={colors.textMuted}
              placeholder="0"
            />
          </View>

          <Text style={{ ...typography.caption, color: colors.textMuted }}>
            Resultado:{' '}
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>
              {resultPoints.toLocaleString('es-ES')} 🍑
            </Text>
          </Text>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Cancelar" variant="ghost" onPress={onClose} style={{ flex: 1 }} disabled={loading} />
            <Button
              label={loading ? 'Aplicando…' : 'Aplicar'}
              onPress={handleApply}
              style={{ flex: 1 }}
              disabled={loading || parsedAmount === 0}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function GestionLeaderboardScreen() {
  const { colors } = useTheme();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustTarget, setAdjustTarget] = useState<Entry | null>(null);
  const [query, setQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Usamos admin/users con role aficionado para tener nombre y email
      const users = await api.getUsers();
      const aficionados = (users as any[])
        .filter((u: any) => u.role === 'aficionado' || !u.role || u.role === 'user')
        .map((u: any): Entry => ({
          userId: u.id ?? u.userId,
          username: u.username ?? '',
          firstName: u.firstName ?? undefined,
          lastName: u.lastName ?? undefined,
          email: u.email ?? undefined,
          points: u.points ?? 0,
        }));
      setEntries(aficionados);
    } catch (e) {
      console.error('Error loading leaderboard:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const applyDelta = async (userId: string, delta: number) => {
    haptics.light?.();
    const result = await api.adjustUserPoints(userId, delta);
    if (result) {
      setEntries((prev) =>
        prev.map((e) => e.userId === userId ? { ...e, points: result.newPoints } : e)
      );
    }
  };

  const sorted = useMemo(() => [...entries].sort((a, b) => b.points - a.points), [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (e) =>
        e.username.toLowerCase().includes(q) ||
        `${e.firstName ?? ''} ${e.lastName ?? ''}`.toLowerCase().includes(q) ||
        (e.email?.toLowerCase().includes(q) ?? false),
    );
  }, [sorted, query]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 12, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ ...typography.h3, color: colors.text, flex: 1, marginLeft: 8 }}>Top Fans</Text>
        <TouchableOpacity onPress={loadData} activeOpacity={0.7} style={{ padding: 6 }}>
          <RefreshCw size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginHorizontal: 16, marginTop: 14, marginBottom: 4,
        backgroundColor: colors.cardAlt,
        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
        borderWidth: 1, borderColor: colors.border,
      }}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre, email o @username…"
          placeholderTextColor={colors.textMuted}
          style={{
            flex: 1,
            color: colors.text,
            fontFamily: 'Inter_400Regular',
            fontSize: 14,
          }}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={brand.orange} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={{ ...typography.label, color: colors.textMuted, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
            USUARIOS ({filtered.length}{query ? ` de ${sorted.length}` : ''})
          </Text>

          <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            {filtered.length === 0 ? (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Text style={{ ...typography.body, color: colors.textMuted }}>
                  {query ? `Sin resultados para "${query}"` : 'No hay aficionados registrados'}
                </Text>
              </View>
            ) : (
              filtered.map((entry) => {
                const rank = sorted.findIndex((s) => s.userId === entry.userId) + 1;
                const fullName = [entry.firstName, entry.lastName].filter(Boolean).join(' ');
                return (
                  <TouchableOpacity
                    key={entry.userId}
                    onPress={() => router.push(`/(main)/gestion/usuarios/${entry.userId}` as any)}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 16, paddingVertical: 12,
                      backgroundColor: colors.card,
                      borderBottomWidth: 1, borderBottomColor: colors.border,
                      gap: 12,
                    }}
                  >
                    <Text style={{ ...typography.label, color: colors.textMuted, width: 24, textAlign: 'center' }}>
                      {rank}
                    </Text>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_500Medium' }}>
                        @{entry.username}
                      </Text>
                      {fullName ? (
                        <Text style={{ ...typography.caption, color: colors.textMuted }}>
                          {fullName}
                        </Text>
                      ) : null}
                      {entry.email ? (
                        <Text style={{ ...typography.caption, color: colors.textMuted }}>
                          {entry.email}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ backgroundColor: `${brand.orange}18`, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ ...typography.label, color: brand.orange, fontFamily: 'Inter_700Bold' }}>
                        {entry.points.toLocaleString('es-ES')} 🍑
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation?.(); setAdjustTarget(entry); }}
                      style={{ padding: 6, backgroundColor: colors.cardAlt, borderRadius: 8 }}
                      activeOpacity={0.7}
                    >
                      <Pencil size={14} color={colors.textMuted} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {adjustTarget && (
        <AdjustModal
          entry={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onSave={applyDelta}
        />
      )}
    </View>
  );
}
