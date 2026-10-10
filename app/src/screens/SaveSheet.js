import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable,
  StyleSheet, Animated, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { FONT, useTheme, useStyles } from '../theme';
import { Sheet, AppBar, TextButton, Field } from '../primitives';
import { GLASS, M3, cap, GlassPressable } from '../glass';
import { formatMinutes } from '../convert';
import { Pencil } from '../icons';

// One emoji can be several characters joined together: a family, a flag, a
// skin tone. These helpers find where one ends and the next begins.
const isEmojiJoiner = (c) => c === 0xFE0F || c === 0x200D || c === 0x20E3
  || (c >= 0x1F3FB && c <= 0x1F3FF) || (c >= 0xE0020 && c <= 0xE007F);
const isFlagHalf = (c) => c >= 0x1F1E6 && c <= 0x1F1FF;
// The emoji blocks, the older symbols and dingbats, or anything the keyboard
// marked to be drawn as emoji (which is how 1️⃣ and ©️ arrive).
const isEmoji = (g) => {
  const c = g.codePointAt(0);
  return (c >= 0x1F000 && c <= 0x1FAFF) || (c >= 0x2600 && c <= 0x27BF) || g.includes('\uFE0F');
};

// The last whole emoji in `text`, or '' when it holds none. Letters, digits
// and punctuation do not count, in any script.
function lastEmoji(text) {
  const groups = [];
  for (const ch of text) {
    const c = ch.codePointAt(0);
    const g = groups[groups.length - 1];
    const joins = g && (
      isEmojiJoiner(c)
      || g.endsWith('\u200D')
      || (isFlagHalf(c) && [...g].length === 1 && isFlagHalf(g.codePointAt(0)))
    );
    if (joins) groups[groups.length - 1] = g + ch;
    else groups.push(ch);
  }
  return groups.reverse().find(isEmoji) || '';
}

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
  const { C, mode } = useTheme();
  const styles = useStyles(makeStyles);
  const valid = (draft.name || '').trim().length > 0 && (draft.emoji || '').trim().length > 0;

  // A person's own emoji: tapping the emoji opens the keyboard on a hidden
  // field. Neither platform lets an app open the emoji keyboard itself.
  const emojiField = useRef(null);
  const [typing, setTyping] = useState(false);
  const typeEmoji = (text) => {
    // A deletion keeps the emoji: a recipe always has one.
    if (text.length <= draft.emoji.length) return;
    // The field holds the current emoji, so the last one in it is the newest.
    const next = lastEmoji(text);
    if (next && next !== draft.emoji) {
      setDraft({ ...draft, emoji: next });
      Haptics.selectionAsync();
    }
  };
  const emojiButton = (
    <Pressable
      onPress={() => emojiField.current?.focus()}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel="Type your own emoji"
      style={[styles.nameEmojiBox, typing && styles.nameEmojiTyping]}
    >
      <Text style={styles.nameEmoji}>{draft.emoji || '🍽️'}</Text>
      <View style={styles.emojiBadge}>
        <Pencil s={11} c={C.onTerracotta} />
      </View>
      <TextInput
        ref={emojiField}
        value={draft.emoji}
        onChangeText={typeEmoji}
        onFocus={() => setTyping(true)}
        onBlur={() => setTyping(false)}
        pointerEvents="none"
        caretHidden
        autoCorrect={false}
        returnKeyType="done"
        keyboardAppearance={mode}
        style={styles.emojiHidden}
      />
    </Pressable>
  );
  const emojiHint = typing && (
    <Text style={styles.emojiHint}>Switch to the emoji keyboard and pick one.</Text>
  );

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
      <Text style={styles.summaryKicker}>{cap('Saving both')}</Text>
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
            {emojiButton}
            <Field
              label="Recipe name"
              value={draft.name}
              onChangeText={(t) => setDraft({ ...draft, name: t })}
              returnKeyType="done"
              keyboardAppearance={mode}
              style={{ flex: 1 }}
            />
          </View>
          {emojiHint}
          {emojiGrid}
          <Field
            label="Notes"
            value={draft.note}
            onChangeText={(t) => setDraft({ ...draft, note: t })}
            returnKeyType="done"
            keyboardAppearance={mode}
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
            {emojiButton}
            <TextInput
              value={draft.name}
              onChangeText={(t) => setDraft({ ...draft, name: t })}
              placeholder="Recipe name"
              placeholderTextColor={C.ink50}
              style={styles.nameInput}
              returnKeyType="done"
              keyboardAppearance={mode}
            />
          </View>

          {emojiHint}

          {emojiGrid}

          <View style={styles.notesBox}>
            <TextInput
              value={draft.note}
              onChangeText={(t) => setDraft({ ...draft, note: t })}
              placeholder="Notes — e.g. shake at 10 min, single layer"
              placeholderTextColor={C.ink50}
              style={styles.notesInput}
              returnKeyType="done"
              keyboardAppearance={mode}
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
  nameEmojiTyping: { borderWidth: 2, borderColor: C.terracotta },
  emojiBadge: {
    position: 'absolute',
    right: M3 ? -2 : -6,
    bottom: M3 ? -2 : -6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.terracotta,
    borderWidth: 2,
    borderColor: M3 ? C.cream : C.paper,
    alignItems: 'center', justifyContent: 'center',
  },
  // Out of sight, but still able to hold the keyboard's focus.
  emojiHidden: { position: 'absolute', width: 1, height: 1, opacity: 0, padding: 0 },
  emojiHint: { fontFamily: FONT.ui, fontSize: 13, color: C.ink50, paddingHorizontal: 4 },
  nameInput: {
    flex: 1,
    fontFamily: FONT.ui,
    fontSize: 16,
    color: C.ink,
    fontWeight: '500',
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
