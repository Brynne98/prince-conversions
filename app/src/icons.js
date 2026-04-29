import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from './theme';

// Each icon defaults its stroke / fill color to the active theme so it
// works in both light and dark mode without callers having to pass `c`.

export const Plus = ({ s = 18, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
};

export const Minus = ({ s = 18, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
};

export const Bookmark = ({ s = 18, c, fill = 'none' }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill={fill}>
      <Path d="M6 4h12v17l-6-4-6 4V4z" stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
};

export const List = ({ s = 22, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M4 12h16M4 18h10" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
};

export const Gear = ({ s = 22, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={stroke} strokeWidth={1.8} />
      <Path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"
        stroke={stroke} strokeWidth={1.6}
      />
    </Svg>
  );
};

export const Back = ({ s = 22, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M14 6l-6 6 6 6" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

export const Close = ({ s = 22, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
};

export const Search = ({ s = 18, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink50;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={6} stroke={stroke} strokeWidth={2} />
      <Path d="M20 20l-4-4" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
};

export const Trash = ({ s = 18, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink70;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7 H20" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M9.5 7 V5.5 a1.2 1.2 0 0 1 1.2 -1.2 h2.6 a1.2 1.2 0 0 1 1.2 1.2 V7"
        stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6.4 7 l1 12.6 a2 2 0 0 0 2 1.9 h5.2 a2 2 0 0 0 2 -1.9 l1 -12.6"
        stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10.4 11 V17.6 M13.6 11 V17.6" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
};

export const Flame = ({ s = 18, c }) => {
  const { C } = useTheme();
  const stroke = c || C.terracotta;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3c1 4 5 5 5 10a5 5 0 11-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-9z"
        stroke={stroke} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
};

export const Restart = ({ s = 18, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12 a9 9 0 1 1 -3 -7"
        stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 4 V11 H14"
        stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

export const Bell = ({ s = 14, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M6 16 V11 a6 6 0 0 1 12 0 V16 l1.5 2 H4.5 Z"
        stroke={stroke} strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round" />
      <Path d="M10 19 a2 2 0 0 0 4 0"
        stroke={stroke} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
};

export const Play = ({ s = 14, c }) => {
  const { C } = useTheme();
  const stroke = c || C.terracotta;
  const fill = c || C.terracotta;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill={fill}>
      <Path d="M7 5 L7 19 L19 12 Z" stroke={stroke} strokeWidth={1.2} strokeLinejoin="round" />
    </Svg>
  );
};

export const Swap = ({ s = 14, c }) => {
  const { C } = useTheme();
  const stroke = c || C.terracotta;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 20 L7 4 M3 8 L7 4 L11 8 M17 4 L17 20 M13 16 L17 20 L21 16"
        stroke={stroke}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
