import { HStack, VStack, Text, ProgressView, Spacer } from '@expo/ui/swift-ui';
import {
  font, foregroundStyle, padding, tint, frame, monospacedDigit, labelsHidden,
  multilineTextAlignment, progressViewStyle,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity } from 'expo-widgets';

// The iPhone's Live Activity for what is cooking: the lock screen banner and
// the Dynamic Island. One per timer, or one per "finish together" plan.
//
// props: { title, startAt, endAt, foods: [{ label, startAt, endAt }] }, times
// in milliseconds. Every clock here is drawn by the system from those times,
// so it keeps counting with the app closed. A food that goes in later shows
// its full time until its moment comes, then counts down by itself.
//
// This function runs outside the app, in the widget's own runtime: it can use
// only what is declared inside it and the SwiftUI parts imported above.
const CookActivity = (props) => {
  'widget';
  const ACCENT = '#E27849';
  const range = (from, to) => ({ lower: new Date(from), upper: new Date(to) });
  const whole = range(props.startAt, props.endAt);
  const isPlan = props.foods.length > 1;

  const ring = (from, to, size) => (
    <ProgressView
      timerInterval={range(from, to)}
      countsDown={false}
      // The system draws its own small clock inside the ring; the clear,
      // tiny type hides it, since the time is already shown beside it.
      modifiers={[
        progressViewStyle('circular'), labelsHidden(), tint(ACCENT),
        font({ size: 1 }), foregroundStyle('#00000000'),
        frame({ width: size, height: size }),
      ]}
    />
  );
  const clock = (interval, size, width) => (
    <Text
      timerInterval={interval}
      modifiers={[
        font({ size, weight: 'semibold' }), monospacedDigit(),
        multilineTextAlignment('trailing'), frame({ width }),
      ]}
    />
  );
  const rows = props.foods.map((food) => (
    <HStack key={food.label + food.startAt} spacing={10}>
      {ring(food.startAt, food.endAt, 20)}
      <Text modifiers={[font({ size: 15, weight: 'medium' })]}>{food.label}</Text>
      <Spacer />
      {clock(range(food.startAt, food.endAt), 17, 64)}
    </HStack>
  ));

  return {
    banner: (
      <VStack spacing={10} modifiers={[padding({ all: 16 })]}>
        <HStack spacing={10}>
          {!isPlan && ring(props.startAt, props.endAt, 24)}
          <Text modifiers={[font({ size: 16, weight: 'semibold' })]}>{props.title}</Text>
          <Spacer />
          {clock(whole, isPlan ? 17 : 24, isPlan ? 64 : 88)}
        </HStack>
        {isPlan && rows}
      </VStack>
    ),
    compactLeading: ring(props.startAt, props.endAt, 20),
    compactTrailing: (
      <Text
        timerInterval={whole}
        modifiers={[
          font({ size: 14, weight: 'semibold' }), monospacedDigit(), foregroundStyle(ACCENT),
          multilineTextAlignment('trailing'), frame({ width: 46 }),
        ]}
      />
    ),
    minimal: ring(props.startAt, props.endAt, 20),
    expandedLeading: (
      <VStack modifiers={[padding({ leading: 6, top: 4 })]}>
        {ring(props.startAt, props.endAt, 28)}
      </VStack>
    ),
    expandedCenter: (
      <Text modifiers={[font({ size: 15, weight: 'semibold' })]}>{props.title}</Text>
    ),
    expandedTrailing: (
      <VStack modifiers={[padding({ trailing: 6, top: 4 }), foregroundStyle(ACCENT)]}>
        {clock(whole, 20, 72)}
      </VStack>
    ),
    expandedBottom: isPlan ? (
      <VStack spacing={8} modifiers={[padding({ horizontal: 8, bottom: 6 })]}>{rows}</VStack>
    ) : null,
  };
};

export default createLiveActivity('CookActivity', CookActivity);
