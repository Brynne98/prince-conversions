import React from 'react';
import {
  View, Text, Modal, Pressable, StyleSheet,
} from 'react-native';
import { C, FONT } from '../theme';
import { Close } from '../icons';
import { AdSlot } from '../primitives';

export default function SettingsSheet({ visible, onClose }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Close s={16} c={C.ink70} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <Row label="Remove ads" detail="Pro · $2.99" />
          <Row label="About" detail="v1.0.0" isLast />
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <AdSlot label="Ad · 320×50 banner" />
        </View>
      </View>
    </Modal>
  );
}

function Row({ label, detail, isLast }) {
  return (
    <View style={[
      styles.row,
      !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.divider },
    ]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowDetail}>{detail}</Text>
    </View>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: FONT.display,
    fontSize: 22,
    fontWeight: '500',
    color: C.ink,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.ink06,
    alignItems: 'center', justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
  },
  rowLabel: {
    fontFamily: FONT.ui,
    fontSize: 15,
    fontWeight: '500',
    color: C.ink,
  },
  rowDetail: {
    fontFamily: FONT.ui,
    fontSize: 14,
    color: C.ink50,
  },
});
