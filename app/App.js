import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Animated, Dimensions, StyleSheet, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Fraunces_500Medium, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import * as SplashScreen from 'expo-splash-screen';

import ConverterScreen from './src/screens/ConverterScreen';
import SavedScreen from './src/screens/SavedScreen';
import SaveSheet from './src/screens/SaveSheet';
import SettingsSheet from './src/screens/SettingsSheet';
import PaywallSheet from './src/screens/PaywallSheet';
import TimerStack from './src/components/TimerBar';
import TimerScreen from './src/screens/TimerScreen';
import AnimatedSplash from './src/components/AnimatedSplash';
import { ThemeProvider, useTheme, useStyles } from './src/theme';
import { convert, fToC, FOOD_PRESETS } from './src/convert';
import { loadState, saveState } from './src/storage';
import { useCookTimers } from './src/timer';
import { IapProvider, useIap } from './src/iap';
import { initAds } from './src/ads';
import { capture, setAnalyticsEnabled } from './src/analytics';
import { recordTimerCompletion } from './src/review';
import { recordCompletionForSoftPaywall } from './src/softPaywall';
import './src/i18n';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions?.({ duration: 250, fade: true });

export default function App() {
  const [mode, setMode] = useState('light');
  return (
    <SafeAreaProvider>
      <ThemeProvider mode={mode} setMode={setMode}>
        <IapProvider>
          <Root themeMode={mode} setThemeMode={setMode} />
          <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        </IapProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function Root({ themeMode, setThemeMode }) {
  const { C } = useTheme();
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
    onShake: (t) => showToast(`Shake halfway · ${t.label || 'cooking'}`),
    onDone: (t) => onTimerDoneRef.current?.(t),
  });

  softPaywallGate.current = {
    isPro,
    openTimerId,
    splashGone,
    showSettings,
    showPaywall,
    timers: cookTimers.list,
  };

  onTimerDoneRef.current = (t) => {
    capture('timer_completed', {
      duration_bucket: durationBucket(t.totalSec),
    });
    showToast(`Done · ${t.label || 'cook timer'}`);

    const g = softPaywallGate.current;
    const hasRunning = (g.timers || []).some(
      (x) => x.id !== t.id && !x.completed,
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
  const openTimer = openTimerId
    ? cookTimers.list.find((t) => t.id === openTimerId)
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
      setHydrated(true);
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
      themeMode,
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
    themeMode,
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

  // Hide the splash as soon as fonts are ready; AsyncStorage hydration
  // continues in the background and items pop in when ready.
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  // Defer ATT + AdMob init until the splash is fully dismissed.
  // Requesting ATT while another view is animating causes iOS to silently
  // drop the system permission dialog (caught in App Review on iPad).
  useEffect(() => {
    if (splashGone) initAds();
  }, [splashGone]);

  const screenW = Dimensions.get('window').width;
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(slide, {
      toValue: view === 'saved' ? 1 : 0,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [view, slide]);

  const result = convert(ovenTemp, unit, ovenTime, direction);
  const isOvenToAir = direction === 'oven-to-air';
  const ovenValues = isOvenToAir
    ? { temp: ovenTemp, time: ovenTime }
    : { temp: result.temp, time: result.time };
  const airValues = isOvenToAir
    ? { temp: result.temp, time: result.time }
    : { temp: ovenTemp, time: ovenTime };

  const startTimer = (minutes, label, source) => {
    const id = cookTimers.start(minutes, label);
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
      name: guess ? guess.name : '',
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
      `${newItem.emoji} ${newItem.name || 'Recipe'}`,
      'recipe_save',
    );
    showToast('Saved to recipes');
  };
  const doDelete = (id) => {
    setItems(items.filter(i => i.id !== id));
    capture('recipe_deleted', {
      saved_recipe_count: Math.max(0, items.length - 1),
    });
  };

  if (!fontsLoaded) return null;

  const converterTx = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -screenW],
  });
  const savedTx = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [screenW, 0],
  });

  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 16 : 8);
  const bottomInset = insets.bottom;

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
            startTimer(min, `Air fryer ${airValues.temp}°${unit}`, 'converter');
          }}
          topInset={topInset}
          bottomInset={cookTimers.list.length > 0 ? 90 : 0}
        />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: savedTx }] }]}>
        <SavedScreen
          items={items}
          onClose={() => setView('converter')}
          onDelete={doDelete}
          onStart={(item, mode) => {
            const isAir = mode !== 'oven';
            const minutes = isAir ? item.afTime : item.ovenTime;
            const label = `${item.emoji} ${item.name || 'Recipe'}${isAir ? '' : ' · oven'}`;
            startTimer(minutes, label, 'saved_recipe');
            showToast(`Timer · ${item.name || 'recipe'}`);
          }}
          unit={unit}
          topInset={topInset}
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

      {!splashGone && fontsLoaded && (
        <AnimatedSplash onDone={() => setSplashGone(true)} />
      )}

      {toast && (
        <View pointerEvents="none" style={[
          styles.toastWrap,
          {
            bottom:
              (cookTimers.list.length > 0
                ? Math.min(cookTimers.list.length, 3) * 78 + 32
                : 56) + bottomInset,
          },
        ]}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      )}
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
  toastWrap: {
    position: 'absolute',
    left: 0, right: 0,
    alignItems: 'center',
  },
  toast: {
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
    fontWeight: '500',
  },
});
