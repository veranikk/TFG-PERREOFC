/**
 * Feature UI component used by the mobile app: stats.
 * It packages a repeated visual pattern so screens stay smaller and easier to maintain.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../theme/typography';
import { MatchStats, Match } from '../../types';
import { brand } from '../../theme/colors';

interface StatRowProps {
  label: string;
  home: number;
  away: number;
  isPercentage?: boolean;
}

function StatRow({ label, home, away, isPercentage = false }: StatRowProps) {
  const { colors } = useTheme();
  const total = home + away;
  const homeRatio = total > 0 ? home / total : 0.5;

  return (
    <View style={{ gap: 6 }}>
      {/* Values */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ ...typography.label, color: colors.text, fontFamily: 'Inter_700Bold', minWidth: 28, textAlign: 'left' }}>
          {home}{isPercentage ? '%' : ''}
        </Text>
        <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>
          {label}
        </Text>
        <Text style={{ ...typography.label, color: colors.text, fontFamily: 'Inter_700Bold', minWidth: 28, textAlign: 'right' }}>
          {away}{isPercentage ? '%' : ''}
        </Text>
      </View>

      {/* Bar */}
      <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: colors.cardAlt }}>
        <View style={{ flex: homeRatio, backgroundColor: brand.orange, borderRadius: 3 }} />
        <View style={{ flex: 1 - homeRatio, backgroundColor: brand.blue, borderRadius: 3 }} />
      </View>
    </View>
  );
}

interface StatsProps {
  match: Match;
}

export function Stats({ match }: StatsProps) {
  const { colors } = useTheme();
  const s = match.stats;

  if (!s) {
    return (
      <View style={{ padding: 32, alignItems: 'center' }}>
        <Text style={{ ...typography.body, color: colors.textMuted }}>Estadísticas no disponibles</Text>
      </View>
    );
  }

  const perreoIsHome = match.homeTeam === 'Perreo FC';
  // Reorder so Perreo FC is always on the left
  const stat = <T,>(pair: [T, T]): [T, T] =>
    perreoIsHome ? pair : [pair[1], pair[0]];

  return (
    <View style={{ gap: 4 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: brand.orange }} />
          <Text style={{ ...typography.caption, color: colors.textMuted }}>Perreo FC</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ ...typography.caption, color: colors.textMuted }}>
            {perreoIsHome ? match.awayTeam : match.homeTeam}
          </Text>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: brand.blue }} />
        </View>
      </View>

      <StatRow label="Posesión" home={stat(s.possession)[0]} away={stat(s.possession)[1]} isPercentage />
      <View style={{ height: 8 }} />
      <StatRow label="Tiros" home={stat(s.shots)[0]} away={stat(s.shots)[1]} />
      <View style={{ height: 8 }} />
      <StatRow label="Tiros a puerta" home={stat(s.shotsOnTarget)[0]} away={stat(s.shotsOnTarget)[1]} />
      <View style={{ height: 8 }} />
      <StatRow label="Córners" home={stat(s.corners)[0]} away={stat(s.corners)[1]} />
      <View style={{ height: 8 }} />
      <StatRow label="Faltas" home={stat(s.fouls)[0]} away={stat(s.fouls)[1]} />
      <View style={{ height: 8 }} />
      <StatRow label="Tarjetas amarillas" home={stat(s.yellowCards)[0]} away={stat(s.yellowCards)[1]} />
      {(s.redCards[0] > 0 || s.redCards[1] > 0) && (
        <>
          <View style={{ height: 8 }} />
          <StatRow label="Tarjetas rojas" home={stat(s.redCards)[0]} away={stat(s.redCards)[1]} />
        </>
      )}
    </View>
  );
}
