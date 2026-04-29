import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import Constants from 'expo-constants';

const IS_EXPO_GO = Constants?.executionEnvironment === 'storeClient';

// Lazy-load react-native-purchases. In Expo Go the native module isn't
// linked, so we treat IAP as "not configured" and the buy/restore actions
// no-op with a friendly alert from SettingsSheet.
let Purchases = null;
if (!IS_EXPO_GO) {
  try {
    // eslint-disable-next-line global-require
    Purchases = require('react-native-purchases').default;
  } catch {}
}

const API_KEY = Constants?.expoConfig?.extra?.revenueCatIosApiKey || '';
const ENTITLEMENT_ID = 'pro';

const IapContext = createContext({
  ready: false,
  configured: false,
  isPro: false,
  price: null,
  buyPro: async () => false,
  restorePurchases: async () => false,
});

export function useIap() {
  return useContext(IapContext);
}

export function IapProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [price, setPrice] = useState(null);

  const usable = !!Purchases && !!API_KEY;

  useEffect(() => {
    if (!usable) {
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        Purchases.configure({ apiKey: API_KEY });
        const info = await Purchases.getCustomerInfo();
        if (cancelled) return;
        setIsPro(!!info?.entitlements?.active?.[ENTITLEMENT_ID]);

        const offerings = await Purchases.getOfferings();
        const pkg = offerings?.current?.availablePackages?.[0];
        if (pkg) setPrice(pkg.product.priceString || null);
      } catch {}
      finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [usable]);

  const buyPro = async () => {
    if (!usable) throw new Error('Purchases not configured');
    const offerings = await Purchases.getOfferings();
    const pkg = offerings?.current?.availablePackages?.[0];
    if (!pkg) throw new Error('No products available');
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const owned = !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
    setIsPro(owned);
    return owned;
  };

  const restorePurchases = async () => {
    if (!usable) return false;
    const customerInfo = await Purchases.restorePurchases();
    const owned = !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
    setIsPro(owned);
    return owned;
  };

  const value = useMemo(() => ({
    ready,
    configured: usable,
    isPro,
    price,
    buyPro,
    restorePurchases,
  }), [ready, usable, isPro, price]);

  return (
    <IapContext.Provider value={value}>{children}</IapContext.Provider>
  );
}
