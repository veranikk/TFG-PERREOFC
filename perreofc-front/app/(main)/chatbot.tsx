/**
 * Renders the chatbot screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, AlertTriangle } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useChat } from '../../src/hooks/useChat';
import { Mascota } from '../../src/components/brand/Mascota';
import { typography } from '../../src/theme/typography';
import { brand } from '../../src/theme/colors';

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  const { colors } = useTheme();
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - i * 150),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 18,
      borderBottomLeftRadius: 4,
      paddingHorizontal: 16,
      paddingVertical: 14,
      alignSelf: 'flex-start',
      gap: 5,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7, height: 7, borderRadius: 4,
            backgroundColor: colors.textMuted,
            opacity: dot,
            transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
          }}
        />
      ))}
    </View>
  );
}

// ── Render markdown for assistant / plain text for user ───────────────────────
function AssistantText({ text, isUser, isError }: {
  text: string; isUser: boolean; isError?: boolean;
}) {
  const { colors } = useTheme();
  const textColor = isUser ? '#fff' : isError ? '#F87171' : colors.text;

  // Assistant messages use Markdown (if not an error)
  if (!isUser && !isError) {
    return (
      <Markdown
        style={{
          body: {
            color: colors.text,
            fontFamily: 'Inter_400Regular',
            fontSize: 14,
            lineHeight: 22,
          },
          link: {
            color: '#FE6128',
            textDecorationLine: 'underline',
          },
          strong: {
            fontFamily: 'Inter_700Bold',
            fontWeight: 'bold',
          },
          em: {
            fontStyle: 'italic',
          },
          paragraph: {
            marginTop: 0,
            marginBottom: 4,
          },
          bullet_list: {
            marginTop: 4,
            marginBottom: 4,
          },
          ordered_list: {
            marginTop: 4,
            marginBottom: 4,
          },
          list_item: {
            marginBottom: 2,
            flexDirection: 'row',
            alignItems: 'flex-start',
          },
          bullet_list_icon: {
            marginLeft: 4,
            marginRight: 8,
            marginTop: 6,
            lineHeight: 16,
            color: colors.text,
          },
          ordered_list_icon: {
            marginRight: 8,
            color: colors.text,
            fontFamily: 'Inter_400Regular',
            fontSize: 14,
          },
        }}
      >
        {text}
      </Markdown>
    );
  }

  // User messages or error messages use plain text with basic bold support
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: isError ? 6 : 0 }}>
      {isError && (
        <AlertTriangle size={14} color="#F87171" style={{ marginTop: 3, marginRight: 4 }} />
      )}
      <Text style={{ ...typography.body, color: textColor, lineHeight: 22, fontSize: 14, flexShrink: 1 }}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <Text key={i} style={{ fontFamily: 'Inter_700Bold', color: textColor }}>
                {part.slice(2, -2)}
              </Text>
            );
          }
          return <Text key={i}>{part}</Text>;
        })}
      </Text>
    </View>
  );
}


// ── Pantalla ──────────────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');

export default function ChatbotScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = 60 + insets.top;
  const userId = useAuthStore((s) => s.user?.id);

  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  // Reiniciar el chat cuando cambia el usuario (RoleSwitcher o logout)
  useEffect(() => {
    clearMessages();
    setInput('');
  }, [userId]);

  const isEmpty = messages.length === 0;
  const maxW = Platform.OS === 'web' ? Math.min(SCREEN_W, 720) : SCREEN_W;

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    await sendMessage(trimmed);
  };

  // Auto-scroll on new message
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, isLoading]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignSelf: 'center', width: maxW, flex: 1 }}>
          {/* ── Empty state: hero mascota + sugerencias ── */}
          {isEmpty && (
            <View style={{ alignItems: 'center', paddingTop: 40, paddingHorizontal: 20, gap: 20 }}>
              <Mascota size="xl" />
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 28, color: colors.text, letterSpacing: 1 }}>
                  ¡Hola! Soy Perreito
                </Text>
                <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 }}>
                  El asistente oficial de Perreo FC. Pregúntame lo que quieras sobre el club.
                </Text>
              </View>

            </View>
          )}

          {/* ── Messages ── */}
          {!isEmpty && (
            <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 8 }}>
              {messages.map((msg) => {
                const isUser = msg.role === 'user';

                if (!isUser && msg.isLoading) {
                  return (
                    <View key={msg.id} style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
                      <View style={{ marginBottom: 4 }}>
                        <Mascota size="sm" />
                      </View>
                      <TypingDots />
                    </View>
                  );
                }

                return (
                  <View
                    key={msg.id}
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: isUser ? '80%' : '88%',
                    }}
                  >
                    {/* Bot avatar */}
                    {!isUser && (
                      <View style={{ marginBottom: 4 }}>
                        <Mascota size="sm" />
                      </View>
                    )}
                    <View style={{
                      backgroundColor: isUser ? brand.orange : colors.card,
                      borderRadius: 18,
                      borderBottomRightRadius: isUser ? 4 : 18,
                      borderBottomLeftRadius: isUser ? 18 : 4,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderWidth: isUser ? 0 : 1,
                      borderColor: msg.isError ? '#F8717140' : colors.border,
                    }}>
                      <AssistantText
                        text={msg.content}
                        isUser={isUser}
                        isError={msg.isError}
                      />
                    </View>
                    <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 3, alignSelf: isUser ? 'flex-end' : 'flex-start', fontSize: 10 }}>
                      {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Input bar ── */}
      <View style={{
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.bg,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}>
        <View style={{ alignSelf: 'center', width: maxW, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          <View style={{
            flex: 1,
            backgroundColor: colors.cardAlt,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 16,
            paddingVertical: 10,
            minHeight: 44,
            justifyContent: 'center',
          }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={{
                ...typography.body,
                color: colors.text,
                fontSize: 14,
                maxHeight: 100,
                backgroundColor: 'transparent',
                padding: 0,
                margin: 0,
                outlineStyle: 'none',
              } as any}
              onSubmitEditing={() => handleSend(input)}
              blurOnSubmit={false}
            />
          </View>
          <TouchableOpacity
            onPress={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.8}
            style={{
              width: 44, height: 44,
              borderRadius: 22,
              backgroundColor: input.trim() && !isLoading ? brand.orange : colors.cardAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={18} color={input.trim() && !isLoading ? '#fff' : colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
