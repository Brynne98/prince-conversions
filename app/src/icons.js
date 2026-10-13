import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from './theme';

// Each icon defaults its stroke / fill color to the active theme so it
// works in both light and dark mode without callers having to pass `c`.

// The one line weight of every drawn icon.
const W = 2;

export const Plus = ({ s = 18, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={stroke} strokeWidth={W} strokeLinecap="round" />
    </Svg>
  );
};

export const Minus = ({ s = 18, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14" stroke={stroke} strokeWidth={W} strokeLinecap="round" />
    </Svg>
  );
};

export const Bookmark = ({ s = 18, c, fill = 'none' }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill={fill}>
      <Path d="M6 4h12v17l-6-4-6 4V4z" stroke={stroke} strokeWidth={W} strokeLinejoin="round" />
    </Svg>
  );
};

export const List = ({ s = 22, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M4 12h16M4 18h10" stroke={stroke} strokeWidth={W} strokeLinecap="round" />
    </Svg>
  );
};

export const Gear = ({ s = 22, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={stroke} strokeWidth={W} />
      <Path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"
        stroke={stroke} strokeWidth={W}
      />
    </Svg>
  );
};

export const Back = ({ s = 22, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M14 6l-6 6 6 6" stroke={stroke} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

// The arrow at the end of a row that opens something.
export const Chevron = ({ s = 16, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5l7 7-7 7" stroke={stroke} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

// What Pro offers: no ads, and a purchase that can be brought back.
export const NoAds = ({ s = 22, c }) => {
  const { C } = useTheme();
  const stroke = c || C.terracotta;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h12a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z" stroke={stroke} strokeWidth={W} />
      <Path d="M18 9l4-2v10l-4-2" stroke={stroke} strokeWidth={W} strokeLinejoin="round" />
      <Path d="M3 21L21 3" stroke={stroke} strokeWidth={W} strokeLinecap="round" />
    </Svg>
  );
};

export const RestorePurchase = ({ s = 22, c }) => {
  const { C } = useTheme();
  const stroke = c || C.terracotta;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12a8 8 0 0114.2-5M20 12a8 8 0 01-14.2 5" stroke={stroke} strokeWidth={W} strokeLinecap="round" />
      <Path d="M18 3v4h-4M6 21v-4h4" stroke={stroke} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

export const Close = ({ s = 22, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={stroke} strokeWidth={W} strokeLinecap="round" />
    </Svg>
  );
};

export const Search = ({ s = 18, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink50;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={6} stroke={stroke} strokeWidth={W} />
      <Path d="M20 20l-4-4" stroke={stroke} strokeWidth={W} strokeLinecap="round" />
    </Svg>
  );
};

export const Trash = ({ s = 18, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink70;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7 H20" stroke={stroke} strokeWidth={W} strokeLinecap="round" />
      <Path d="M9.5 7 V5.5 a1.2 1.2 0 0 1 1.2 -1.2 h2.6 a1.2 1.2 0 0 1 1.2 1.2 V7"
        stroke={stroke} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6.4 7 l1 12.6 a2 2 0 0 0 2 1.9 h5.2 a2 2 0 0 0 2 -1.9 l1 -12.6"
        stroke={stroke} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10.4 11 V17.6 M13.6 11 V17.6" stroke={stroke} strokeWidth={W} strokeLinecap="round" />
    </Svg>
  );
};

export const Flame = ({ s = 18, c }) => {
  const { C } = useTheme();
  const stroke = c || C.terracotta;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3c1 4 5 5 5 10a5 5 0 11-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-9z"
        stroke={stroke} strokeWidth={W} strokeLinejoin="round" />
    </Svg>
  );
};

export const Restart = ({ s = 18, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12 a9 9 0 1 1 -3 -7"
        stroke={stroke} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 4 V11 H14"
        stroke={stroke} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

export const Bell = ({ s = 14, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M6 16 V11 a6 6 0 0 1 12 0 V16 l1.5 2 H4.5 Z"
        stroke={stroke} strokeWidth={W} strokeLinejoin="round" strokeLinecap="round" />
      <Path d="M10 19 a2 2 0 0 0 4 0"
        stroke={stroke} strokeWidth={W} strokeLinecap="round" />
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
        strokeWidth={W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const ShareIcon = ({ s = 18, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15V4M8 8l4-4 4 4M5 13v6a1 1 0 001 1h12a1 1 0 001-1v-6"
        stroke={stroke}
        strokeWidth={W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Material's back arrow has a stem; Apple's is the bare chevron above.
export const ArrowBack = ({ s = 24, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12H5M11 6l-6 6 6 6" stroke={stroke} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

export const Check = ({ s = 14, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={stroke} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

export const Pencil = ({ s = 12, c }) => {
  const { C } = useTheme();
  const stroke = c || C.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M4 20l4.5-1L19 8.5 15.5 5 5 15.5 4 20z" stroke={stroke} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

// Google's own Material drawings ("list" and "settings"), for Android's
// header. They are filled shapes, not strokes.
export const MaterialList = ({ s = 24, c }) => {
  const { C } = useTheme();
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Path
        d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"
        fill={c || C.ink}
      />
    </Svg>
  );
};

export const MaterialSettings = ({ s = 24, c }) => {
  const { C } = useTheme();
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Path
        d="M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.09-.16-.26-.25-.44-.25-.06 0-.12.01-.17.03l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.06-.02-.12-.03-.18-.03-.17 0-.34.09-.43.25l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.09.16.26.25.44.25.06 0 .12-.01.17-.03l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.06.02.12.03.18.03.17 0 .34-.09.43-.25l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zm-1.98-1.71c.04.31.05.52.05.73 0 .21-.02.43-.05.73l-.14 1.13.89.7 1.08.84-.7 1.21-1.27-.51-1.04-.42-.9.68c-.43.32-.84.56-1.25.73l-1.06.43-.16 1.13-.2 1.35h-1.4l-.19-1.35-.16-1.13-1.06-.43c-.43-.18-.83-.41-1.23-.71l-.91-.7-1.06.43-1.27.51-.7-1.21 1.08-.84.89-.7-.14-1.13c-.03-.31-.05-.54-.05-.74s.02-.43.05-.73l.14-1.13-.89-.7-1.08-.84.7-1.21 1.27.51 1.04.42.9-.68c.43-.32.84-.56 1.25-.73l1.06-.43.16-1.13.2-1.35h1.39l.19 1.35.16 1.13 1.06.43c.43.18.83.41 1.23.71l.91.7 1.06-.43 1.27-.51.7 1.21-1.07.85-.89.7.14 1.13zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
        fill={c || C.ink}
      />
    </Svg>
  );
};
