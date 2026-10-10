import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable,
  StyleSheet, Animated, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { FONT, useTheme, useStyles } from '../theme';
import { Sheet, AppBar, TextButton, Field } from '../primitives';
import { GLASS, M3, GlassPressable } from '../glass';
import { formatMinutes } from '../convert';

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
  const { C } = useTheme();
  const styles = useStyles(makeStyles);
  const valid = (draft.name || '').trim().length > 0 && (draft.emoji || '').trim().length > 0;

  const save = () => {
    if (valid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSave();
    }
  };
  const emojiGrid = (
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
  );
  const summary = (
    <View style={styles.summary}>
      <Text style={styles.summaryKicker}>{M3 ? 'Saving both' : 'SAVING BOTH'}</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          <Text style={{ fontWeight: '700' }}>Oven</Text> {ovenValues.temp}°{unit} · {formatMinutes(ovenValues.time)}
        </Text>
        <Text style={[styles.summaryText, { opacity: 0.5 }]}>↔</Text>
        <Text style={styles.summaryText}>
          <Text style={{ fontWeight: '700' }}>Air fryer</Text> {airValues.temp}°{unit} · {formatMinutes(airValues.time)}
        </Text>
      </View>
    </View>
  );

  // Android: Material's full-screen dialog. Close leads, the one action
  // trails, and the inputs are outlined fields.
  if (M3) {
    return (
      <Sheet visible={visible} onClose={onClose}>
        <AppBar title="Save recipe" leading="close" onLeading={onClose}>
          <View style={{ marginRight: 8 }}>
            <TextButton label="Save" onPress={save} disabled={!valid} />
          </View>
        </AppBar>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.nameEmojiBox}>
              <Text style={styles.nameEmoji}>{draft.emoji || '🍽️'}</Text>
            </View>
            <Field
              label="Recipe name"
              value={draft.name}
              onChangeText={(t) => setDraft({ ...draft, name: t })}
              returnKeyType="done"
              style={{ flex: 1 }}
            />
          </View>
          {emojiGrid}
          <Field
            label="Custom emoji"
            value={draft.emoji}
            onChangeText={(t) => setDraft({ ...draft, emoji: [...t].slice(0, 4).join('') })}
            returnKeyType="done"
          />
          <Field
            label="Notes"
            value={draft.note}
            onChangeText={(t) => setDraft({ ...draft, note: t })}
            returnKeyType="done"
          />
          {summary}
        </ScrollView>
      </Sheet>
    );
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.headerRow}>
        <GlassPressable onPress={onClose} hitSlop={10} style={styles.headerBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </GlassPressable>
        <Text style={styles.title}>Save recipe</Text>
        <GlassPressable
          onPress={save}
          hitSlop={10}
          disabled={!valid}
          // Tinted glass once there is something to save, as Apple's Done.
          tint={valid ? C.terracotta : undefined}
          style={styles.headerBtn}
        >
          <Text style={[
            styles.saveText,
            { color: !valid ? C.ink30 : GLASS ? C.onTerracotta : C.terracotta },
          ]}>Save</Text>
        </GlassPressable>
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

          {emojiGrid}

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

          {summary}
        </ScrollView>
      </KeyboardAvoidingView>
    </Sheet>
  );
}

const makeStyles = (C) => StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  // A glass capsule on iOS 26; a text button with a full-height hit area elsewhere.
  headerBtn: {
    minHeight: 44,
    justifyContent: 'center',
    ...(GLASS ? { paddingHorizontal: 18, borderRadius: 22 } : null),
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
    width: M3 ? 56 : 40, height: M3 ? 56 : 40, borderRadius: M3 ? 28 : 10,
    backgroundColor: C.terracottaSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  nameEmoji: { fontSize: M3 ? 26 : 22 },
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
  gridWrap: M3 ? {
    backgroundColor: C.surfaceLow,
    borderRadius: 16,
    maxHeight: 220,
    flexGrow: 0,
  } : {
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
    borderRadius: M3 ? 20 : 10,
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
    borderRadius: M3 ? 16 : 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
  },
  summaryKicker: {
    fontFamily: FONT.ui,
    fontSize: M3 ? 12 : 10,
    fontWeight: M3 ? '500' : '700',
    color: C.terracottaDeep,
    letterSpacing: M3 ? 0.4 : 1,
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
