# Validated iOS revenue improvements

These changes should improve retention, conversion, or discovery without making unsupported assumptions about user behaviour. Measure their effect rather than treating the expected outcome as guaranteed.

## 1. Add basic product analytics

Track conversions, timer starts and completions, recipe saves, paywall views, purchases, ad impressions, and returning users.

**Why:** This establishes where users leave the funnel and whether later changes actually improve revenue. Use privacy-conscious analytics and update the App Store privacy disclosure and privacy policy as required.

## 2. Make timers reliable in the background

- Schedule local notifications for the halfway reminder and completion.
- Persist active timers and their notification identifiers.
- Restore timer state when the app reopens.
- Ask for notification permission when the user first starts a timer and explain why it is useful.
- Cancel or reschedule notifications when a timer is cancelled, restarted, or changed.

**Why:** A cooking timer must still alert the user when the phone is locked or the app is closed. Reliability encourages repeat use, which creates more opportunities for ads and Pro purchases.

## 3. Correct the advertising consent flow

- Request App Tracking Transparency permission before enabling personalized tracking.
- Add Google's User Messaging Platform consent flow for regions where it is required.
- Serve non-personalized ads when the necessary consent is unavailable.
- Avoid interrupting the initial launch with multiple permission prompts.

**Why:** This protects users, reduces App Review and regulatory risk, and ensures AdMob is configured correctly. Consent handling should be completed before experimenting with ad placement.

## 4. Present Pro more clearly

Create a simple paywall that explains the one-time Pro purchase instead of relying only on the Settings row. Keep the core converter and reliable timer free. Pro can include:

- Removal of all ads
- Better saved-recipe organization, such as editing, favorites, and sorting
- Additional timer conveniences added in future releases

Show the paywall when the user selects a Pro feature. A restrained promotional card after repeated use can also be tested, but it should not interrupt cooking or appear after an arbitrary number of conversions.

**Why:** Users are more likely to understand and purchase Pro when its benefits and price are presented together at a relevant moment. A one-time, non-consumable purchase fits the app better than a subscription because the app does not currently provide ongoing paid content or services.

## 5. Improve the ad experience using data

- Do not place interstitial ads on the timer or during cooking.
- Do not add more banner positions.
- Measure revenue and retention from the existing banner placements before removing or moving them.

**Why:** Ads can generate revenue, but intrusive placement can reduce retention and ratings. Analytics should determine whether the extra banners in Saved Recipes earn enough to justify their presence.

## 6. Request reviews after demonstrated value

Use Apple's in-app review request after approximately three to five successful timer completions. Store the app version and completion count so the app does not repeatedly request a review.

**Why:** Users who have completed several cooks have enough experience to give a meaningful rating. Better ratings can improve App Store conversion, while asking after the first use is premature.

## 7. Add result sharing

Add a Share action that produces a short message such as:

> 425°F oven for 25 min → 400°F air fryer for 20 min

**Why:** This is a small feature that can generate organic discovery when users send useful conversions to friends or family.

## 8. Localize the app itself

Translate the interface into the same languages already targeted by the store assets, starting with the markets that produce the most impressions or downloads.

**Why:** A localized store listing followed by an English-only app creates a mismatched experience. Full localization can improve activation and retention in those markets.

## 9. Improve the App Store listing

Make the title, subtitle, description, keywords, and screenshots clearly communicate the main outcome: convert an oven recipe, start a reliable air-fryer timer, and save the result.

**Why:** Store-page improvements can increase downloads without changing the product. Compare App Store impressions, product-page views, and conversion rates after each update.

## Suggested implementation order

1. Analytics
2. Persistent timers and local notifications
3. ATT and regional consent handling
4. Pro paywall
5. Review request
6. Result sharing
7. App Store listing tests
8. Localization based on market data
