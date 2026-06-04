/**
 * Reusable UI component for the app design system: image picker sheet.
 * It keeps styling and interaction patterns consistent across screens.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageIcon, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../theme/typography';
import { BottomSheet } from './BottomSheet';
import { brand } from '../../theme/colors';

export interface PickedImage {
  uri: string;
  isLocal: boolean;
}

interface ImagePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onPick: (images: PickedImage[]) => void;
  title?: string;
  allowsMultiple?: boolean;
  warning?: string;
  galleryOnly?: boolean;
  cropToSquare?: boolean;
}

// ── Componente principal ───────────────────────────────────────────────────────
export function ImagePickerSheet({
  visible,
  onClose,
  onPick,
  title = 'Añadir imagen',
  allowsMultiple = false,
  warning,
  cropToSquare = false,
}: ImagePickerSheetProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  const handlePick = (images: PickedImage[]) => {
    onPick(images);
    onClose();
  };

  const handleGallery = async () => {
    setLoading(true);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { setLoading(false); return; }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: cropToSquare,
        aspect: cropToSquare ? [1, 1] : undefined,
        quality: 0.85,
        allowsMultipleSelection: allowsMultiple && !cropToSquare,
      });

      if (!result.canceled && result.assets.length > 0) {
        handlePick(result.assets.map((a) => ({ uri: a.uri, isLocal: true })));
      }
    } catch {
      // usuario canceló o sin permisos
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} snapHeight={260}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <Text style={{ ...typography.h3, color: colors.text, marginBottom: 4 }}>{title}</Text>
        <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: warning ? 12 : 20 }}>
          Elige una foto de tu galería
        </Text>

        {warning && (
          <View style={{
            backgroundColor: '#EF444418',
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#EF444430',
          }}>
            <Text style={{ ...typography.caption, color: '#EF4444', lineHeight: 18 }}>
              {warning}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleGallery}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            backgroundColor: `${brand.orange}14`,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: `${brand.orange}30`,
          }}
        >
          <View style={{
            width: 42, height: 42, borderRadius: 21,
            backgroundColor: `${brand.orange}22`,
            alignItems: 'center', justifyContent: 'center',
          }}>
            {loading
              ? <ActivityIndicator color={brand.orange} size="small" />
              : <ImageIcon size={20} color={brand.orange} />
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.body, color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 14 }}>
              {Platform.OS === 'web' ? 'Archivo del ordenador' : 'Galería del móvil'}
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 1 }}>
              {allowsMultiple ? 'Selección múltiple disponible' : 'Elige una foto'}
            </Text>
          </View>
          <ArrowRight size={16} color={brand.orange} />
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}
