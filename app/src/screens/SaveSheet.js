import React, { useEffect, useRef } from 'react';
import {
  View, Text, Modal, ScrollView, TextInput, Pressable,
  StyleSheet, Animated, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { C, FONT } from '../theme';

const EMOJI_OPTS = [
  '🍟','🍗','🐟','🥕','🥓','🍕','🥖','🥔','🧆','🍪','🥩','🌽',
  '🍞','🥐','🥯','🧀','🍳','🥞','🧇','🍔','🌭','🌮','🌯','🥙',
  '🥗','🍝','🍜','🍲','🦐','🦞','🍤','🦀','🥟','🍣','🍱','🍙',
  '🥦','🍆','🍅','🥑','🌶️','🥒','🫑','🍄','🧅','🧄','🍠','🥜',
  '🍎','🍌','🍓','🫐','🍑','🍒','🍐','🍊','🍰','🧁','🥧','🍩',
];

export default function SaveSheet({
  visible, onClose, onSave,
  draft, setDraft,
  ovenValues, airValues, unit,
}) {
  const valid = (draft.name || '').trim().length > 0 && (draft.emoji || '').trim().length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Save recipe</Text>
          <Pressable
            onPress={() => {
              if (valid) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onSave();
              }
            }}
            hitSlop={10}
            disabled={!valid}
          >
            <Text style={[
              styles.saveText,
              { color: valid ? C.terracotta : C.ink30 },
            ]}>Save</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 10 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.namePill}>
              <View style={styles.nameEmojiBox}>
                <Text style={styles.nameEmoji}>{draft.emoji || '🍽️'}</Text>
              </View>
              <TextInput
                value={draft.name}
                onChangeText={(t) => setDraft({ ...draft, name: t })}
                placeholder="Recipe name"
                placeholderTextColor={C.ink50}
                style={styles.nameInput}
                returnKeyType="done"
              />
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Custom emoji</Text>
              <TextInput
                value={draft.emoji}
                onChangeText={(t) => setDraft({ ...draft, emoji: [...t].slice(0, 4).join('') })}
                placeholder="Paste any emoji"
                placeholderTextColor={C.ink50}
                style={styles.emojiInput}
                returnKeyType="done"
              />
            </View>

            <ScrollView
              style={styles.gridWrap}
              contentContainerStyle={styles.grid}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {EMOJI_OPTS.map(e => {
                const active = draft.emoji === e;
                return (
                  <Pressable
                    key={e}
                    onPress={() => {
                      setDraft({ ...draft, emoji: e });
                      Haptics.selectionAsync();
                    }}
                    style={[styles.gridItem, active && { backgroundColor: C.terracottaSoft }]}
                  >
                    <Text style={styles.gridEmoji}>{e}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.notesBox}>
              <TextInput
                value={draft.note}
                onChangeText={(t) => setDraft({ ...draft, note: t })}
                placeholder="Notes — e.g. shake at 10 min, single layer"
                placeholderTextColor={C.ink50}
                style={styles.notesInput}
                returnKeyType="done"
              />
            </View>

            <View style={styles.summary}>
              <Text style={styles.summaryKicker}>SAVING BOTH</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>
                  <Text style={{ fontWeight: '700' }}>Oven</Text> {ovenValues.temp}°{unit} · {ovenValues.time} min
                </Text>
                <Text style={[styles.summaryText, { opacity: 0.5 }]}>↔</Text>
                <Text style={styles.summaryText}>
                  <Text style={{ fontWeight: '700' }}>Air fryer</Text> {airValues.temp}°{unit} · {airValues.time} min
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.ink30,
    alignSelf: 'center',
    marginTop: 8, marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cancelText: { fontFamily: FONT.ui, fontSize: 15, color: C.ink70 },
  title: { fontFamily: FONT.ui, fontSize: 16, fontWeight: '600', color: C.ink },
  saveText: { fontFamily: FONT.ui, fontSize: 15, fontWeight: '600' },
  namePill: {
    backgroundColor: C.paper,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 0.5,
    borderColor: C.ink10,
  },
  nameEmojiBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: C.terracottaSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  nameEmoji: { fontSize: 22 },
  nameInput: {
    flex: 1,
    fontFamily: FONT.ui,
    fontSize: 16,
    color: C.ink,
    fontWeight: '500',
    padding: 0,
  },
  row: {
    backgroundColor: C.paper,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 0.5,
    borderColor: C.ink10,
  },
  rowLabel: {
    fontFamily: FONT.ui,
    fontSize: 13,
    color: C.ink50,
    fontWeight: '500',
  },
  emojiInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 18,
    color: C.ink,
    padding: 0,
  },
  gridWrap: {
    backgroundColor: C.paper,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: C.ink10,
    maxHeight: 220,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 6,
  },
  gridItem: {
    width: `${100 / 8}%`,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  gridEmoji: { fontSize: 22 },
  notesBox: {
    backgroundColor: C.paper,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: C.ink10,
    justifyContent: 'center',
  },
  notesInput: {
    fontFamily: FONT.ui,
    fontSize: 14,
    color: C.ink,
    padding: 0,
  },
  summary: {
    marginTop: 4,
    backgroundColor: C.terracottaSoft,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
  },
  summaryKicker: {
    fontFamily: FONT.ui,
    fontSize: 10,
    fontWeight: '700',
    color: C.terracottaDeep,
    letterSpacing: 1,
    opacity: 0.7,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  summaryText: {
    fontFamily: FONT.ui,
    fontSize: 13,
    color: C.terracottaDeep,
  },
});
