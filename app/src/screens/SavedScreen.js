import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { FONT, useTheme, useStyles } from '../theme';
import { Back, Search, Trash } from '../icons';
import { RoundButton, Segmented } from '../primitives';
import { BannerAd } from '../ads';
import { cToF, fToC, formatMinutesShort } from '../convert';

export default function SavedScreen({ items, onClose, onDelete, onStart, unit, topInset = 0 }) {
  const { C } = useTheme();
  const styles = useStyles(makeStyles);
  const [query, setQuery] = useState('');
  const [displayUnit, setDisplayUnit] = useState(unit);
  const [displayMode, setDisplayMode] = useState('air'); // 'oven' | 'air'
  const filtered = useMemo(
    () => items.filter(i => i.name.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  );

  const rendered = [];
  filtered.forEach((it, i) => {
    rendered.push({ kind: 'item', it });
    if ((i + 1) % 5 === 0) rendered.push({ kind: 'ad', i });
  });

  return (
    <View style={[styles.root, { paddingTop: topInset }]}>
      <View style={styles.topBar}>
        <RoundButton onPress={onClose} size={40}>
          <Back s={20} />
        </RoundButton>
        <Text style={styles.topTitle}>My Recipes</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
        <Text style={styles.bigTitle}>Saved</Text>
        <Text style={styles.subtitle}>
          {items.length} {items.length === 1 ? 'recipe' : 'recipes'}
        </Text>

        <View style={styles.toggleRow}>
          <Segmented
            compact
            options={[{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }]}
            value={displayUnit}
            onChange={setDisplayUnit}
          />
          <Segmented
            compact
            options={[{ value: 'air', label: 'Air fryer' }, { value: 'oven', label: 'Oven' }]}
            value={displayMode}
            onChange={setDisplayMode}
          />
        </View>

        <View style={styles.searchBar}>
          <Search />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search recipes"
            placeholderTextColor={C.ink50}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 }}
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
          <View style={{ gap: 10 }}>
            {rendered.map((r, idx) => r.kind === 'ad'
              ? <BannerAd key={`ad-${idx}`} />
              : <SavedRow
                  key={r.it.id}
                  item={r.it}
                  unit={displayUnit}
                  mode={displayMode}
                  onDelete={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onDelete(r.it.id);
                  }}
                  onStart={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onStart?.(r.it, displayMode);
                  }}
                />
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.stickyBanner}>
        <BannerAd />
      </View>
    </View>
  );
}

function SavedRow({ item, unit, mode, onDelete, onStart }) {
  const { C } = useTheme();
  const styles = useStyles(makeStyles);
  const conv = (val) => item.unit === unit ? val : (unit === 'F' ? cToF(val) : fToC(val));
  const isAir = mode === 'air';
  const temp = conv(isAir ? item.afTemp : item.ovenTemp);
  const time = isAir ? item.afTime : item.ovenTime;
  const tagBg = isAir ? C.terracottaSoft : C.creamDeep;
  const tagFg = isAir ? C.terracottaDeep : C.ink70;
  const label = isAir ? 'Air' : 'Oven';

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
            <Text style={[styles.tagText, { color: tagFg }]}>
              {label} {temp}°{unit} · {formatMinutesShort(time)}
            </Text>
          </View>
        </View>
        {!!item.note && (
          <Text style={styles.note}>“{item.note}”</Text>
        )}
      </View>
      <Pressable onPress={onDelete} hitSlop={10} style={styles.trashBtn}>
        <Trash s={16} />
      </Pressable>
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
  subtitle: {
    fontFamily: FONT.ui,
    fontSize: 14,
    color: C.ink50,
    marginTop: 2,
  },
  toggleRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  searchBar: {
    marginTop: 12,
    backgroundColor: C.paper,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 40,
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
  emptyTitle: {
    fontFamily: FONT.display,
    fontSize: 20,
    fontWeight: '500',
    color: C.ink,
  },
  emptyBody: {
    fontFamily: FONT.ui,
    fontSize: 14,
    color: C.ink50,
    marginTop: 6,
    lineHeight: 20,
    textAlign: 'center',
  },
  row: {
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
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.terracottaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowEmoji: { fontSize: 24 },
  rowName: {
    fontFamily: FONT.ui,
    fontSize: 16,
    fontWeight: '600',
    color: C.ink,
    letterSpacing: -0.2,
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
  trashBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyBanner: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: C.cream,
  },
});
