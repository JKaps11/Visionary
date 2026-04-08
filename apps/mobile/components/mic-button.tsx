import { useAction } from "convex/react";
import * as Haptics from "expo-haptics";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  useAudioRecorder,
} from "expo-audio";
import { File } from "expo-file-system";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import Svg, { Path, Rect } from "react-native-svg";

import { api } from "@visionary/backend/convex/_generated/api";

import { VoiceWaveform } from "@/components/voice-waveform";
import { useAccent } from "@/context/accent";

// MicButton — quiet at rest, transforms into the VoiceWaveform while
// recording. The recorded clip is sent to the Convex `deepgram.transcribe`
// action and the resulting text is appended to the editor draft via
// `onAppendText`.

const SIZE = 44;
const ICON = 22;

export interface MicButtonProps {
  onAppendText?: (text: string) => void;
}

export function MicButton({ onAppendText }: MicButtonProps) {
  const accent = useAccent();
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const transcribe = useAction(api.deepgram.transcribe);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const level = useSharedValue(0);
  const stoppedRef = useRef(false);

  // Poll the recorder for metering values and write into the shared value
  // that drives the waveform. The status callback only fires on lifecycle
  // events; metering lives on the polled state.
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      const state = recorder.getStatus();
      const db = state.metering ?? -160;
      const norm = Math.max(0, Math.min(1, (db + 50) / 50));
      level.value = norm;
    }, 80);
    return () => clearInterval(id);
  }, [level, recorder, recording]);

  const start = useCallback(async () => {
    if (recording || busy) return;
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) return;
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void activateKeepAwakeAsync("voice-capture");
      stoppedRef.current = false;
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      deactivateKeepAwake("voice-capture");
    }
  }, [busy, recorder, recording]);

  const stop = useCallback(async () => {
    if (!recording || stoppedRef.current) return;
    stoppedRef.current = true;
    setBusy(true);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      setRecording(false);
      level.value = 0;
      if (uri) {
        const file = new File(uri);
        const buffer = await file.arrayBuffer();
        // m4a/aac on both platforms via HIGH_QUALITY preset.
        const text = await transcribe({
          audio: buffer,
          mimeType: "audio/mp4",
        });
        if (text && text.length > 0 && onAppendText) {
          onAppendText(text);
        }
      }
    } catch (err) {
      console.error("Failed to transcribe:", err);
    } finally {
      deactivateKeepAwake("voice-capture");
      setBusy(false);
    }
  }, [level, onAppendText, recorder, recording, transcribe]);

  // While recording, a transparent full-screen Pressable swallows touches so
  // any tap stops the recording.
  return (
    <>
      {recording ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            void stop();
          }}
        />
      ) : null}
      <View style={styles.wrap} pointerEvents="box-none">
        {recording ? (
          <View style={styles.waveformWrap} pointerEvents="none">
            <VoiceWaveform level={level} />
          </View>
        ) : (
          <Pressable
            onPress={() => {
              void start();
            }}
            disabled={busy}
            style={({ pressed }) => [
              styles.button,
              { opacity: busy ? 0.3 : pressed ? 0.5 : 0.6 },
            ]}
            hitSlop={16}
          >
            <Svg width={ICON} height={ICON} viewBox="0 0 24 24">
              <Rect
                x={9}
                y={3}
                width={6}
                height={11}
                rx={3}
                stroke={accent}
                strokeWidth={1.5}
                fill="none"
              />
              <Path
                d="M5 11a7 7 0 0 0 14 0"
                stroke={accent}
                strokeWidth={1.5}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M12 18v3"
                stroke={accent}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </Svg>
          </Pressable>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
  button: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  waveformWrap: {
    height: SIZE,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
});
