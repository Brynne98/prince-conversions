import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet, findNodeHandle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { FONT, useTheme, useStyles } from '../theme';
import { ArrowBack, Back, Search, Trash } from '../icons';
import { RoundButton, Segmented, confirmDestructive } from '../primitives';
import { GLASS, M3, GlassSurface } from '../glass';
import { BannerAd } from '../ads';
import { cToF, fToC, formatMinutesShort } from '../convert';

export default function SavedScreen({ items, onClose, onDelete, onStart, unit, topInset = 0 }) {
  const { C, mode } = useTheme();
  const styles = useStyles(makeStyles);
  const [query, setQuery] = useState('');
  const [displayUnit, setDisplayUnit] = useState(unit);
  const [displayMode, setDisplayMode] = useState('air'); // 'oven' | 'air'
  const filtered = useMemo(
    () => items.filter(i => i.name.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  );

  const count = `${items.length} ${items.length === 1 ? 'recipe' : 'recipes'}`;
  const unitToggle = (
    <Segmented
      compact
      options={[{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }]}
      value={displayUnit}
      onChange={setDisplayUnit}
    />
  );
  const modeToggle = (
    <Segmented
      compact
      options={[{ value: 'air', label: M3 ? 'Air' : 'Air fryer' }, { value: 'oven', label: 'Oven' }]}
      value={displayMode}
      onChange={setDisplayMode}
    />
  );
  const searchBar = (
    <GlassSurface clear style={styles.searchBar}>
      <Search s={M3 ? 24 : 18} c={M3 ? C.ink70 : undefined} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search recipes"
        placeholderTextColor={M3 ? C.ink70 : C.ink50}
        style={styles.searchInput}
        autoCorrect={false}
        autoCapitalize="none"
        keyboardAppearance={mode}
      />
    </GlassSurface>
  );

  return (
    <View style={[styles.root, { paddingTop: topInset }]}>
      <View style={styles.topBar}>
        <RoundButton onPress={onClose} size={44} accessibilityLabel="Back">
          {M3 ? <ArrowBack s={22} /> : <Back s={20} />}
        </RoundButton>
        <Text style={styles.topTitle}>My Recipes</Text>
        <View style={{ width: 44 }} />
      </View>

      {M3 ? (
        // Material order: the search bar leads, the filters sit under it.
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {searchBar}
          <View style={styles.toggleRow}>
            <Text style={styles.subtitle}>{count}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>{unitToggle}{modeToggle}</View>
          </View>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <Text style={styles.bigTitle}>Saved</Text>
          <Text style={styles.subtitle}>{count}</Text>
          <View style={styles.toggleRow}>{unitToggle}{modeToggle}</View>
          {searchBar}
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: M3 ? 16 : 20, paddingTop: M3 ? 12 : 14, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 44, marginBottom: 8 }}>🥘</Text>
            <Text style={styles.emptyTitle}>Nothing saved yet</Text>
            <Text style={styles.emptyBody}>
              Convert a recipe and tap “Save” to keep{'\n'}your perfect time and temperature.
            </Text>
          </View>
        ) : (
          <View style={{ gap: M3 ? 2 : 10 }}>
            {filtered.map((it, i) => (
              <SavedRow
                key={it.id}
                item={it}
                unit={displayUnit}
                mode={displayMode}
                first={i === 0}
                last={i === filtered.length - 1}
                onDelete={(e) => {
                  confirmDestructive({
                    title: `Delete “${it.name}”?`,
                    message: 'This can’t be undone.',
                    confirmLabel: 'Delete',
                    // iOS 26 grows the sheet out of the bin button.
                    anchor: findNodeHandle(e?.currentTarget) ?? undefined,
                    onConfirm: () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onDelete(it.id);
                    },
                  });
                }}
                onStart={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onStart?.(it, displayMode);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.stickyBanner}>
        <BannerAd placement="saved_sticky" />
      </View>
    </View>
  );
}

function SavedRow({ item, unit, mode, onDelete, onStart, first, last }) {
  const { C } = useTheme();
  const styles = useStyles(makeStyles);
  const conv = (val) => item.unit === unit ? val : (unit === 'F' ? cToF(val) : fToC(val));
  const isAir = mode === 'air';
  const temp = conv(isAir ? item.afTemp : item.ovenTemp);
  const time = isAir ? item.afTime : item.ovenTime;
  const tagBg = isAir ? C.terracottaSoft : C.creamDeep;
  const tagFg = isAir ? C.terracottaDeep : C.ink70;
  const label = isAir ? 'Air' : 'Oven';

  const summary = `${label} ${temp}°${unit} · ${formatMinutesShort(time)}`;

  // Android: a Material list item. The rows join into one group, rounded at
  // its two ends, with the detail as plain supporting text.
  if (M3) {
    return (
      <Pressable
        onPress={onStart}
        android_ripple={{ color: C.ink10, foreground: true }}
        style={[
          styles.row,
          first && { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
          last && { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
        ]}
      >
        <View style={[styles.rowEmojiBox, { backgroundColor: tagBg }]}>
          <Text style={styles.rowEmoji}>{item.emoji}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.rowSupport}>{summary}</Text>
          {!!item.note && <Text style={styles.rowSupport} numberOfLines={1}>{item.note}</Text>}
        </View>
        <RoundButton onPress={onDelete} tone="plain" accessibilityLabel={`Delete ${item.name}`}>
          <Trash s={22} />
        </RoundButton>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onStart}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={[styles.rowEmojiBox, { backgroundColor: tagBg }]}>
        <Text style={styles.rowEmoji}>{item.emoji}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.tagRow}>
          <View style={[styles.tag, { backgroundColor: tagBg }]}>
            <Text style={[styles.tagText, { color: tagFg }]}>{summary}</Text>
          </View>
        </View>
        {!!item.note && (
          <Text style={styles.note}>“{item.note}”</Text>
        )}
      </View>
      <RoundButton onPress={onDelete} size={40} tone="flat" accessibilityLabel={`Delete ${item.name}`}>
        <Trash s={18} />
      </RoundButton>
    </Pressable>
  );
}

const makeStyles = (C) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topTitle: {
    fontFamily: FONT.ui,
    fontSize: 16,
    fontWeight: '600',
    color: C.ink,
  },
  bigTitle: {
    fontFamily: FONT.display,
    fontSize: 32,
    fontWeight: '500',
    color: C.ink,
    letterSpacing: -0.5,
  },
  subtitle: M3 ? {
    fontFamily: FONT.ui,
    fontSize: 14,
    color: C.ink70,
  } : {
    fontFamily: FONT.ui,
    fontSize: 14,
    color: C.ink50,
    marginTop: 2,
  },
  toggleRow: {
    marginTop: M3 ? 12 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  // Android: Material's search bar, 56dp and fully round.
  searchBar: M3 ? {
    backgroundColor: C.surfaceHigh,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    height: 56,
  } : {
    marginTop: 12,
    backgroundColor: C.paper,
    // A glass capsule on iOS 26, like Apple's search fields.
    borderRadius: GLASS ? 22 : 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: GLASS ? 16 : 12,
    height: GLASS ? 44 : 40,
    borderWidth: 0.5,
    borderColor: C.ink10,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT.ui,
    fontSize: 15,
    color: C.ink,
    padding: 0,
  },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyTitle: M3 ? {
    fontFamily: FONT.ui,
    fontSize: 20,
    lineHeight: 26,
    color: C.ink,
  } : {
    fontFamily: FONT.display,
    fontSize: 20,
    fontWeight: '500',
    color: C.ink,
  },
  emptyBody: {
    fontFamily: FONT.ui,
    fontSize: 14,
    color: M3 ? C.ink70 : C.ink50,
    marginTop: 6,
    lineHeight: 20,
    textAlign: 'center',
  },
  row: M3 ? {
    backgroundColor: C.surfaceLow,
    borderRadius: 4,
    minHeight: 72,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  } : {
    backgroundColor: C.paper,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  rowEmojiBox: {
    width: M3 ? 40 : 48,
    height: M3 ? 40 : 48,
    borderRadius: M3 ? 20 : 12,
    backgroundColor: C.terracottaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowEmoji: { fontSize: M3 ? 20 : 24 },
  rowName: M3 ? {
    fontFamily: FONT.ui,
    fontSize: 16,
    lineHeight: 24,
    color: C.ink,
    letterSpacing: 0.15,
  } : {
    fontFamily: FONT.ui,
    fontSize: 16,
    fontWeight: '600',
    color: C.ink,
    letterSpacing: -0.2,
  },
  rowSupport: {
    fontFamily: FONT.ui,
    fontSize: 12,
    lineHeight: 16,
    color: C.ink70,
  },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontFamily: FONT.ui,
    fontSize: 12,
    fontWeight: '600',
  },
  note: {
    fontFamily: FONT.ui,
    fontSize: 12,
    color: C.sage,
    marginTop: 4,
    fontStyle: 'italic',
  },
  stickyBanner: {
    paddingHorizontal: M3 ? 16 : 20,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: C.cream,
  },
});
