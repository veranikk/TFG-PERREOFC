/**
 * Renders the clasificacion screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, TableProperties } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { useTheme } from '../src/hooks/useTheme';
import { api } from '../src/services/api';
import { typography } from '../src/theme/typography';
import { brand, state } from '../src/theme/colors';
import { rf, rs } from '../src/theme/responsive';
import { ClassificationEntry } from '../src/types';

// ── Column widths — escalan con el ancho de pantalla ──────────────────────────
const COL = {
  pos:  rs(22),
  gap:  rs(6),
  pj:   rs(26),
  g:    rs(24),
  e:    rs(24),
  p:    rs(24),
  gf:   rs(26),
  gc:   rs(26),
  pts:  rs(34),
};

// ── Header ────────────────────────────────────────────────────────────────────
function TableHeader() {
  const { colors } = useTheme();

  const hcell = (label: string, w: number) => (
    <Text key={label} style={{
      width: w,
      ...typography.label,
      color: colors.textMuted,
      textAlign: 'center',
      fontSize: rf(11),
    }}>
      {label}
    </Text>
  );

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: rs(12),
      paddingVertical: rs(9),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.cardAlt,
    }}>
      {hcell('#', COL.pos)}
      <View style={{ width: COL.gap }} />
      <Text style={{ flex: 1, ...typography.label, color: colors.textMuted, fontSize: rf(11) }}>Equipo</Text>
      {hcell('PJ', COL.pj)}
      {hcell('G',  COL.g)}
      {hcell('E',  COL.e)}
      {hcell('P',  COL.p)}
      {hcell('GF', COL.gf)}
      {hcell('GC', COL.gc)}
      {hcell('Pts', COL.pts)}
    </View>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────
function TableRow({ entry }: { entry: ClassificationEntry }) {
  const { colors } = useTheme();
  const isOwn = !!entry.isOwn;

  const zoneColor =
    entry.pos <= 2  ? brand.green :
    entry.pos === 3 ? brand.blue  :
    entry.pos >= 4  ? state.error :
    'transparent';

  const dcell = (value: string | number, w: number, bold?: boolean) => (
    <Text style={{
      width: w,
      ...typography.body,
      fontSize: rf(13),
      color: colors.text,
      fontFamily: bold || isOwn ? 'Inter_700Bold' : 'Inter_400Regular',
      textAlign: 'center',
    }} numberOfLines={1}>
      {value}
    </Text>
  );

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: rs(12),
      paddingVertical: rs(11),
      backgroundColor: isOwn ? `${brand.orange}10` : 'transparent',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      {/* Zone bar */}
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: zoneColor }} />

      {dcell(entry.pos, COL.pos)}
      <View style={{ width: COL.gap }} />

      {/* Team name — flex */}
      <Text style={{
        flex: 1,
        ...typography.body,
        fontSize: rf(13),
        color: isOwn ? colors.accent : colors.text,
        fontFamily: isOwn ? 'Inter_700Bold' : 'Inter_400Regular',
      }} numberOfLines={1}>
        {entry.teamName}
      </Text>

      {dcell(entry.pj, COL.pj)}
      {dcell(entry.w,  COL.g)}
      {dcell(entry.d,  COL.e)}
      {dcell(entry.l,  COL.p)}
      {dcell(entry.gf, COL.gf)}
      {dcell(entry.gc, COL.gc)}

      {/* Pts — destacado */}
      <View style={{ width: COL.pts, alignItems: 'center' }}>
        <View style={{
          backgroundColor: isOwn ? `${brand.orange}22` : `${colors.accent}15`,
          borderRadius: rs(8),
          paddingHorizontal: rs(5),
          paddingVertical: rs(2),
          minWidth: rs(28),
          alignItems: 'center',
        }}>
          <Text style={{
            ...typography.body,
            fontSize: rf(13),
            color: isOwn ? brand.orange : colors.accent,
            fontFamily: 'Inter_700Bold',
          }} numberOfLines={1}>
            {entry.pts}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────────
export default function ClasificacionScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<ClassificationEntry[]>([]);
  const [leagueName, setLeagueName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [seasonName, setSeasonName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getClassificationWithMeta().then(({ entries, leagueName: ln, groupName: gn, seasonName: sn }) => {
      setData(entries);
      setLeagueName(ln);
      setGroupName(gn);
      setSeasonName(sn);
      setLoading(false);
    });
  }, []);

  // Texto del subtítulo con los datos reales de BD
  const leagueLabel = [leagueName, groupName].filter(Boolean).join(' · ');
  const subtitleLine = [leagueLabel, seasonName].filter(Boolean).join(' · ');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: insets.top + 12, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        backgroundColor: colors.bg,
      }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4 }}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <TableProperties size={20} color={brand.blue} />
          <Text style={{ ...typography.h3, color: colors.text }}>Clasificación</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: insets.bottom + 24 }}>
          {/* Subtítulo liga */}
          <Text style={{ ...typography.body, color: colors.textMuted, fontFamily: 'Inter_600SemiBold', marginBottom: 10 }}>
            {subtitleLine || 'Clasificación'}
          </Text>

          {/* Tabla — altura natural, todos los equipos visibles */}
          <View style={{
            borderWidth: 1, borderColor: colors.border,
            borderRadius: 12, overflow: 'hidden',
          }}>
            <TableHeader />
            {data.map((entry, i) => (
              <MotiView
                key={`${entry.teamId}-${entry.pos}`}
                from={{ opacity: 0, translateX: -6 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 250, delay: i * 30 }}
              >
                <TableRow entry={entry} />
              </MotiView>
            ))}
          </View>

          {/* Leyenda */}
          <View style={{ marginTop: 14, flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
            {[
              { color: brand.green, label: 'Ascenso directo' },
              { color: brand.blue,  label: 'Play-off de ascenso' },
              { color: state.error, label: 'Descenso' },
            ].map(({ color, label }) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
                <Text style={{ ...typography.caption, color: colors.textMuted }}>{label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
