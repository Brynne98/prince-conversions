import {
  HStack, VStack, ZStack, Text, ProgressView, Spacer, Capsule,
} from '@expo/ui/swift-ui';
import {
  font, foregroundStyle, padding, tint, frame, monospacedDigit, labelsHidden,
  multilineTextAlignment, progressViewStyle, opacity, lineLimit,
  minimumScaleFactor, activityBackgroundTint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity } from 'expo-widgets';

// The iPhone's Live Activity for what is cooking: the lock screen card and
// the Dynamic Island. One per timer. It is the in-app timer card again: a
// ring, the label, a serif clock, and terracotta once the food is done.
//
// props: { title, startAt, endAt, shake, done, readyAt, endedAt, doneTitle,
// doneShort }. Times are in milliseconds and the rest is wording, handed in
// because nothing can be imported here. Every clock is drawn by the system
// from those times, so it keeps counting with the app closed.
//
// This function runs outside the app, in the widget's own runtime: it can use
// only what is declared inside it and the SwiftUI parts imported above.
const CookActivity = (props, environment) => {
  'widget';
  const ACCENT = '#E27849';
  const CARD = '#2D2218';
  const INK = '#F2E8D8';
  const TERRACOTTA = '#C2562E';
  const CREAM = '#FFF7EE';
  // The system marks the activity stale at the end time, so this turns to
  // done by itself when the app is asleep and cannot say so.
  const done = !!props.done || !!environment?.isStale || Date.now() >= props.endAt;
  // The always-on lock screen: no large bright fill.
  const dimmed = !!environment?.isLuminanceReduced;
  const whole = { lower: new Date(props.startAt), upper: new Date(props.endAt) };
  // The system draws its own small clock with a timed ring or bar; the clear,
  // tiny type hides it, since the time is already shown beside it.
  const noClock = [labelsHidden(), font({ size: 1 }), foregroundStyle('#00000000')];

  const ring = (size, color) => (
    <ProgressView
      {...(done ? { value: 1 } : { timerInterval: whole, countsDown: false })}
      modifiers={[
        progressViewStyle('circular'), tint(color), ...noClock,
        frame({ width: size, height: size }),
      ]}
    />
  );
  const clock = (size, width, color) => (
    <Text
      timerInterval={whole}
      modifiers={[
        font({ size, weight: 'medium', design: 'serif' }), monospacedDigit(),
        foregroundStyle(color), multilineTextAlignment('trailing'),
        lineLimit(1), minimumScaleFactor(0.6), frame({ width }),
      ]}
    />
  );
  // Time passed, with a tick in the middle when a shake reminder is set.
  const bar = (
    <ZStack>
      <ProgressView
        timerInterval={whole}
        countsDown={false}
        modifiers={[progressViewStyle('linear'), tint(ACCENT), ...noClock]}
      />
      {props.shake ? (
        <Capsule modifiers={[foregroundStyle(INK), frame({ width: 2, height: 12 })]} />
      ) : null}
    </ZStack>
  );
  const small = (text, size) => (
    <Text modifiers={[font({ size }), opacity(done ? 0.85 : 0.62), lineLimit(1)]}>{text}</Text>
  );
  // The label, and under it either when it is ready or "Done!".
  const words = (alignment, doneSize) => (
    <VStack alignment={alignment} spacing={1}>
      {small(props.title, 13)}
      {done ? (
        <Text modifiers={[font({ size: doneSize, weight: 'medium', design: 'serif' }), lineLimit(1)]}>
          {props.doneTitle}
        </Text>
      ) : (
        <Text modifiers={[font({ size: 16, weight: 'semibold' }), lineLimit(1), minimumScaleFactor(0.8)]}>
          {props.readyAt}
        </Text>
      )}
    </VStack>
  );

  const filled = done && !dimmed;
  return {
    banner: (
      <VStack
        spacing={12}
        modifiers={[
          padding({ horizontal: 18, vertical: 16 }),
          foregroundStyle(filled ? CREAM : INK),
          activityBackgroundTint(filled ? TERRACOTTA : CARD),
        ]}
      >
        <HStack spacing={10}>
          {ring(38, filled ? CREAM : ACCENT)}
          {words('leading', 30)}
          <Spacer />
          {done ? small(props.endedAt, 13) : clock(38, 112, INK)}
        </HStack>
        {done ? null : bar}
      </VStack>
    ),
    compactLeading: ring(20, ACCENT),
    compactTrailing: done ? (
      <Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundStyle(ACCENT)]}>
        {props.doneShort}
      </Text>
    ) : (
      <Text
        timerInterval={whole}
        modifiers={[
          font({ size: 14, weight: 'semibold' }), monospacedDigit(), foregroundStyle(ACCENT),
          multilineTextAlignment('trailing'), frame({ width: 46 }),
        ]}
      />
    ),
    minimal: ring(20, ACCENT),
    // The words sit in the middle: the side regions are too narrow for them.
    expandedLeading: (
      <VStack modifiers={[padding({ leading: 6, top: 6 })]}>{ring(34, ACCENT)}</VStack>
    ),
    expandedCenter: (
      <VStack modifiers={[padding({ top: 6 }), foregroundStyle('#FFFFFF')]}>
        {words('center', 24)}
      </VStack>
    ),
    expandedTrailing: (
      <VStack modifiers={[padding({ trailing: 6, top: 6 }), foregroundStyle('#FFFFFF')]}>
        {done ? small(props.endedAt, 13) : clock(34, 100, ACCENT)}
      </VStack>
    ),
    expandedBottom: done ? null : (
      <VStack modifiers={[padding({ horizontal: 6, top: 10, bottom: 4 })]}>{bar}</VStack>
    ),
  };
};

export default createLiveActivity('CookActivity', CookActivity);
