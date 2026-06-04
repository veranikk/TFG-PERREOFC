/**
 * Feature UI component used by the mobile app: lineup.
 * It packages a repeated visual pattern so screens stay smaller and easier to maintain.
 */

import React, { useState } from 'react';
import { View, Text, LayoutChangeEvent, Platform } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../theme/typography';
import { PlayerLineup, Match, MatchStaffEntry } from '../../types';
import { PERREOFC_TEAM_ID_NUM } from '../../config';
import { brand } from '../../theme/colors';

const TOKEN = 32;

/** Asigna prioridad numérica a una posición táctica (0=portero, 1=defensa, 2=medio, 3=delantera). */
function positionRank(p: PlayerLineup): number {
  const pos = (p.position ?? '').toUpperCase().trim();
  if (pos.includes('PORTERO') || pos.includes('GOALKEEPER') || pos === 'GK' || pos === 'PO') return 0;
  if (
    pos.includes('DEFENSA') || pos.includes('CENTRAL') || pos.includes('LATERAL') ||
    pos.includes('DEFENDER') || pos.includes('DEFENSOR') ||
    pos === 'DEF' || pos === 'CB' || pos === 'LB' || pos === 'RB' || pos === 'DF'
  ) return 1;
  if (
    pos.includes('MEDIO') || pos.includes('MEDIOCENTRO') || pos.includes('CENTROCAMPISTA') ||
    pos.includes('MIDFIELD') || pos.includes('CENTRO') || pos.includes('PIVOTE') ||
    pos === 'MED' || pos === 'MC' || pos === 'MF' || pos === 'CM' || pos === 'MI' || pos === 'MD'
  ) return 2;
  if (
    pos.includes('DELANTERO') || pos.includes('EXTREMO') || pos.includes('FORWARD') ||
    pos.includes('ARIETE') || pos.includes('PUNTA') ||
    pos === 'DEL' || pos === 'FW' || pos === 'DL' || pos === 'EI' || pos === 'ED'
  ) return 3;
  return 2;
}

/** Genera coordenadas (x,y) para jugadores según la formación (ej. "1-4-3-3"). isTop determina si ataca hacia arriba o abajo. */
function generateFormationPositions(
  players: PlayerLineup[],
  formation: string | undefined,
  isTop: boolean,
): PlayerLineup[] {
  const lines = (formation ?? '4-4-2')
    .split('-')
    .map(Number)
    .filter(n => !isNaN(n) && n > 0);

  // Strip leading 1 (portero) from formation string
  const outfieldLines = lines[0] === 1 && lines.length > 1 ? lines.slice(1) : lines;

  const gkPlayer = players.find(p =>
    p.isGoalkeeper ||
    positionRank(p) === 0 ||
    p.dorsal === 1
  );
  const outfield = players.filter(p => p !== gkPlayer);

  // Sort outfield by tactical position rank (def→mid→fwd), then dorsal
  // For isTop=false (GK at bottom): rank 1=def stays near GK (low y), rank 3=fwd far from GK (high y)
  // For isTop=true  (GK at top):    rank 1=def stays near GK (low y), rank 3=fwd far from GK (high y)
  // So always sort ascending by rank — first line in outfieldLines is always defensa
  // For players without a known position (rank defaults to 2), fall back to alphabetical name sort
  const sorted = [...outfield].sort((a, b) => {
    const rA = positionRank(a);
    const rB = positionRank(b);
    const rDiff = rA - rB;
    if (rDiff !== 0) return rDiff;
    // Same rank: sort by dorsal if both have one, otherwise alphabetically by name
    const aDorsal = a.dorsal ?? 0;
    const bDorsal = b.dorsal ?? 0;
    if (aDorsal !== 0 && bDorsal !== 0) return aDorsal - bDorsal;
    return (a.name ?? '').localeCompare(b.name ?? '');
  });

  const result: PlayerLineup[] = [];

  if (gkPlayer) {
    result.push({ ...gkPlayer, x: 50, y: isTop ? 7 : 93 });
  }

  const totalLines = outfieldLines.length;
  let idx = 0;

  for (let lineIdx = 0; lineIdx < totalLines; lineIdx++) {
    const count = outfieldLines[lineIdx];
    const linePlayers: PlayerLineup[] = [];
    for (let i = 0; i < count && idx < sorted.length; i++, idx++) {
      linePlayers.push(sorted[idx]);
    }
    if (linePlayers.length === 0) continue;

    // isTop=false: GK at y=93. Defensa near GK → high y. Delantera far → low y.
    //   lineIdx=0 (def) → y=83, lineIdx=last (fwd) → y=57
    // isTop=true: GK at y=7. Defensa near GK → low y. Delantera far → high y.
    //   lineIdx=0 (def) → y=17, lineIdx=last (fwd) → y=43
    const yStart = isTop ? 17 : 83; // defensa side
    const yEnd   = isTop ? 43 : 57; // delantera side
    const yStep = totalLines > 1 ? (yEnd - yStart) / (totalLines - 1) : 0;
    const y = totalLines === 1 ? (yStart + yEnd) / 2 : yStart + lineIdx * yStep;

    linePlayers.forEach((p, i) => {
      const x = linePlayers.length === 1
        ? 50
        : 10 + (i * 80) / (linePlayers.length - 1);
      result.push({ ...p, x, y });
    });
  }

  while (idx < sorted.length) {
    result.push({ ...sorted[idx], x: 50, y: isTop ? 30 : 70 });
    idx++;
  }

  return result;
}

/** Distribuye jugadores uniformemente en una línea horizontal del campo (usado para formación genérica). */
function placeLine(players: PlayerLineup[], y: number): PlayerLineup[] {
  return players.map((p, i) => ({
    ...p,
    x: players.length === 1 ? 50 : 10 + (i * 80) / (players.length - 1),
    y,
  }));
}

/** Genera posiciones para Perreo FC usando sus posiciones reales (GK=93, DEF=83, MID=70, FWD=57). */
function generatePerreoPositions(players: PlayerLineup[]): PlayerLineup[] {
  const gk  = players.filter(p => p.isGoalkeeper || positionRank(p) === 0);
  const def = players.filter(p => !p.isGoalkeeper && positionRank(p) === 1);
  const mid = players.filter(p => !p.isGoalkeeper && positionRank(p) === 2);
  const fwd = players.filter(p => !p.isGoalkeeper && positionRank(p) === 3);

  // Sort each group by dorsal then name
  const sortGroup = (g: PlayerLineup[]) =>
    [...g].sort((a, b) => {
      const aD = a.dorsal ?? 0, bD = b.dorsal ?? 0;
      if (aD !== 0 && bD !== 0) return aD - bD;
      return (a.name ?? '').localeCompare(b.name ?? '');
    });

  return [
    ...placeLine(sortGroup(gk),  93),
    ...placeLine(sortGroup(def), 83),
    ...placeLine(sortGroup(mid), 70),
    ...placeLine(sortGroup(fwd), 57),
  ];
}

/** Asigna coordenadas si jugadores ya las tienen, o las genera automáticamente según formación/equipo. */
function ensurePositions(
  players: PlayerLineup[],
  formation: string | undefined,
  isTop: boolean,
  isPerreo: boolean,
): PlayerLineup[] {
  const hasCoords = players.some(p => p.x !== 50 || p.y !== 50);
  if (hasCoords) return players;
  if (isPerreo) return generatePerreoPositions(players);
  return generateFormationPositions(players, formation, isTop);
}

interface PitchSize { width: number; height: number }

function PlayerToken({ player, color, pitchSize }: {
  player: PlayerLineup;
  color: string;
  pitchSize: PitchSize;
}) {
  if (pitchSize.width === 0) return null;
  const LABEL_W = 80;
  const left = (player.x / 100) * pitchSize.width - LABEL_W / 2;
  const top  = (player.y / 100) * pitchSize.height - TOKEN / 2;

  return (
    <View style={{ position: 'absolute', left, top, alignItems: 'center', width: LABEL_W }}>
      <View style={{
        width: TOKEN,
        height: TOKEN,
        borderRadius: TOKEN / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.7)',
      }}>
        <Text style={{ fontSize: 12, color: '#fff', fontFamily: 'Inter_700Bold' }}>
          {player.dorsal || '?'}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 9,
          color: '#fff',
          fontFamily: 'Inter_500Medium',
          marginTop: 2,
          textShadowColor: 'rgba(0,0,0,0.9)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
          textAlign: 'center',
          width: '100%',
        }}
        numberOfLines={2}
      >
        {player.isCaptain ? `© ${player.name}` : player.name}
      </Text>
    </View>
  );
}

function SubstituteRow({ player, color }: { player: PlayerLineup; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <View style={{
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: color,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
      }}>
        <Text style={{ fontSize: 11, color: '#fff', fontFamily: 'Inter_700Bold' }}>{player.dorsal || '?'}</Text>
      </View>
      <Text style={{ ...typography.caption, color: colors.text, fontFamily: 'Inter_500Medium', flex: 1 }}>
        {player.isCaptain ? `${player.name} ©` : player.name}
        {player.isGoalkeeper ? <Text style={{ color: colors.textMuted }}> · PO</Text> : null}
        {player.position ? <Text style={{ color: colors.textMuted }}> · {player.position}</Text> : null}
      </Text>
    </View>
  );
}

interface LineupProps {
  match: Match;
}

export function Lineup({ match }: LineupProps) {
  const { colors } = useTheme();
  const [pitchSize, setPitchSize] = useState<PitchSize>({ width: 0, height: 0 });

  if (!match.lineup) {
    return (
      <View style={{ padding: 32, alignItems: 'center' }}>
        <Text style={{ ...typography.body, color: colors.textMuted }}>Alineación no disponible</Text>
      </View>
    );
  }

  const OWN_TEAM_ID = PERREOFC_TEAM_ID_NUM;
  const perreoIsHome = match.homeTeamId === OWN_TEAM_ID
    ? true
    : match.awayTeamId === OWN_TEAM_ID
    ? false
    : match.homeTeam === 'Perreo FC' || match.homeTeam.toUpperCase().includes('PERREO');
  const perreoPlayers = perreoIsHome ? match.lineup.home : match.lineup.away;
  const rivalPlayers  = perreoIsHome ? match.lineup.away : match.lineup.home;
  const rivalName     = perreoIsHome ? match.awayTeam : match.homeTeam;

  const perreoFormation = perreoIsHome ? match.homeFormation : match.awayFormation;
  const rivalFormation  = perreoIsHome ? match.awayFormation : match.homeFormation;
  const perreoCoach = perreoIsHome ? match.homeCoachName : match.awayCoachName;
  const rivalCoach  = perreoIsHome ? match.awayCoachName : match.homeCoachName;

  const perreoStarters = perreoPlayers.filter(p => p.isStarter !== false && !p.isSubstitute);
  const perreoSubs     = perreoPlayers.filter(p => p.isSubstitute);
  const rivalStarters  = rivalPlayers.filter(p => p.isStarter !== false && !p.isSubstitute);
  const rivalSubs      = rivalPlayers.filter(p => p.isSubstitute);

  const pitchPerreoRaw = perreoStarters.length > 0 ? perreoStarters : perreoPlayers;
  const pitchRivalRaw  = rivalStarters.length  > 0 ? rivalStarters  : rivalPlayers;

  // Perreo FC ataca hacia abajo (y alto), rival en la parte de arriba
  const pitchPerreo = ensurePositions(pitchPerreoRaw, perreoFormation, false, true);
  const pitchRival  = ensurePositions(pitchRivalRaw,  rivalFormation,  true,  false);

  const hasSubs  = perreoSubs.length > 0 || rivalSubs.length > 0;
  const hasStaff = (match.staff ?? []).length > 0;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setPitchSize({ width, height });
  };

  const pitchMaxWidth = Platform.OS === 'web' ? 300 : undefined;

  return (
    <View style={{ gap: 16 }}>
      {/* Leyenda equipos */}
      <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: brand.orange }} />
          <Text style={{ ...typography.caption, color: colors.textMuted }}>Perreo FC</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: brand.blue }} />
          <Text style={{ ...typography.caption, color: colors.textMuted }}>{rivalName}</Text>
        </View>
      </View>

      {/* Campo */}
      <View style={{ alignItems: 'center' }}>
        <View
          onLayout={onLayout}
          style={{
            width: pitchMaxWidth ?? '100%',
            aspectRatio: 0.62,
            backgroundColor: '#2D7A32',
            borderRadius: 12,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Franjas decorativas */}
          {[0,1,2,3,4,5].map(i => (
            <View key={i} style={{
              position: 'absolute',
              top: `${i * 16.66}%` as any,
              left: 0, right: 0,
              height: '8.33%' as any,
              backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.05)' : 'transparent',
            }} />
          ))}

          {/* Borde exterior */}
          <View style={{
            position: 'absolute',
            top: 8, left: 8, right: 8, bottom: 8,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.7)',
            borderRadius: 4,
          }} />

          {/* Línea central */}
          <View style={{
            position: 'absolute',
            top: '50%' as any,
            left: 8, right: 8,
            height: 2,
            backgroundColor: 'rgba(255,255,255,0.7)',
            marginTop: -1,
          }} />

          {/* Círculo central */}
          <View style={{
            position: 'absolute',
            top: '50%' as any,
            left: '50%' as any,
            width: 56, height: 56,
            borderRadius: 28,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.7)',
            marginTop: -28, marginLeft: -28,
          }} />

          {/* Área penal — rival (arriba) */}
          <View style={{
            position: 'absolute',
            top: 8, left: '20%' as any, right: '20%' as any,
            height: '18%' as any,
            borderWidth: 2, borderTopWidth: 0,
            borderColor: 'rgba(255,255,255,0.7)',
          }} />

          {/* Área penal — Perreo FC (abajo) */}
          <View style={{
            position: 'absolute',
            bottom: 8, left: '20%' as any, right: '20%' as any,
            height: '18%' as any,
            borderWidth: 2, borderBottomWidth: 0,
            borderColor: 'rgba(255,255,255,0.7)',
          }} />

          {/* Jugadores */}
          {pitchSize.width > 0 && pitchRival.map(p => (
            <PlayerToken key={p.playerId} player={p} color={brand.blue} pitchSize={pitchSize} />
          ))}
          {pitchSize.width > 0 && pitchPerreo.map(p => (
            <PlayerToken key={p.playerId} player={p} color={brand.orange} pitchSize={pitchSize} />
          ))}
        </View>
      </View>

      {/* Suplentes */}
      {hasSubs && (
        <View style={{ gap: 10 }}>
          <Text style={{ ...typography.label, color: colors.textMuted }}>SUPLENTES</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Perreo FC suplentes */}
            {perreoSubs.length > 0 && (
              <View style={{ flex: 1, gap: 0 }}>
                <Text style={{ ...typography.caption, color: brand.orange, fontFamily: 'Inter_600SemiBold', marginBottom: 6 }}>
                  Perreo FC
                </Text>
                {perreoSubs.map(p => (
                  <SubstituteRow key={p.playerId} player={p} color={brand.orange} />
                ))}
              </View>
            )}
            {/* Rival suplentes */}
            {rivalSubs.length > 0 && (
              <View style={{ flex: 1, gap: 0 }}>
                <Text style={{ ...typography.caption, color: brand.blue, fontFamily: 'Inter_600SemiBold', marginBottom: 6 }}>
                  {rivalName}
                </Text>
                {rivalSubs.map(p => (
                  <SubstituteRow key={p.playerId} player={p} color={brand.blue} />
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Staff técnico */}
      {hasStaff && (
        <View style={{ gap: 8 }}>
          <Text style={{ ...typography.label, color: colors.textMuted }}>CUERPO TÉCNICO</Text>
          {(match.staff ?? []).map((s, i) => {
            const isPerreoSide = (s.side === 'home') === perreoIsHome;
            const sideColor = isPerreoSide ? brand.orange : brand.blue;
            const sideName  = isPerreoSide ? 'Perreo FC' : rivalName;
            return (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sideColor }} />
                <Text style={{ ...typography.caption, color: colors.text, fontFamily: 'Inter_500Medium', flex: 1 }}>
                  {s.staffName}
                  {s.roleDescription ? <Text style={{ color: colors.textMuted }}> · {s.roleDescription}</Text> : null}
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>{sideName}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
