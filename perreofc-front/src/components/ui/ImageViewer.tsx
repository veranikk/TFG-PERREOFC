/**
 * Reusable UI component for the app design system: image viewer.
 * It keeps styling and interaction patterns consistent across screens.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { typography } from '../../theme/typography';

const { width: SCREEN_W } = Dimensions.get('window');

export interface ViewerImage {
  id: string;
  url: string;
  description?: string;
  location?: string;
}

interface ImageViewerProps {
  images: ViewerImage[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}

// ── Single zoomable image ─────────────────────────────────────────────────────
function ZoomableImage({ uri }: { uri: string }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const savedOffsetX = useSharedValue(0);
  const savedOffsetY = useSharedValue(0);

  const resetZoom = () => {
    'worklet';
    scale.value = withSpring(1);
    offsetX.value = withSpring(0);
    offsetY.value = withSpring(0);
    savedScale.value = 1;
    savedOffsetX.value = 0;
    savedOffsetY.value = 0;
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 5));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1.05) {
        resetZoom();
      }
    });

  const pan = Gesture.Pan()
    .minPointers(2)
    .onUpdate((e) => {
      if (scale.value > 1) {
        offsetX.value = savedOffsetX.value + e.translationX;
        offsetY.value = savedOffsetY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedOffsetX.value = offsetX.value;
      savedOffsetY.value = offsetY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        resetZoom();
      } else {
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{ width: SCREEN_W, flex: 1, alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
        <Image
          source={{ uri }}
          style={{ width: SCREEN_W, flex: 1 }}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </Animated.View>
    </GestureDetector>
  );
}

// ── Main viewer ───────────────────────────────────────────────────────────────
export function ImageViewer({ images, initialIndex, visible, onClose }: ImageViewerProps) {
  const [current, setCurrent] = useState(initialIndex);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      setCurrent(initialIndex);
      setTimeout(() => {
        flatRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 50);
    }
  }, [visible, initialIndex]);

  const img = images[current];

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Close */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: 'absolute', top: 48, right: 16, zIndex: 10,
            padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20,
          }}
        >
          <X size={24} color="#fff" />
        </TouchableOpacity>

        {/* Counter */}
        {images.length > 1 && (
          <View style={{ position: 'absolute', top: 48, left: 0, right: 0, alignItems: 'center', zIndex: 10 }}>
            <Text style={{ ...typography.label, color: 'rgba(255,255,255,0.7)' }}>
              {current + 1} / {images.length}
            </Text>
          </View>
        )}

        {/* Images */}
        <FlatList
          ref={flatRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          scrollEnabled={true}
          getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            setCurrent(idx);
          }}
          renderItem={({ item }) => (
            <View style={{ width: SCREEN_W, flex: 1 }}>
              <ZoomableImage uri={item.url} />
            </View>
          )}
          keyExtractor={(item) => item.id}
        />

        {/* Nav arrows */}
        {images.length > 1 && current > 0 && (
          <TouchableOpacity
            onPress={() => {
              flatRef.current?.scrollToIndex({ index: current - 1, animated: true });
              setCurrent(current - 1);
            }}
            style={{
              position: 'absolute', left: 8, top: '50%' as any, marginTop: -24,
              padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 24,
            }}
          >
            <ChevronLeft size={28} color="#fff" />
          </TouchableOpacity>
        )}
        {images.length > 1 && current < images.length - 1 && (
          <TouchableOpacity
            onPress={() => {
              flatRef.current?.scrollToIndex({ index: current + 1, animated: true });
              setCurrent(current + 1);
            }}
            style={{
              position: 'absolute', right: 8, top: '50%' as any, marginTop: -24,
              padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 24,
            }}
          >
            <ChevronRight size={28} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Caption */}
        {img && (img.description || img.location) && (
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', padding: 16, gap: 2,
          }}>
            {img.description && (
              <Text style={{ ...typography.body, color: '#fff', fontFamily: 'Inter_600SemiBold' }}>
                {img.description}
              </Text>
            )}
            {img.location && (
              <Text style={{ ...typography.caption, color: 'rgba(255,255,255,0.7)' }}>
                {img.location}
              </Text>
            )}
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}
