/**
 * Feature UI component used by the mobile app: player card.
 * It packages a repeated visual pattern so screens stay smaller and easier to maintain.
 */

import React, { useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { Camera } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Avatar } from './ui/Avatar';
import { ImagePickerSheet } from './ui/ImagePickerSheet';
import { useRole } from '../hooks/useRole';
import { useTheme } from '../hooks/useTheme';
import { useImageUpload } from '../hooks/useImageUpload';
import api from '../services/api/index';

interface PlayerCardProps {
  playerId: string;
  name: string;
  photoUrl?: string | null;
  /** Llamado con la nueva publicUrl cuando la foto de perfil se actualiza */
  onProfileUpdated?: (newUrl: string) => void;
}

export function PlayerCard({ playerId, name, photoUrl, onProfileUpdated }: PlayerCardProps) {
  const { colors } = useTheme();
  const { canEdit } = useRole();
  const { upload, isLoading, error, reset } = useImageUpload();
  const [pickerVisible, setPickerVisible] = useState(false);

  React.useEffect(() => {
    if (error) {
      Alert.alert('Error al subir imagen', error, [{ text: 'OK', onPress: reset }]);
    }
  }, [error]);

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ position: 'relative' }}>
        <Avatar uri={photoUrl ?? undefined} name={name} size="xl" />

        {isLoading && (
          <View style={{
            position: 'absolute', inset: 0 as any,
            backgroundColor: 'rgba(0,0,0,0.45)',
            borderRadius: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}

        {canEdit && !isLoading && (
          <TouchableOpacity
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.8}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: colors.accent,
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: colors.bg,
            }}
          >
            <Camera size={14} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ImagePickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        title="Foto del jugador"
        onPick={async (imgs) => {
          setPickerVisible(false);
          const img = imgs[0];
          if (!img) return;
          const publicUrl = await upload(img, { kind: 'player', id: playerId });
          if (publicUrl) {
            try {
              await api.playerImages.addImage(playerId, { url: publicUrl, is_profile: true });
              onProfileUpdated?.(publicUrl);
            } catch {
              Alert.alert('Error', 'Imagen subida pero no se pudo registrar en la galería.');
            }
          }
        }}
      />
    </View>
  );
}
