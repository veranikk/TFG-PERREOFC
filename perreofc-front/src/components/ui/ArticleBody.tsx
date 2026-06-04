/**
 * Reusable UI component for the app design system: article body.
 * It keeps styling and interaction patterns consistent across screens.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { typography } from '../../theme/typography';

export function ArticleBody({ text, colors }: { text: string; colors: any }) {
  const paragraphs = text.split('\n\n').filter(Boolean);

  return (
    <View style={{ gap: 16 }}>
      {paragraphs.map((para, pi) => {
        const isBold = para.startsWith('**') && para.includes('**');
        if (isBold) {
          const clean = para.replace(/\*\*/g, '');
          return (
            <Text key={pi} style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_700Bold', lineHeight: 24 }}>
              {clean}
            </Text>
          );
        }
        return (
          <Text key={pi} style={{ ...typography.body, color: colors.text, lineHeight: 26 }}>
            {para}
          </Text>
        );
      })}
    </View>
  );
}
