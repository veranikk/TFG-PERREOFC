/**
 * Feature UI component used by the mobile app: match hero.
 * It packages a repeated visual pattern so screens stay smaller and easier to maintain.
 */

import React from 'react';
import { View, Text, Image } from 'react-native';
import { Droplets, Wind } from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../theme/typography';
import { Match } from '../../types';
import { Pill } from '../ui/Pill';
import { PERREOFC_TEAM_ID_NUM } from '../../config';

interface MatchHeroProps {
  match: Match;
}

function TeamBlock({ name, shieldUrl, score, isHome }: { name: string; shieldUrl?: string; score?: number; isHome: boolean }) {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, alignItems: isHome ? 'flex-start' : 'flex-end', gap: 8 }}>
      {/* Logo */}
      {shieldUrl ? (
        <Image
          source={{ uri: shieldUrl }}
          style={{ width: 48, height: 48, borderRadius: 8 }}
          resizeMode="contain"
        />
      ) : (
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.cardAlt,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Ionicons name="football" size={20} color={colors.border} />
        </View>
      )}

      {/* Team name */}
      <Text
        style={{ ...typography.label, color: colors.text, fontFamily: 'Inter_600SemiBold', textAlign: isHome ? 'left' : 'right', flexShrink: 1 }}
        numberOfLines={2}
      >
        {name}
      </Text>

      {/* Score (shown large, below name) */}
      {score !== undefined && (
        <Text style={{ ...typography.h1, color: colors.text, fontSize: 48, lineHeight: 52 }}>
          {score}
        </Text>
      )}
    </View>
  );
}

function StatusPill({ match }: { match: Match }) {
  if (match.status === 'live') {
    return (
      <View style={{ alignItems: 'center', gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
          <Text style={{ ...typography.label, color: '#EF4444', fontFamily: 'Inter_700Bold' }}>EN DIRECTO</Text>
        </View>
      </View>
    );
  }
  if (match.status === 'upcoming') {
    return <Pill label="PRÓXIMO" variant="upcoming" />;
  }

  const OWN_TEAM_ID = PERREOFC_TEAM_ID_NUM;
  const perreoIsHome = match.homeTeamId === OWN_TEAM_ID
    ? true
    : match.awayTeamId === OWN_TEAM_ID
    ? false
    : match.homeTeam.toUpperCase().includes('PERREO');
  const perreoScore = perreoIsHome ? (match.homeScore ?? 0) : (match.awayScore ?? 0);
  const rivalScore  = perreoIsHome ? (match.awayScore ?? 0) : (match.homeScore ?? 0);

  if (perreoScore > rivalScore) return <Pill label="VICTORIA" variant="win" />;
  if (perreoScore < rivalScore) return <Pill label="DERROTA" variant="loss" />;
  return <Pill label="EMPATE" variant="draw" />;
}

export function MatchHero({ match }: MatchHeroProps) {
  const { colors } = useTheme();
  const hasScore = match.homeScore !== undefined;

  return (
    <View style={{
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    }}>
      {/* Competition */}
      {match.competition && (
        <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>
          {match.competition}
        </Text>
      )}

      {/* Teams row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TeamBlock name={match.homeTeam} shieldUrl={match.homeShieldUrl} score={match.homeScore} isHome />

        {/* Center */}
        <View style={{ alignItems: 'center', gap: 8, minWidth: 72 }}>
          {!hasScore && (
            <Text style={{ ...typography.h2, color: colors.textMuted }}>VS</Text>
          )}
          <StatusPill match={match} />
          {hasScore && match.status === 'finished' && (
            <Text style={{ ...typography.caption, color: colors.textMuted }}>Final</Text>
          )}
        </View>

        <TeamBlock name={match.awayTeam} shieldUrl={match.awayShieldUrl} score={match.awayScore} isHome={false} />
      </View>

      {/* Meta info */}
      <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 4 }}>
        <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>
          {match.location}
        </Text>
        {match.weather && (
          <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>
            {match.weather.icon} {match.weather.temp}°C · {match.weather.description} · {match.weather.humidity}% · {match.weather.wind} km/h
          </Text>
        )}
      </View>
    </View>
  );
}
