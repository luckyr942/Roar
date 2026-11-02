// Review screen: pick your best frame from the photos taken around the big moment, then keep or delete it.
// Why: nothing is saved or shared until you choose to keep it.

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { FONT, THEME } from '../constants/theme';
import { useRoar, type Frame } from '@/lib/store';
import { hypeFor } from '@/lib/ai/captions';
import { Button, IconButton, Label } from '@/components/ui';

const STRIP_SIZE = 5;
const PEAK_OFFSET_MS = 1000;

const offsetLabel = (ms: number) => {
    const s = Math.round(ms / 1000);
    return s > 0 ? `+${s}s` : s < 0 ? `−${Math.abs(s)}s` : '0s';
};

function pickStrip(frames: Frame[]): Frame[] {
    if (frames.length <= STRIP_SIZE) return frames;
    return Array.from({ length: STRIP_SIZE }, (_, i) => frames[Math.round((i * (frames.length - 1)) / (STRIP_SIZE - 1))]);
}

function peakIndex(strip: Frame[]): number {
    let best = 0;
    strip.forEach((f, i) => {
        if (Math.abs(f.offsetMs - PEAK_OFFSET_MS) < Math.abs(strip[best].offsetMs - PEAK_OFFSET_MS)) best = i;
    });
    return best;
}

export default function ReviewScreen() {
    const router = useRouter();
    const capture = useRoar((s) => s.capture);
    const setCapture = useRoar((s) => s.setCapture);
    const keepMemory = useRoar((s) => s.keepMemory);

    const strip = capture ? pickStrip(capture.frames) : [];
    const peak = peakIndex(strip);
    const [selected, setSelected] = useState(peak);

    if (!capture) {
        return (
            <SafeAreaView style={[styles.safe, styles.emptyWrap]}>
                <Text style={styles.sub}>No reaction waiting.</Text>
                <Text style={styles.note}>ROAR opens this screen by itself when a big moment lands.</Text>
                <Button title="Back" kind="outline" onPress={() => router.back()} />
            </SafeAreaView>
        );
    }

    const { moment } = capture;
    const frame = strip[selected];

    const discard = () => {
        setCapture(null);
        router.back();
    };

    const keep = () => {
        const id = `mem-${Date.now()}`;
        keepMemory({
            id,
            moment,
            frameUri: frame?.uri ?? null,
            hype: hypeFor(moment, capture.tension),
            createdAt: Date.now(),
            shared: false,
            posted: false,
        });
        router.replace({ pathname: '/memory', params: { id } });
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.page}>
                <View style={styles.topBar}>
                    <IconButton icon="x" label="Close" onPress={discard} />
                    <Label color={THEME.dropText}>ROAR DROP · {moment.overText}</Label>
                    <View style={styles.row}>
                        <Feather name="lock" size={12} color={THEME.muted} />
                        <Text style={styles.small}>{strip.length ? 'On this phone' : 'Camera was off'}</Text>
                    </View>
                </View>

                <View>
                    <Text style={styles.headline}>{moment.headline}</Text>
                    <Text style={styles.sub}>{moment.title}</Text>
                    <Text style={styles.outcome}>{(moment.outcome ?? moment.detail).toUpperCase()}</Text>
                </View>

                <View style={styles.preview}>
                    {frame ? (
                        <Image source={{ uri: frame.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    ) : (
                        <View style={styles.placeholder}>
                            <Feather name="user" size={56} color="#4A4A55" />
                            <Text style={styles.small}>No photo this time</Text>
                        </View>
                    )}
                    {frame && (
                        <>
                            <Text style={styles.stamp}>{offsetLabel(frame.offsetMs)}</Text>
                            {selected === peak && (
                                <View style={styles.peak}>
                                    <Text style={styles.peakText}>PEAK</Text>
                                </View>
                            )}
                        </>
                    )}
                </View>

                {strip.length > 0 && (
                    <View accessibilityRole="radiogroup" style={styles.strip}>
                        {strip.map((f, i) => {
                            const on = i === selected;
                            return (
                                <Pressable
                                    key={f.uri}
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: on }}
                                    accessibilityLabel={`Frame ${offsetLabel(f.offsetMs)}`}
                                    onPress={() => setSelected(i)}
                                    style={[styles.thumb, on && styles.thumbOn]}
                                >
                                    <Image source={{ uri: f.uri }} style={styles.thumbImg} resizeMode="cover" />
                                    <Text style={[styles.thumbText, on && { color: THEME.roar }]}>{offsetLabel(f.offsetMs)}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                )}

                <Text style={styles.note}>
                    {strip.length
                        ? `ROAR picked ${offsetLabel(strip[peak].offsetMs)}, the second after the ball. Nothing leaves your phone until you keep it.`
                        : 'The camera was off, so there is no photo. You can still keep the moment.'}
                </Text>

                <View style={styles.actions}>
                    <Button title="Delete" kind="outline" onPress={discard} style={{ flex: 1 }} />
                    <Button title="Keep it" onPress={keep} style={{ flex: 1.4 }} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: THEME.bg },
    emptyWrap: { justifyContent: 'center', padding: 20, gap: 14 },
    page: { flex: 1, padding: 20, paddingTop: 10, gap: 16 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    small: { fontFamily: FONT.body, fontSize: 11, color: THEME.muted },
    headline: { fontFamily: FONT.num, fontSize: 68, lineHeight: 64, color: THEME.text },
    sub: { fontFamily: FONT.bold, fontSize: 17, color: THEME.text, marginTop: 6 },
    outcome: { fontFamily: FONT.num, fontSize: 22, color: THEME.dropText, marginTop: 2 },
    preview: { flex: 1, borderRadius: 20, overflow: 'hidden', backgroundColor: THEME.surfaceCard, borderWidth: 1, borderColor: THEME.line },
    placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    stamp: { position: 'absolute', top: 12, left: 12, fontFamily: FONT.num, fontSize: 18, color: THEME.text, backgroundColor: THEME.bg, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 2, overflow: 'hidden' },
    peak: { position: 'absolute', top: 12, right: 12, backgroundColor: THEME.roar, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
    peakText: { fontFamily: FONT.black, fontSize: 10, letterSpacing: 1.2, color: THEME.bg },
    strip: { flexDirection: 'row', gap: 8 },
    thumb: { flex: 1, height: 74, borderRadius: 12, borderWidth: 1, borderColor: THEME.line, backgroundColor: THEME.surface, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
    thumbOn: { borderWidth: 2, borderColor: THEME.roar },
    thumbImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.55 },
    thumbText: { fontFamily: FONT.black, fontSize: 12, color: THEME.text, paddingBottom: 6 },
    note: { fontFamily: FONT.body, fontSize: 13, lineHeight: 19, color: THEME.muted, textAlign: 'center' },
    actions: { flexDirection: 'row', gap: 10 },
});
