// Live match screen: replays the final ball by ball, arms the camera when it gets tight, catches big moments.
// Why: this is the heart of ROAR, turning a scoreboard into a moment you live and keep.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FONT, THEME } from '../constants/theme';
import { useMatchEngine, lastOverStartIndex } from '@/hooks/useMatchEngine';
import { useRoar, type Speed } from '@/lib/store';
import { ARM_CAMERA_AT, BIG_MOMENT_AT } from '@/lib/match/tension';
import { ARMY_NAME, LABEL_COLOR, TEAM_COLOR, TEAM_TEXT } from '@/lib/teams';
import { roastLine } from '@/lib/ai/captions';
import { rivalHere, sendRoast, useRival } from '@/lib/rival/room';
import type { Moment } from '@/lib/moments/detect';
import ReactionCamera from '@/components/ReactionCamera';
import { Chip, IconButton, Label, Segmented } from '@/components/ui';

const SPEEDS: Speed[] = [1, 2, 4];
const DELAYS_MS = [0, 5000, 10000, 30000]; // tap "TV sync" to cycle
const BUFFER_BEFORE_MS = 5000; // frames kept from before the moment
const CAPTURE_AFTER_MS = 3000; // keep filming this long after the moment
const METER_SEGMENTS = 20;
const ARMY_BASE = 20; // both armies start with some fans, so one moment can't show 100% / 0%
const CHIP_BG: Record<string, string> = { W: THEME.drop, '6': THEME.mi, '4': THEME.mint };

export default function MatchScreen() {
    const router = useRouter();
    const focused = useIsFocused();
    const { jump } = useLocalSearchParams<{ jump?: string }>();
    const { balls, info, index, state, tension, moments } = useMatchEngine();

    const profile = useRoar((s) => s.profile);
    const start = useRoar((s) => s.start);
    const stop = useRoar((s) => s.stop);
    const speed = useRoar((s) => s.speed);
    const setSpeed = useRoar((s) => s.setSpeed);
    const delayMs = useRoar((s) => s.delayMs);
    const setDelay = useRoar((s) => s.setDelay);
    const armyPoints = useRoar((s) => s.armyPoints);
    const addArmyPoints = useRoar((s) => s.addArmyPoints);
    const setCapture = useRoar((s) => s.setCapture);
    const setLastMoment = useRoar((s) => s.setLastMoment);
    const members = useRival((s) => s.members);

    const [permission, requestPermission] = useCameraPermissions();
    const [capturing, setCapturing] = useState(false);

    // Start when the screen opens (at the last over if Home asked), stop when it closes.
    useEffect(() => {
        start(jump === 'lastover' ? lastOverStartIndex(balls) : 0);
        return stop;
    }, [jump, balls, start, stop]);

    // --- Reaction capture -------------------------------------------------------------
    // While armed, the camera buffers a frame a second. When a big moment lands we keep
    // filming a few more seconds, then hand the frames around the moment to Review.
    const frames = useRef<{ uri: string; t: number }[]>([]);
    const pending = useRef<{ moment: Moment; t0: number; tension: number } | null>(null);
    const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTension = useRef(0);

    const onFrame = useCallback((uri: string) => {
        const now = Date.now();
        frames.current = [...frames.current.filter((f) => now - f.t < 12000), { uri, t: now }];
    }, []);

    const finishCapture = useCallback(() => {
        const p = pending.current;
        if (!p) return;
        pending.current = null;
        setCapturing(false);
        const picked = frames.current
            .filter((f) => f.t >= p.t0 - BUFFER_BEFORE_MS && f.t <= p.t0 + CAPTURE_AFTER_MS)
            .map((f) => ({ uri: f.uri, offsetMs: f.t - p.t0 }));
        setCapture({ moment: p.moment, tension: p.tension, frames: picked });
        router.push('/review');
    }, [router, setCapture]);

    useEffect(() => () => {
        if (finishTimer.current) clearTimeout(finishTimer.current);
    }, []);

    useEffect(() => {
        if (tension > 0) lastTension.current = tension;
    }, [tension]);

    const cameraOn = Boolean(permission?.granted);
    const armed = focused && !state.isOver && tension >= ARM_CAMERA_AT;
    const showCamera = cameraOn && focused && (armed || capturing);
    const rivalOnline = rivalHere(members);

    // Each new moment: army points to the team it's good for (once). If it's big and happening
    // right now: buzz, roast your rival if it went your way, and open the capture window.
    const lastMomentId = useRef<string | null>(null);
    const latest = moments[0];
    useEffect(() => {
        if (!latest || latest.id === lastMomentId.current) return;
        lastMomentId.current = latest.id;
        addArmyPoints(latest.team, latest.points);

        const isNow = latest.ballIndex === index;
        const isBig = latest.kind === 'result' || (latest.kind !== 'four' && tension >= BIG_MOMENT_AT);
        if (!isNow || !isBig || !focused) return;

        const goodForMe = latest.team === profile.team;
        setLastMoment(latest);
        Haptics.notificationAsync(
            goodForMe ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
        ).catch(() => {});
        if (goodForMe && profile.autoRoast) {
            sendRoast(roastLine(latest, profile), `${latest.label} · ${latest.overText}`);
        }

        pending.current = { moment: latest, t0: Date.now(), tension: lastTension.current };
        setCapturing(true);
        if (finishTimer.current) clearTimeout(finishTimer.current);
        finishTimer.current = setTimeout(finishCapture, cameraOn ? CAPTURE_AFTER_MS : 1200);
    }, [latest, index, tension, focused, cameraOn, profile, addArmyPoints, setLastMoment, finishCapture]);

    // --- View ---------------------------------------------------------------------------
    const short = (team: string) => info.short[team] ?? team;
    const batting = short(state.battingTeam);
    const inLastOver = state.innings === 2 && index >= lastOverStartIndex(balls) - 1;
    const miPct = Math.round(((armyPoints.MI + ARMY_BASE) / (armyPoints.MI + armyPoints.CSK + 2 * ARMY_BASE)) * 100);
    const lit = Math.round((tension / 100) * METER_SEGMENTS);
    const meterColor = tension >= ARM_CAMERA_AT ? THEME.drop : tension >= 50 ? THEME.roar : THEME.muted;
    const rrr = state.requiredRate !== undefined && state.ballsLeft ? ` · RRR ${state.requiredRate.toFixed(2)}` : '';

    const cycleDelay = () => setDelay(DELAYS_MS[(DELAYS_MS.indexOf(delayMs) + 1) % DELAYS_MS.length], index);

    let tensionTitle = 'TENSION · CALM';
    if (tension >= 50) tensionTitle = 'TENSION · ON THE EDGE';
    if (armed) tensionTitle = 'TENSION · ARMED';
    if (capturing) tensionTitle = 'CAPTURING';

    let tensionNote = 'Camera is off. ROAR arms it by itself when the chase gets tight.';
    if (armed && cameraOn) tensionNote = 'Front camera is keeping the last 5 seconds of you. Nothing leaves your phone.';
    else if (armed) tensionNote = 'It is tight. Allow the camera so ROAR can catch your reaction.';
    if (capturing) tensionNote = 'Big moment. Catching your reaction...';

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            {/* Score header */}
            <View style={styles.header}>
                <View style={styles.rowBetween}>
                    <View style={styles.row}>
                        <IconButton icon="chevron-left" label="Back" onPress={() => router.back()} />
                        <View style={styles.live}>
                            <View style={[styles.dot, state.isOver && { backgroundColor: THEME.muted }]} />
                            <Text style={styles.liveText}>
                                {state.isOver ? 'FULL TIME' : `LIVE · ${state.innings === 1 ? '1ST' : '2ND'} INNINGS`}
                            </Text>
                        </View>
                    </View>
                    <View style={{ width: 120 }}>
                        <Segmented options={SPEEDS} value={speed} onChange={(s) => setSpeed(s, index)} label={(s) => `${s}×`} height={28} />
                    </View>
                </View>

                <View style={styles.scoreRow}>
                    <View style={styles.scoreLeft}>
                        <Text style={[styles.scoreTeam, { color: batting === 'MI' ? THEME.mi : THEME.csk }]}>{batting}</Text>
                        <Text style={styles.score}>
                            {state.runs}/{state.wickets}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.overs}>
                            {state.oversText} <Text style={styles.oversUnit}>ov</Text>
                        </Text>
                        <Text style={styles.rates}>
                            RR {state.currentRate.toFixed(2)}
                            {rrr}
                        </Text>
                    </View>
                </View>

                <View style={styles.chase}>
                    {state.result ? (
                        <Text style={styles.chaseMain}>{state.result}</Text>
                    ) : state.innings === 2 ? (
                        <>
                            <Text style={styles.chaseMain}>
                                Need {state.runsNeeded} off {state.ballsLeft}
                            </Text>
                            <Text style={styles.chaseSub}>chasing {short(state.bowlingTeam)}&apos;s {(state.target ?? 1) - 1}</Text>
                        </>
                    ) : (
                        <>
                            <Text style={[styles.chaseMain, { color: THEME.text }]}>{batting} batting first</Text>
                            <Text style={styles.chaseSub}>{info.title}</Text>
                        </>
                    )}
                </View>

                <View style={styles.batters}>
                    {state.batters.length === 0 ? (
                        <Text style={styles.batterName}>Waiting for the first ball...</Text>
                    ) : (
                        state.batters.map((b, i) => (
                            <View key={b.name} style={[styles.batter, i === 1 && styles.batterRight]}>
                                <Text style={[styles.batterName, b.onStrike && { color: THEME.text, fontFamily: FONT.bold }]} numberOfLines={1}>
                                    {b.name}
                                    {b.onStrike ? <Text style={{ color: THEME.roar }}> *</Text> : null}
                                </Text>
                                <Text style={styles.batterRuns}>
                                    {b.runs} <Text style={{ color: THEME.dim }}>({b.balls})</Text>
                                </Text>
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.rowBetween}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Change TV delay" onPress={cycleDelay} style={styles.row}>
                        <Feather name="tv" size={14} color={THEME.muted} />
                        <Text style={styles.small}>TV sync +{delayMs / 1000}s</Text>
                    </Pressable>
                    <View style={styles.chips}>
                        {state.last6.map((c, i) => (
                            <View key={i} style={[styles.ball, { backgroundColor: CHIP_BG[c] ?? THEME.raised }]}>
                                <Text style={[styles.ballText, CHIP_BG[c] ? { color: THEME.bg } : null]}>{c}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.body}>
                {/* Tension */}
                <View style={[styles.card, armed && styles.cardArmed]}>
                    <View style={styles.tensionRow}>
                        <View style={{ flex: 1, gap: 8 }}>
                            <View style={styles.rowBetween}>
                                <Label color={armed ? THEME.dropText : THEME.muted}>{tensionTitle}</Label>
                                <Text style={[styles.tensionNum, { color: armed ? THEME.dropText : THEME.text }]}>{tension}</Text>
                            </View>
                            <View style={styles.meter}>
                                {Array.from({ length: METER_SEGMENTS }, (_, i) => (
                                    <View key={i} style={[styles.seg, { backgroundColor: i < lit ? meterColor : armed ? '#3A2420' : THEME.raised }]} />
                                ))}
                            </View>
                            <Text style={styles.note}>{tensionNote}</Text>
                        </View>
                        {showCamera && <ReactionCamera onFrame={onFrame} />}
                    </View>
                    {!cameraOn && (
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => requestPermission()}
                            disabled={permission ? !permission.canAskAgain : false}
                            style={styles.cameraBtn}
                        >
                            <Feather name="camera" size={15} color={THEME.text} />
                            <Text style={styles.cameraBtnText}>
                                {permission && !permission.canAskAgain ? 'Camera blocked in Settings' : 'Allow camera to catch your reaction'}
                            </Text>
                        </Pressable>
                    )}
                </View>

                {/* Army war */}
                <View style={styles.card}>
                    <View style={styles.rowBetween}>
                        <Text style={[styles.armyPct, { color: THEME.mi }]}>MI {miPct}%</Text>
                        <Label>ARMY WAR</Label>
                        <Text style={[styles.armyPct, { color: THEME.csk }]}>{100 - miPct}% CSK</Text>
                    </View>
                    <View style={styles.armyBar}>
                        <View style={{ width: `${miPct}%`, backgroundColor: THEME.mi }} />
                        <View style={{ flex: 1, backgroundColor: THEME.csk }} />
                    </View>
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => addArmyPoints(profile.team, 1)}
                        style={({ pressed }) => [styles.roarBtn, { borderColor: TEAM_COLOR[profile.team] }, pressed && { opacity: 0.7 }]}
                    >
                        <Feather name="volume-2" size={17} color={TEAM_TEXT[profile.team]} />
                        <Text style={[styles.roarBtnText, { color: TEAM_TEXT[profile.team] }]}>Roar for {ARMY_NAME[profile.team]}</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={() => router.navigate('/banter')} style={styles.rivalRow}>
                        <View style={[styles.presence, { backgroundColor: rivalOnline ? THEME.mint : THEME.dim }]} />
                        <Text style={[styles.small, { flex: 1 }]}>
                            {rivalOnline
                                ? `${profile.rival} is watching with you${profile.autoRoast ? ' · auto-roast on' : ''}`
                                : profile.room
                                  ? `Waiting for ${profile.rival} in room ${profile.room}`
                                  : `Invite ${profile.rival} to roast live`}
                        </Text>
                        <Feather name="chevron-right" size={15} color={THEME.dim} />
                    </Pressable>
                </View>

                {/* Moments */}
                <Label>MOMENTS SO FAR</Label>
                <View style={[styles.card, { padding: 0 }]}>
                    {moments.length === 0 && <Text style={[styles.note, { padding: 14 }]}>Fours, sixes and wickets land here.</Text>}
                    {moments.slice(0, 6).map((m, i) => (
                        <View key={m.id} style={[styles.momentRow, i > 0 && styles.momentDivider]}>
                            <Text style={styles.momentOver}>{m.overText}</Text>
                            <View style={{ flex: 1, gap: 3 }}>
                                <View style={styles.row}>
                                    <Chip label={m.label} color={LABEL_COLOR[m.label] ?? THEME.roar} />
                                    <Text style={styles.momentTitle} numberOfLines={1}>
                                        {m.title}
                                    </Text>
                                </View>
                                <Text style={styles.small}>
                                    {m.detail.split(' · ')[1]}
                                    {m.outcome ? ` · ${m.outcome}` : ''}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                <Pressable
                    accessibilityRole="button"
                    onPress={() => (inLastOver ? start(0) : start(lastOverStartIndex(balls)))}
                    style={styles.demo}
                >
                    <Text style={styles.demoText}>{inLastOver ? 'Restart from the first ball' : 'Demo: jump to the last over'}</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: THEME.bg },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    header: { backgroundColor: THEME.surface, borderBottomWidth: 1, borderBottomColor: THEME.line, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14, gap: 10 },
    live: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.drop },
    liveText: { fontFamily: FONT.black, fontSize: 11, letterSpacing: 1.4, color: THEME.dropText },
    scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    scoreLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
    scoreTeam: { fontFamily: FONT.num, fontSize: 26 },
    score: { fontFamily: FONT.num, fontSize: 64, lineHeight: 62, color: THEME.text },
    overs: { fontFamily: FONT.numBold, fontSize: 22, color: THEME.text },
    oversUnit: { fontSize: 14, color: THEME.muted },
    rates: { fontFamily: FONT.body, fontSize: 12, color: THEME.muted, marginTop: 2 },
    chase: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: THEME.bg, borderWidth: 1, borderColor: THEME.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
    chaseMain: { fontFamily: FONT.black, fontSize: 15, color: THEME.dropText },
    chaseSub: { fontFamily: FONT.body, fontSize: 12, color: THEME.muted },
    batters: { flexDirection: 'row' },
    batter: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingRight: 10 },
    batterRight: { borderLeftWidth: 1, borderLeftColor: THEME.line, paddingLeft: 10, paddingRight: 0 },
    batterName: { fontFamily: FONT.semi, fontSize: 13, color: '#D4D4DA', flexShrink: 1 },
    batterRuns: { fontFamily: FONT.semi, fontSize: 13, color: '#D4D4DA' },
    small: { fontFamily: FONT.body, fontSize: 12, color: THEME.muted },
    chips: { flexDirection: 'row', gap: 5 },
    ball: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    ballText: { fontFamily: FONT.numBold, fontSize: 14, color: THEME.text },
    body: { padding: 20, paddingTop: 14, gap: 12 },
    card: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.line, borderRadius: 16, padding: 14, gap: 10 },
    cardArmed: { backgroundColor: THEME.dropTint, borderColor: THEME.dropLine },
    tensionRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
    tensionNum: { fontFamily: FONT.num, fontSize: 34, lineHeight: 34 },
    meter: { flexDirection: 'row', gap: 2 },
    seg: { flex: 1, height: 10, borderRadius: 1 },
    note: { fontFamily: FONT.body, fontSize: 12, lineHeight: 17, color: '#D4D4DA' },
    cameraBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 12, borderWidth: 1, borderColor: THEME.line },
    cameraBtnText: { fontFamily: FONT.bold, fontSize: 13, color: THEME.text },
    armyPct: { fontFamily: FONT.num, fontSize: 20 },
    armyBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 },
    roarBtn: { height: 44, borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
    roarBtnText: { fontFamily: FONT.black, fontSize: 14 },
    rivalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 2 },
    presence: { width: 8, height: 8, borderRadius: 4 },
    momentRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
    momentDivider: { borderTopWidth: 1, borderTopColor: THEME.raised },
    momentOver: { width: 38, fontFamily: FONT.numBold, fontSize: 20, color: THEME.muted },
    momentTitle: { fontFamily: FONT.bold, fontSize: 14, color: THEME.text, flexShrink: 1 },
    demo: { alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: THEME.dropLine, marginTop: 4 },
    demoText: { fontFamily: FONT.bold, fontSize: 14, color: THEME.dropText },
});
