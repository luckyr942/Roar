// Hold-to-talk button: records up to 10 seconds of your voice and plays it on your friend's phone.
// Why: shouting at your friend is the real banter, so this sends the scream itself, not just text.

import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
    RecordingPresets,
    requestRecordingPermissionsAsync,
    setAudioModeAsync,
    useAudioRecorder,
    useAudioRecorderState,
} from 'expo-audio';
import { FONT, THEME } from '../constants/theme';
import { uploadVoice } from '@/lib/api';
import { sendRoast } from '@/lib/rival/room';

const MAX_SECONDS = 10;
const MIN_SECONDS = 0.4;

export default function VoiceRoar({ online, tag, rival }: { online: boolean; tag: string; rival: string }) {
    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recorderState = useAudioRecorderState(recorder, 200);
    const [note, setNote] = useState('');
    const holding = useRef(false);
    const limitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const finish = async () => {
        holding.current = false;
        if (limitTimer.current) clearTimeout(limitTimer.current);
        if (!recorder.isRecording) return;
        const seconds = recorder.currentTime;
        await recorder.stop();
        setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
        if (seconds < MIN_SECONDS || !recorder.uri) {
            setNote('Hold the button while you talk.');
            return;
        }
        try {
            setNote('Sending...');
            const voiceId = await uploadVoice(recorder.uri);
            const sent = sendRoast('VOICE ROAR', tag || 'VOICE', { voiceId });
            setNote(sent ? `${rival} is hearing it now.` : 'Not connected. Join a room first.');
        } catch {
            setNote('Could not send the voice. Try again.');
        }
    };

    const start = async () => {
        holding.current = true;
        setNote('');
        try {
            const permission = await requestRecordingPermissionsAsync();
            if (!permission.granted) {
                holding.current = false;
                setNote('Allow the microphone to send voice roasts.');
                return;
            }
            if (!holding.current) return;
            await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
            await recorder.prepareToRecordAsync();
            recorder.record();
            limitTimer.current = setTimeout(finish, MAX_SECONDS * 1000);
        } catch {
            holding.current = false;
            setNote('This device could not start the microphone.');
        }
    };

    const recording = recorderState.isRecording;
    const seconds = Math.round(recorderState.durationMillis / 1000);

    return (
        <View style={{ gap: 6 }}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Hold to record a voice roast for ${rival}`}
                disabled={!online}
                onPressIn={start}
                onPressOut={finish}
                style={[styles.button, recording && styles.recording, !online && { opacity: 0.45 }]}
            >
                <Feather name="mic" size={20} color={recording ? THEME.text : THEME.bg} />
                <Text style={[styles.label, recording && { color: THEME.text }]}>
                    {recording ? `RECORDING ${seconds}s / ${MAX_SECONDS}s · LET GO TO SEND` : 'HOLD TO ROAR'}
                </Text>
            </Pressable>
            {note ? <Text style={styles.note}>{note}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 56,
        borderRadius: 16,
        backgroundColor: THEME.roar,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    recording: { backgroundColor: THEME.drop },
    label: { fontFamily: FONT.num, fontSize: 18, letterSpacing: 0.6, color: THEME.bg },
    note: { fontFamily: FONT.body, fontSize: 12, color: THEME.muted, textAlign: 'center' },
});
