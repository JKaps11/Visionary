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
import { Keyboard, Pressable, StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import Svg, { Path, Rect } from "react-native-svg";

import { api } from "@visionary/backend/convex/_generated/api";

import { VoiceWaveform } from "@/components/voice-waveform";
import { useAccent } from "@/context/accent";
import { Colors } from "@/constants/theme";

const SIZE = 44;
const ICON = 22;
const METER_INTERVAL_MS = 80;
const METER_DB_FLOOR = -50;
const METER_DB_SILENT = -160;

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

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      const state = recorder.getStatus();
      const db = state.metering ?? METER_DB_SILENT;
      const norm = Math.max(0, Math.min(1, (db - METER_DB_FLOOR) / -METER_DB_FLOOR));
      level.value = norm;
    }, METER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [level, recorder, recording]);

  const start = useCallback(async () => {
    if (recording || busy) return;
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) return;
    Keyboard.dismiss();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void activateKeepAwakeAsync("voice-capture");
    stoppedRef.current = false;
    let prepared = false;
    try {
      await recorder.prepareToRecordAsync();
      prepared = true;
      recorder.record();
      setRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      // If prepare succeeded but record() threw, the native session is open
      // and would leak the mic until app restart — tear it down explicitly.
      if (prepared) {
        try {
          await recorder.stop();
        } catch (stopErr) {
          console.error("Failed to release recorder after start error:", stopErr);
        }
      }
      stoppedRef.current = false;
      setRecording(false);
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
              {
                backgroundColor: accent,
                opacity: busy ? 0.3 : pressed ? 0.7 : 1,
              },
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
                stroke={Colors.text}
                strokeWidth={1.5}
                fill="none"
              />
              <Path
                d="M5 11a7 7 0 0 0 14 0"
                stroke={Colors.text}
                strokeWidth={1.5}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M12 18v3"
                stroke={Colors.text}
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
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  waveformWrap: {
    height: SIZE,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
});
