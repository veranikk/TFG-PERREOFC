/**
 * Feature UI component used by the mobile app: event card.
 * It packages a repeated visual pattern so screens stay smaller and easier to maintain.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, Clock, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../theme/typography';
import { Event, EventType } from '../../types';
import { brand, state } from '../../theme/colors';

export const TYPE_COLORS: Record<EventType, string> = {
  match:    brand.orange,   // naranja — siempre, no customizable
  friendly: brand.orange,   // naranja — partido también
  training: brand.green,
  medical:  '#EC4899',      // rosa
  dinner:   '#8B5CF6',      // violeta
  meeting:  brand.blue,
  other:    brand.grey,
};

const TYPE_LABELS: Record<EventType, string> = {
  match:    'PARTIDO',
  friendly: 'AMISTOSO',
  training: 'ENTRENAMIENTO',
  medical:  'MÉDICO',
  dinner:   'CENA',
  meeting:  'REUNIÓN',
  other:    'EVENTO',
};

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const { colors } = useTheme();
  const accentColor = event.color ?? TYPE_COLORS[event.type];
  const isMatch = event.type === 'match' || event.type === 'friendly';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => router.push(`/(main)/calendario/evento/${event.id}` as any)}
      style={{
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Color bar */}
      <View style={{ width: 4, backgroundColor: accentColor }} />

      {/* Content */}
      <View style={{ flex: 1, padding: 14, gap: 6 }}>
        {/* Type label + match badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{
            backgroundColor: `${accentColor}22`,
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}>
            <Text style={{ ...typography.label, color: accentColor, fontFamily: 'Inter_600SemiBold' }}>
              {TYPE_LABELS[event.type]}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_600SemiBold' }} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Time + Location */}
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          {event.time && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={12} color={colors.textMuted} />
              <Text style={{ ...typography.caption, color: colors.textMuted }}>{event.time}</Text>
            </View>
          )}
          {event.location && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
              <MapPin size={12} color={colors.textMuted} />
              <Text style={{ ...typography.caption, color: colors.textMuted }} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Arrow */}
      <View style={{ justifyContent: 'center', paddingRight: 14 }}>
        <ChevronRight size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}
