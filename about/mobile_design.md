# Visionary — Design

## Core principles

Every decision in the app must answer to these. If a choice violates one of them, the choice is wrong.

1. **Capture is the front door, always.** Every app open lands on a blank page with the cursor ready and the keyboard up.
2. **Two modes, one gesture between them.** Capture and retrieval. The user is in exactly one at a time. No tabs, no menu, no labels naming the modes.
3. **Typing is primary, voice is secondary.** The mic is present but quiet.
4. **Simplicity is the feature.** Every element must aid the thought process. If it doesn't, it's cut.

## The two modes

The single most important design decision: capture and retrieval are not the same surface and never appear together. They have opposite requirements.

- **Capture mode.** Instant, blank, no friction, no history visible. History is a distraction when you're trying to get a thought out — you'll start reading instead of writing. The app opens here. 90% of opens are capture.
- **Retrieval mode.** Deliberate, browsable, calm. The user came here on purpose. Time pressure is zero.

## The page-turn metaphor

The gesture between modes is a page-turn, like flipping a page in a working notebook.

- **Swipe down** on the capture page → the blank page lifts away and reveals a scrollable virtualized list of your past notes in chronological order. Also has a search bar.
- **Swipe up** on the archive page → the page flips forward and you're back on the blank front page, in capture mode.
- **Swipe up** on the capture page → save the current note and move to a new blank page.
- **Swipe right** on the capture page → the settings sheet slides in from the right. Swipe left (or tap outside) to dismiss.

The capture page is always the *front* page of the notebook. It is where you return. Everything you've written is *behind* it.

This metaphor does the work of explaining the entire app with zero teaching. It also dictates the directionality (up reveals past, down returns to now), the feel (physical, with subtle shadow and easing that suggests paper), and the absence of any other navigation.

## Capture page

What's on it:

- A blinking cursor in the top-left of the writing area
- The keyboard, already up
- The mic button, quietly seated in the user's natural thumb-rest position

NOTE: Do not add anything that is not specified above. No status bars, no chrome, no buttons, no labels, no hints. The gesture-direction indicators (top, bottom, right) are revealed only while the user is mid-pan and are invisible at rest — they do not count as page chrome.

The cursor is the first and only thing the user sees. The mic is present but quiet enough that it does not compete with the cursor for attention.

## Retrieval (archive) page

A chronological list of past thoughts grouped by day. The day labels are the only chrome. Same typography as the capture page so it feels like the same notebook. Generous vertical spacing — like a real notebook, not crowded.

Tap a thought to open it full-screen. Swipe up on the bottom of the screen (you will see an indicator that is 3 upwards arrows at the bottom of the screen) to flip back to the blank capture page.

## Thought detail

Reached by tapping a thought in the archive. Full-screen view of a single thought — the full text, the date it was captured, nothing else. **No edit button.** Thoughts are immutable once captured; the app is a place to capture, not a place to polish.

The detail view uses the same typography and spacing as the archive so it feels like the same notebook page, just zoomed in. Back to the archive with a system back gesture or a swipe.

## Settings

Settings live off the horizontal axis. Swipe right on the capture page and a sheet slides in from the right, covering the page. It contains:

- Accent color swatches (the three from the palette)
- Sign out
- Version number

That's everything. Swipe left or tap outside to dismiss. Settings are only reachable from the capture page, never from the archive — if you want to change accent color while browsing, you swipe up from the bottom of the archive to return to capture first, then swipe right. One extra gesture, acceptable friction for a rare action.

The spatial model: the vertical axis is for thoughts (up = save and new page, down = history). The horizontal axis is for meta (right = settings). Two axes, two purposes. No tabs, no menus.

## Gesture affordances

The capture page has three directional gestures (up, down, right) but no visible chrome at rest. When the user touches the page and begins to pan, three indicators fade in — one at each active edge (top, bottom, right). Each is a stack of three chevrons with a baseline, rotated toward its own edge, rendered in the user's accent color. A one-word label sits under each: *New*, *Archive*, *Settings*.

The indicators resolve the user's direction via animation, not color:

- The indicator matching the current pan direction translates ~8px toward its own edge (leans into the gesture).
- Its three chevrons march in staggered sequence, looping while selected — a conveyor-belt feel flowing toward the edge.
- Unselected indicators stay put at reduced opacity.
- If the user rotates their thumb mid-pan, the active indicator hands off smoothly to the new dominant direction.

On commit or release, the indicators fade out in a beat as the page-turn or settings-slide takes over. The resting state of the capture page stays pure: cursor, keyboard, mic. The affordances only exist while the user is actively reaching for them.

## Formatting

**No formatting toolbar. Ever.**

The only structure the app supports is bullet and numbered lists, invoked by markdown shortcuts:

- Type `- ` at the start of a line → bullet list
- Type `1. ` at the start of a line → numbered list
- Return continues the list. Return on an empty list item exits the list.

That's it. No bold, no italic, no headings, no links, no checkboxes, no quotes, no code blocks, no colors, no highlights, no tables.

The principle: the app supports structure that *emerges naturally* from typing. A toolbar tells the user "you should be thinking about formatting." Markdown shortcuts let formatting happen invisibly for those who know them and don't exist for those who don't.

Voice transcripts are the literal transcription, lightly cleaned (filler words removed, punctuation added). The AI does not infer structure from speech. If you wanted structure, you would have typed.

## Theme and color

**Dark mode only. No toggle.**

- **Background**: #2C2C2C 
- **Text**: #E4E4E4
- **Accent**: user-chosen from a curated palette: #B39CD0, #FFC1CC, #A8DADC

## Typography

- IBM Plex Mono

## Motion

- Motion is feedback, not decoration. Every tap has a response — a subtle scale, a fade, a haptic. Nothing should feel dead. Nothing should bounce or wiggle for fun.
- The page-turn is the one piece of motion that's allowed to be slightly indulgent, because it's the metaphor that carries the whole app. Easing should feel like physical paper — slight resistance at the start, smooth glide, gentle settle. A subtle shadow under the lifted page sells the depth.
- Haptic tick on save and on page-turn commit. Tiny detail, huge feel.

## Sound

- Optional, off by default
- A short, satisfying tone on save — the audio equivalent of clicking a really good pen
- No other sound effects anywhere

## Capture flow

The typed capture flow, from the user's perspective:

1. App opens → the capture page is already there → the cursor is already blinking → the keyboard is already up. Typing-ready in under one second.
2. User types. Every keystroke appears instantly. There is no "saving…" indicator, no spinner, no acknowledgment chrome — the absence of feedback *is* the feedback. The app is behaving like paper.
3. Markdown shortcuts transform lists invisibly (see *Formatting*).
4. The user is done with the thought. They do one of three things, and any of them saves the thought:
   - **Swipe up** — the page turns, the thought is saved, a new blank page appears. This is the deliberate "next thought" gesture.
   - **Swipe down** — the page turns, the thought is saved, the archive is revealed. This is the "I want to look back" gesture.
   - **Lock the phone, press home, or get interrupted by a call** — the thought is saved in the background. This is the "life happened" safety net. The user never has to think about it.
5. On the next open, the capture page is blank again. The thought just captured is live in the archive the instant the save lands — no refresh, no delay.

There is no save button. There is no "new thought" button. There is no cancel button. The *act of moving on* is the save. This is the most important detail in the entire capture flow and it has to feel invisible and trustworthy.

## Definition of done for v1

The product is done when all of these are true:

- Open the app at 2am with one hand. Typing-ready in under one second.
- Type a thought. Background the app. Reopen. The thought is in the archive.
- Swipe down from the capture page. See yesterday's thoughts. Tap one. Read it. Swipe up from the bottom. Back to blank.
- Swipe right. Change accent color. Swipe left to dismiss. The new accent is live everywhere.
- Lose internet for an hour, capture five thoughts, regain internet. All five sync without intervention.
- Use the app for two weeks without opening any other notes app.

The last one is the only definition of done that actually matters.
