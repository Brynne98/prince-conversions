import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Animated, Appearance, BackHandler, Dimensions, PanResponder, StyleSheet, Platform, useColorScheme,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Fraunces_500Medium, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';

import ConverterScreen from './src/screens/ConverterScreen';
import SavedScreen from './src/screens/SavedScreen';
import SaveSheet from './src/screens/SaveSheet';
import SettingsSheet from './src/screens/SettingsSheet';
import PaywallSheet from './src/screens/PaywallSheet';
import TimerStack, { stackHeight } from './src/components/TimerBar';
import TimerScreen from './src/screens/TimerScreen';
import AnimatedSplash from './src/components/AnimatedSplash';
import { ThemeProvider, useTheme, useStyles, useReduceMotion, GROW } from './src/theme';
import { M3 } from './src/glass';
import { DialogHost } from './src/primitives';
import { convert, fToC, FOOD_PRESETS } from './src/convert';
import { loadState, saveState } from './src/storage';
import { useCookTimers } from './src/timer';
import { syncCookActivities } from './src/liveActivity';
import { IapProvider, useIap } from './src/iap';
import { initAds } from './src/ads';
import { capture, setAnalyticsEnabled } from './src/analytics';
import { recordTimerCompletion } from './src/review';
import { recordCompletionForSoftPaywall } from './src/softPaywall';
import { t } from './src/i18n';

SplashScreen.preventAutoHideAsync().catch(() => {});
// Expo Go has its own splash screen and only warns when asked to change it.
if (Constants.executionEnvironment !== 'storeClient') {
  // Short: the layer underneath is the same picture on the same colour.
  SplashScreen.setOptions?.({ duration: 100, fade: true });
}

export default function App() {
  // The owner's pick in Settings. Until there is one, follow the phone.
  const [choice, setChoice] = useState(null);
  const phone = useColorScheme();
  const mode = choice ?? (phone === 'dark' ? 'dark' : 'light');
  return (
    <SafeAreaProvider>
      <ThemeProvider mode={mode} setMode={setChoice}>
        <IapProvider>
          <Root themeChoice={choice} />
          <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        </IapProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function Root({ themeChoice }) {
  const { C, mode: themeMode, setMode: setThemeMode } = useTheme();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [hydrated, setHydrated] = useState(false);

  const [unit, setUnit] = useState('F');
  const [targetUnit, setTargetUnit] = useState('F');
  const [ovenTemp, setOvenTemp] = useState(425);
  const [ovenTime, setOvenTime] = useState(25);
  const [direction, setDirection] = useState('oven-to-air');
  const [items, setItems] = useState([]);
  const [analyticsEnabled, setAnalyticsPreference] = useState(true);

  const [view, setView] = useState('converter');
  const [showSave, setShowSave] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallSurface, setPaywallSurface] = useState('paywall');
  const [openTimerId, setOpenTimerId] = useState(null);
  const { isPro } = useIap();
  const [splashGone, setSplashGone] = useState(false);
  const [draft, setDraft] = useState({ name: '', emoji: '🍟', note: '' });
  const [toast, setToast] = useState(null);
  const appOpenTracked = useRef(false);
  const lastTrackedConversion = useRef(null);

  const showToast = (msg, ms = 1800) => {
    setToast(msg);
    setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), ms);
  };

  // Keep soft-paywall gates fresh without rebinding useCookTimers every render.
  const softPaywallGate = useRef({});
  const onTimerDoneRef = useRef(() => {});

  const cookTimers = useCookTimers({
    onShake: (timer) => showToast(
      t('timer.toast_shake', { label: timer.label || t('timer.toast_shake_fallback') }),
    ),
    onDone: (timer) => onTimerDoneRef.current?.(timer),
  });

  softPaywallGate.current = {
    isPro,
    openTimerId,
    splashGone,
    showSettings,
    showPaywall,
    timers: cookTimers.list,
  };

  onTimerDoneRef.current = (timer) => {
    capture('timer_completed', {
      duration_bucket: durationBucket(timer.totalSec),
    });
    showToast(t('timer.toast_done', { label: timer.label || t('timer.fallback_label') }));

    const g = softPaywallGate.current;
    const hasRunning = (g.timers || []).some(
      (x) => x.id !== timer.id && !x.completed,
    );
    const canShowSoftPaywall = !g.openTimerId && !hasRunning;

    recordCompletionForSoftPaywall({
      isPro: !!g.isPro,
      canShow: canShowSoftPaywall && g.splashGone && !g.showSettings && !g.showPaywall,
      onOffer: () => {
        setPaywallSurface('soft_prompt');
        setShowPaywall(true);
      },
    }).then(({ offered }) => {
      // Avoid stacking review + soft paywall in the same moment.
      if (!offered) recordTimerCompletion();
    });
  };
  // The lock screen, Dynamic Island and Android's notification follow the
  // timers: resync whenever one starts, ends, restarts, is cancelled or has
  // its reminders changed, not on every tick.
  const activitySig = cookTimers.list
    .map((x) => [
      x.id, x.startedAt, x.endsAt, x.completed, x.label,
      x.remindHalfway, x.halfFired, !!x.notificationIds,
    ].join(':'))
    .join('|');
  useEffect(() => {
    syncCookActivities(cookTimers.list);
  }, [activitySig]);

  const openTimer = openTimerId
    ? cookTimers.list.find((x) => x.id === openTimerId)
    : null;
  useEffect(() => {
    if (openTimerId && !openTimer) setOpenTimerId(null);
  }, [openTimerId, openTimer]);

  const [fontsLoaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
  });

  useEffect(() => {
    (async () => {
      // The system splash waits for this, so it must always be reached.
      try {
        const s = await loadState();
        if (s) {
          if (s.unit) setUnit(s.unit);
          if (s.targetUnit) setTargetUnit(s.targetUnit);
          else if (s.unit) setTargetUnit(s.unit); // migrate single-unit users
          if (typeof s.ovenTemp === 'number') setOvenTemp(s.ovenTemp);
          if (typeof s.ovenTime === 'number') setOvenTime(s.ovenTime);
          if (s.direction) setDirection(s.direction);
          if (Array.isArray(s.items)) setItems(s.items);
          if (s.themeMode === 'dark' || s.themeMode === 'light') setThemeMode(s.themeMode);
          if (typeof s.analyticsEnabled === 'boolean') {
            setAnalyticsPreference(s.analyticsEnabled);
          }
        }
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState({
      unit,
      targetUnit,
      ovenTemp,
      ovenTime,
      direction,
      items,
      // Only a pick is saved: saving the phone's setting would freeze it.
      themeMode: themeChoice,
      analyticsEnabled,
    });
  }, [
    hydrated,
    unit,
    targetUnit,
    ovenTemp,
    ovenTime,
    direction,
    items,
    themeChoice,
    analyticsEnabled,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    let active = true;

    (async () => {
      await setAnalyticsEnabled(analyticsEnabled);
      if (active && analyticsEnabled && !appOpenTracked.current) {
        appOpenTracked.current = true;
        capture('app_opened', { saved_recipe_count: items.length });
      }
    })();

    return () => { active = false; };
  }, [hydrated, analyticsEnabled]);

  useEffect(() => {
    if (!hydrated) return undefined;

    const signature = [direction, unit, targetUnit, ovenTemp, ovenTime].join(':');
    if (lastTrackedConversion.current === null) {
      lastTrackedConversion.current = signature;
      return undefined;
    }
    if (signature === lastTrackedConversion.current) return undefined;

    const timeout = setTimeout(() => {
      lastTrackedConversion.current = signature;
      capture('conversion_completed', {
        direction,
        source_unit: unit,
        target_unit: targetUnit,
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [hydrated, direction, unit, targetUnit, ovenTemp, ovenTime]);

  // Hide the system splash once the saved settings are in, so the layer that
  // takes over knows whether the app is light or dark. It does not wait for
  // the fonts: that layer uses none, and plays while they load.
  useEffect(() => {
    if (hydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [hydrated]);

  // Tell the system the owner's pick, so what it draws itself (a sheet's rim,
  // a permission prompt) matches. With no pick the system already agrees.
  // Not before the splash is gone: the system splash follows the phone's
  // setting and would switch under it.
  useEffect(() => {
    if (splashGone && themeChoice) Appearance.setColorScheme(themeChoice);
  }, [splashGone, themeChoice]);

  // Defer ATT + AdMob init until the splash is fully dismissed.
  // Requesting ATT while another view is animating causes iOS to silently
  // drop the system permission dialog (caught in App Review on iPad).
  useEffect(() => {
    if (splashGone) initAds();
  }, [splashGone]);

  const screenW = Dimensions.get('window').width;
  const slide = useRef(new Animated.Value(0)).current;
  const still = useReduceMotion();
  const slideTo = (toValue) => Animated.timing(slide, {
    toValue,
    duration: still ? 0 : 320,
    useNativeDriver: true,
  }).start();
  useEffect(() => {
    slideTo(view === 'saved' ? 1 : 0);
  }, [view, slide]); // eslint-disable-line react-hooks/exhaustive-deps

  // iPhone: a drag from the left edge pulls Saved recipes back off, as the
  // system's own back swipe does. Past a third of the way, or flicked, it
  // goes; otherwise it settles back.
  const slideToRef = useRef(slideTo);
  slideToRef.current = slideTo;
  const edgeSwipe = useRef(PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, g) => g.x0 < 24 && g.dx > 8 && g.dx > Math.abs(g.dy) * 2,
    // A drag that starts while the screen is still sliding in takes over from it.
    onPanResponderGrant: () => slide.stopAnimation(),
    onPanResponderMove: (_, g) => slide.setValue(1 - Math.min(1, Math.max(0, g.dx / screenW))),
    onPanResponderRelease: (_, g) => {
      if (g.dx > screenW / 3 || g.vx > 0.5) setView('converter');
      else slideToRef.current(1);
    },
    onPanResponderTerminate: () => slideToRef.current(1),
  })).current;

  // Android's back button leaves Saved recipes for the main screen, not the
  // app. The pages that open over a screen close themselves.
  useEffect(() => {
    if (view !== 'saved') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setView('converter');
      return true;
    });
    return () => sub.remove();
  }, [view]);

  const result = convert(ovenTemp, unit, ovenTime, direction);
  const isOvenToAir = direction === 'oven-to-air';
  const ovenValues = isOvenToAir
    ? { temp: ovenTemp, time: ovenTime }
    : { temp: result.temp, time: result.time };
  const airValues = isOvenToAir
    ? { temp: result.temp, time: result.time }
    : { temp: ovenTemp, time: ovenTime };

  // Every start says so, wherever it came from.
  const startTimer = (minutes, label, source, message) => {
    const id = cookTimers.start(minutes, label);
    showToast(message ?? t('timer.toast_started', { name: label }));
    capture('timer_started', {
      source,
      duration_bucket: durationBucket(Math.round(minutes * 60)),
      active_timer_count: cookTimers.list.length + 1,
    });
    return id;
  };

  const openSave = () => {
    capture('recipe_save_opened', {
      direction,
      source_unit: unit,
      target_unit: targetUnit,
    });
    const guess = FOOD_PRESETS.find(
      p => Math.abs((unit === 'F' ? p.tempF : fToC(p.tempF)) - ovenValues.temp) < 5
        && Math.abs(p.time - ovenValues.time) < 5,
    );
    setDraft({
      name: guess ? t(`presets.${guess.id}`) : '',
      emoji: guess ? guess.emoji : '🍟',
      note: '',
    });
    setShowSave(true);
  };
  const doSave = () => {
    const newItem = {
      id: 's' + Date.now(),
      name: draft.name.trim(),
      emoji: draft.emoji || '🍽️',
      unit,
      ovenTemp: ovenValues.temp,
      ovenTime: ovenValues.time,
      afTemp: airValues.temp,
      afTime: airValues.time,
      note: draft.note.trim(),
    };
    setItems([newItem, ...items]);
    setShowSave(false);
    capture('recipe_saved', { saved_recipe_count: items.length + 1 });
    startTimer(
      airValues.time,
      `${newItem.emoji} ${newItem.name || t('saved.recipe_fallback')}`,
      'recipe_save',
      t('saved.toast_saved'),
    );
  };
  const doDelete = (id) => {
    setItems(items.filter(i => i.id !== id));
    capture('recipe_deleted', {
      saved_recipe_count: Math.max(0, items.length - 1),
    });
  };

  // The key keeps it one layer, and its animation running, when the screens
  // join it under the same root.
  const splash = !splashGone && hydrated && (
    <AnimatedSplash key="splash" ready={fontsLoaded} onDone={() => setSplashGone(true)} />
  );
  if (!fontsLoaded) return <View style={styles.root}>{splash}</View>;

  const converterTx = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -screenW],
  });
  const savedTx = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [screenW, 0],
  });

  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 16 : 8);
  // Room at the foot of a scrolling screen for the system's bar (Android's
  // buttons, the iPhone's home line) and for the running timers above it.
  // The screens fill the display edge to edge, so nothing else leaves it.
  const bottomInset = insets.bottom;
  const timersInset = bottomInset
    + (cookTimers.list.length > 0 ? stackHeight(cookTimers.list) + 20 : 0);

  return (
    <View style={[styles.root, { paddingBottom: bottomInset }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: converterTx }] }]}>
        <ConverterScreen
          unit={unit} setUnit={setUnit}
          targetUnit={targetUnit} setTargetUnit={setTargetUnit}
          ovenTemp={ovenTemp} setOvenTemp={setOvenTemp}
          ovenTime={ovenTime} setOvenTime={setOvenTime}
          direction={direction} setDirection={setDirection}
          onOpenSaved={() => {
            capture('saved_recipes_viewed', { saved_recipe_count: items.length });
            setView('saved');
          }}
          onOpenSettings={() => setShowSettings(true)}
          onSave={openSave}
          onStartTimer={(min) => {
            startTimer(min, t('converter.timer_label', { temp: `${airValues.temp}°${unit}` }), 'converter');
          }}
          topInset={topInset}
          bottomInset={timersInset}
        />
      </Animated.View>

      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: savedTx }] }]}
        {...(Platform.OS === 'ios' ? edgeSwipe.panHandlers : null)}
      >
        <SavedScreen
          items={items}
          onClose={() => setView('converter')}
          onDelete={doDelete}
          onStart={(item, mode) => {
            const isAir = mode !== 'oven';
            const minutes = isAir ? item.afTime : item.ovenTime;
            const label = `${item.emoji} ${item.name || t('saved.recipe_fallback')}${isAir ? '' : ` · ${t('saved.oven_suffix')}`}`;
            startTimer(minutes, label, 'saved_recipe',
              t('timer.toast_started', { name: item.name || t('saved.recipe_fallback') }));
          }}
          unit={unit}
          topInset={topInset}
          bottomInset={timersInset}
        />
      </Animated.View>

      <SaveSheet
        visible={showSave}
        onClose={() => setShowSave(false)}
        onSave={doSave}
        draft={draft}
        setDraft={setDraft}
        ovenValues={ovenValues}
        airValues={airValues}
        unit={unit}
      />

      <SettingsSheet
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        mode={themeMode}
        setMode={setThemeMode}
        analyticsEnabled={analyticsEnabled}
        setAnalyticsEnabled={setAnalyticsPreference}
        onOpenPaywall={() => {
          setShowSettings(false);
          setPaywallSurface('settings');
          setShowPaywall(true);
        }}
      />

      <PaywallSheet
        visible={showPaywall}
        surface={paywallSurface}
        onClose={() => setShowPaywall(false)}
      />

      <TimerStack
        timers={cookTimers.list}
        onPressTimer={(id) => setOpenTimerId(id)}
        onCancel={(id) => {
          cookTimers.cancel(id);
          capture('timer_cancelled', { surface: 'timer_stack' });
        }}
        onRestart={(id) => {
          cookTimers.restart(id);
          capture('timer_restarted', { surface: 'timer_stack' });
        }}
        bottomInset={bottomInset}
      />

      <TimerScreen
        visible={!!openTimer}
        onClose={() => setOpenTimerId(null)}
        onCancel={() => {
          if (!openTimer) return;
          cookTimers.cancel(openTimer.id);
          capture('timer_cancelled', { surface: 'timer_screen' });
        }}
        onRestart={() => {
          if (!openTimer) return;
          cookTimers.restart(openTimer.id);
          capture('timer_restarted', { surface: 'timer_screen' });
        }}
        remainingSec={openTimer?.remainingSec ?? 0}
        elapsedFrac={openTimer?.elapsedFrac ?? 0}
        totalSec={openTimer?.totalSec ?? 0}
        startedAt={openTimer?.startedAt ?? 0}
        label={openTimer?.label}
        completed={!!openTimer?.completed}
        remindHalfway={openTimer?.remindHalfway ?? true}
        onToggleHalfway={(v) => openTimer && cookTimers.update(openTimer.id, { remindHalfway: v })}
      />

      {splash}

      {/* Short messages sit at the top, clear of the buttons that raise them
          and of the timers at the bottom: between the two top-bar buttons on
          iOS, under the app bar on Android. On iOS that gap holds no title a
          message could hide, only the Converter's small label. */}
      {toast && (
        <View pointerEvents="none" style={[styles.toastWrap, { top: topInset + (M3 ? 68 : 8) }]}>
          <View style={styles.toast}>
            <Text style={styles.toastText} numberOfLines={2} maxFontSizeMultiplier={GROW.bar}>{toast}</Text>
          </View>
        </View>
      )}

      <DialogHost />
    </View>
  );
}

function durationBucket(totalSec) {
  if (totalSec < 15 * 60) return 'under_15_min';
  if (totalSec <= 30 * 60) return '15_to_30_min';
  if (totalSec <= 60 * 60) return '31_to_60_min';
  return 'over_60_min';
}

const makeStyles = (C) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream, overflow: 'hidden' },
  toastWrap: M3 ? {
    position: 'absolute',
    left: 16, right: 16,
  } : {
    position: 'absolute',
    left: 76, right: 76,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Android: Material's snackbar. iOS: a pill.
  toast: M3 ? {
    backgroundColor: C.ink,
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 4,
    elevation: 6,
  } : {
    backgroundColor: C.ink,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: C.isDark ? 0.5 : 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  toastText: {
    // C.cream is the page bg color, so on a C.ink (inverse) toast it
    // gives high contrast in both light and dark modes.
    color: C.cream,
    fontSize: 14,
    ...(M3 ? { lineHeight: 20 } : { fontWeight: '500', textAlign: 'center' }),
  },
});
