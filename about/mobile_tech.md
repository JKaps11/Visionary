# Visionary — Mobile Tech

## Constraint

React Native on Expo. Built on Linux (Omarchy), tested on Android first. iOS later via EAS Build.

## Stack

### Framework
- **Expo (managed).** Don't eject. Expo modules cover everything v1 needs.
- **TypeScript.**
- **Expo Router** — minimal. Three screens, one stack.

### Styling
- **Plain StyleSheet.** No NativeWind, no Tailwind, no styled-components. One background, one ink, one accent, one font. A styling library is overhead, not leverage.

### Animation and gestures
- **Reanimated 3** — every gesture runs in a worklet on the UI thread at 60fps. Non-negotiable for the page-turn and the affordance indicators.
- **react-native-gesture-handler** — pan detection, paired with Reanimated.

### Audio and voice
- **expo-audio** — microphone access, recording, and amplitude metering. Metering drives the accent-colored waveform animation on the capture page during voice input.
- **expo-keep-awake** — keeps the screen on while recording so the session isn't killed mid-thought.
- **Deepgram streaming (WebSocket)** — real-time speech-to-text. The client opens a WebSocket directly to Deepgram, streams audio chunks in, and receives interim and final transcripts back. Each final transcript chunk is appended to the same `draft` React state the keyboard writes to, so voice and typing are the same input pipeline downstream.
- The Deepgram API key never touches the device. A Convex action (`deepgram.token`) returns a short-lived WebSocket auth token that the client uses to open the connection.

### Data layer
- **Convex** (`convex/react`) — the entire server is Convex. `useQuery` is a live reactive subscription; `useMutation` handles optimistic updates, retries, and offline queueing automatically. There is no REST client, no TanStack Query, no sync queue, no MMKV. The in-progress draft lives in React `useState` inside the Editor. Everything else — the archive, thought details — is a `useQuery` call.
- **React `useState` / context** for local UI state. No Zustand, no Redux.

### Auth
- **`@convex-dev/auth`** with Sign in with Apple and Sign in with Google providers. Convex owns the session; `ctx.auth.getUserIdentity()` is populated in every function.
- **expo-secure-store** holds the Convex auth token (Keychain on iOS, Keystore on Android).

### Haptics
- **expo-haptics** — tick on save, tick on page-turn commit, tick on settings reveal.

### Typography
- **IBM Plex Mono.** One typeface, loaded once via `expo-font`. No serif, no second family.

### Icons
- **No icon library.** Inline SVG via `react-native-svg` (ships with Expo). The app has one icon (the mic) plus the chevron motif used by the gesture indicators.

### Build and ship
- **EAS Build** — cloud builds for iOS and Android. Ships iOS without owning a Mac.
- **EAS Submit** — TestFlight and Play Store.

### Cut from the stack
- No REST / GraphQL / TanStack Query. Convex replaces all of it.
- No MMKV, no AsyncStorage, no sync queue, no local UUIDs. Convex handles offline and retries.
- No state management library.
- No styling library.
- No icon library.
- No analytics in v1.
- No feature flags.
- No design system, no Storybook, no component library.

## Screens

Three routes, single stack under Expo Router:

- `CapturePage`
- `ArchivePage`
- `ThoughtDetail`

See `mobile_design.md` for what each screen contains and how the user moves between them.

## Components

- **Editor** — the TextInput with markdown shortcut handling for `- ` and `1. ` lists. Holds the draft in `useState`. Both the keyboard and the Deepgram stream write into this same state.
- **MicButton** — the accent-colored circle in the thumb-rest position. Tap to start recording; transforms into the waveform animation while voice is active.
- **VoiceWaveform** — the accent-colored line animation driven by `expo-audio` amplitude metering while recording is active. Dismisses on tap-anywhere (which also stops the Deepgram stream).
- **GestureAffordances** — the three edge indicators on the capture page, rendered only while a pan is in progress.
- **PageStack** — the gesture-driven container for the page-turn and the settings slide.
- **ThoughtCard** — a single thought in the archive list.
- **DayLabel** — the small date headers in the archive.
- **SettingsSheet** — the horizontal slide-in sheet with accent swatches, sign out, version.

## Capture lifecycle

The draft lives in `useState('')` inside the Editor. A single `commitDraft()` function runs the `thoughts.create` mutation if the draft is non-empty, then resets state. It is called from exactly one conceptual event — *the capture session has ended* — which has three triggers:

1. **Swipe up** (explicit: "save and give me a new page")
2. **Swipe down to archive** (implicit: "I'm moving to retrieval")
3. **App backgrounds** (AppState listener: phone lock, home button, call interrupts)

Empty draft → no-op. No empty rows. Convex handles offline queueing and retry on its own. The archive is a live `useQuery(api.thoughts.list)` and updates the instant the mutation lands — no refetch, no polling.

There is no MMKV, no local persistence layer, no sync queue. The only correctness risk is a hard crash of the Expo runtime while actively typing a never-committed draft. That is rare enough to ignore for v1.

## Gesture implementation

The user-facing behavior of every gesture lives in `mobile_design.md`. This section only covers how it's wired up.

### Pan recognizer

- A single `react-native-gesture-handler` pan recognizer lives in `PageStack` and owns all four capture-page directions (up/down/right for action gestures, plus the archive's bottom swipe on the archive screen).
- Edge carve-outs: pans must originate ≥20px from the left edge (Android back / iOS back) and ≥20px above the bottom edge (iOS home indicator).
- The editor's `TextInput` has its own touch handlers for cursor placement and selection. The pan recognizer uses `simultaneousHandlers` / `waitFor` so slow stationary touches belong to the text input and fast motion touches belong to the pan. This wiring is the single largest source of platform-specific bugs in the app — test on both iOS and Android from day one.

### GestureAffordances component

- Rendered as a fixed-position overlay above `PageStack`, only on the capture page.
- Entirely Reanimated worklets. Three shared values drive everything:
  - `dominantDirection` — written by the pan's `onUpdate` callback based on the velocity vector angle. The dominant direction is whichever cardinal axis the velocity is closest to.
  - `selectedTranslation` — derives from `dominantDirection`, interpolated through a 150ms spring. Drives the ~8px translation of the active indicator toward its own edge.
  - `marchProgress` — a continuously running timer-driven value (0 → 1, loop). Each chevron reads this with a 100ms staggered offset to compute its opacity (`0.6 → 1.0 → 0.6`).
- The reveal trigger is a pan distance ≥8px from the initial touch. Below that threshold, indicators stay invisible — stationary touches on the editor never flash the affordances.
- Unselected indicators hold a flat `0.6` opacity and do not translate. No color change anywhere; everything renders in the user's accent color the whole time. Resolution is purely spatial (translation) and temporal (march).
- On gesture commit or release past threshold, a 120ms fade-out transitions into the page-turn or settings-slide animation.
- All of this runs on the UI thread. Zero JS-thread work during the drag.

### Page-turn animation

The page-turn is the hardest motion in the app.

- Reanimated 3 worklets, UI thread, 60fps.
- Commit threshold: ~80px drag OR velocity above a set bar. Below threshold, snap back.
- Easing: a cubic-bezier that feels like physical paper — slight resistance at start, smooth glide, gentle settle.
- Subtle shadow under the lifted page sells the depth.
- `expo-haptics` light impact on commit.
- The editor calls `blur()` when the page lifts so the keyboard dismisses cleanly; refocus on flip-back.
- Build this on a real device from day one. Gesture feel does not simulate.

### Settings slide

- `SettingsSheet` is a Reanimated view translated off-screen to the right at rest.
- Swipe-right on capture (resolved by `GestureAffordances`) animates it in over ~250ms with the same paper easing as the page-turn.
- Swipe-left or tap-outside slides it back off.
- Contents (accent swatches, sign out, version) live in the design doc.

## Voice input

Voice is an alternative *input method*, not a separate flow. It writes into the same `draft` state the keyboard writes into, and from the commit layer's perspective typing and voice are indistinguishable.

1. Tap `MicButton` → the button transforms into the `VoiceWaveform` animation (accent-colored line driven by `expo-audio` amplitude metering). Editor dims slightly. Haptic tick.
2. The client fetches a short-lived Deepgram token from the `deepgram.token` Convex action, then opens a Deepgram WebSocket directly from the device. `expo-audio` streams recorded audio chunks into the socket.
3. Deepgram returns interim and final transcripts. Each final chunk does `setDraft(d => d + chunk)` — exactly the same state the keyboard writes to. The user sees words appear in the editor in real time.
4. Tap anywhere to stop. WebSocket closes, recording stops, waveform dismisses, mic button returns. The `draft` now contains the transcribed text plus anything that was already typed.
5. The user can keep typing to correct or extend the transcription. There is no "done" step specific to voice — exiting the capture session is identical to the typed path (swipe up, swipe down to archive, or app background), all of which call the same `commitDraft()`.

**There is no separate voice save path.** No audio is stored. No `source` field on the thought. If Deepgram gets a word wrong, the user fixes it with the keyboard before committing, the same way they'd fix a typo. Raw audio is discarded the moment the WebSocket closes.

## Build order

1. Empty Expo app + the blank capture page. Editor auto-focuses on launch. Keyboard up. Use it for a day.
2. Convex project wired in. Schema with one `thoughts` table. `thoughts.create` mutation. `thoughts.list` query.
3. `commitDraft()` on app background. Reopen → blank page, thought is in Convex.
4. Archive page + page-turn gesture. The biggest single piece of work. Build on a real Android device from day one.
5. `GestureAffordances` component — the three edge indicators with the translate + march animation.
6. Swipe-right settings sheet. Accent picker, sign out, version.
7. Markdown list shortcuts in the editor.
8. `@convex-dev/auth` with Google (Apple later on iOS).
9. ThoughtDetail screen.
10. Voice input. `deepgram.token` action on the backend. `MicButton` → `VoiceWaveform` transform. Deepgram WebSocket streaming into the draft state.
11. Polish pass. Haptics, motion timing, font sizing, spacing on real device.
12. Daily use for two weeks. Don't add anything.
13. Fix what hurt. Then iOS, TestFlight, web app.

The v1 acceptance criteria (the user-visible tests that define "done") live in `mobile_design.md` under *Definition of done for v1*.
