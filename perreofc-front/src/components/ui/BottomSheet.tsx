/**
 * Reusable UI component for the app design system: bottom sheet.
 * It keeps styling and interaction patterns consistent across screens.
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../theme/typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapHeight?: number;
  scrollable?: boolean;
  /** Si true, el sheet sube con el teclado (ideal para sheets con pocos inputs).
   *  Si false (default), el sheet permanece fijo y el scroll interno se ajusta. */
  keyboardAware?: boolean;
  style?: ViewStyle;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  snapHeight = SCREEN_HEIGHT * 0.55,
  scrollable = false,
  keyboardAware = false,
  style,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(snapHeight)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: snapHeight,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const sheetContent = (
    <Animated.View
      style={[
        {
          backgroundColor: colors.bgAlt,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          // keyboardAware: altura flexible para que el KAV lo pueda empujar
          // fixed: altura fija para que el scroll interno funcione
          ...(keyboardAware
            ? { paddingBottom: 32 }
            : { height: snapHeight }),
        },
        { transform: [{ translateY }] },
        style,
      ]}
    >
      {/* Handle */}
      <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
      </View>

      {/* Title */}
      {title && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}>
          <Text style={{ ...typography.h3, color: colors.text }}>{title}</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={{ ...typography.body, color: colors.accent }}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      )}

      {keyboardAware ? (
        // Sheet pequeño: contenido directo sin scroll
        <View style={{ paddingHorizontal: 20 }}>
          {children}
        </View>
      ) : (
        // Sheet grande: ScrollView con ajuste automático de teclado
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          keyboardDismissMode="interactive"
        >
          {children}
        </ScrollView>
      )}
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
        activeOpacity={1}
        onPress={onClose}
      />

      {keyboardAware ? (
        // KAV empuja el sheet hacia arriba cuando sube el teclado
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        >
          {sheetContent}
        </KeyboardAvoidingView>
      ) : (
        // Sheet fijo al fondo, el scroll interno absorbe el teclado
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          {sheetContent}
        </View>
      )}
    </Modal>
  );
}
