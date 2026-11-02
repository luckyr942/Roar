// Reaction Wall: every fan's posted reaction, with votes and the Reaction of the Match.
// Why: seeing other fans lose it too makes the moment shared.

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { FONT, THEME } from '../constants/theme';
import { useRoar } from '@/lib/store';
import { loadWall, photoUrl, voteOnWall } from '@/lib/api';
import { Label, TabBar } from '@/components/ui';

type Tile = { id: string; name: string; votes: number; hype: number; votedByMe: boolean; isMine: boolean; photo: string | null; over: string };

const DEMO_CROWD: Tile[] = [
    ['Aman · Pune', 128, 84],
    ['Priya · Dubai', 156, 91],
    ['Hostel B-4', 198, 99],
    ['Neha · Thane', 94, 78],
    ['Squad of 6', 112, 88],
    ['Kabir · Andheri', 88, 72],
    ['Riya · Bandra', 104, 80],
    ['Office crew', 116, 86],
].map(([name, votes, hype], i) => ({
    id: `demo-${i}`,
    name: String(name),
    votes: Number(votes),
    hype: Number(hype),
    votedByMe: false,
    isMine: false,
    photo: null,
    over: '19.6',
}));

function rank(tiles: Tile[]) {
    const maxVotes = Math.max(1, ...tiles.map((t) => t.votes));
    return tiles
        .map((t) => ({ ...t, score: (t.votes / maxVotes) * 100 * 0.7 + t.hype * 0.3 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
}

export default function ReactionWallScreen() {
    const fanId = useRoar((s) => s.fanId);
    const profile = useRoar((s) => s.profile);
    const myLatestPost = useRoar((s) => s.memories.find((m) => m.posted));

    const [tiles, setTiles] = useState<Tile[]>([]);
    const [isLive, setIsLive] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            loadWall(fanId)
                .then((posts) => {
                    if (cancelled) return;
                    if (posts.length === 0) throw new Error('nobody has posted yet');
                    setIsLive(true);
                    setTiles(
                        posts.map((p) => ({
                            id: p.memoryId,
                            name: p.isMine ? profile.name : p.name,
                            votes: p.votes,
                            hype: p.hype,
                            votedByMe: p.votedByMe,
                            isMine: p.isMine,
                            photo: p.photoId ? photoUrl(p.photoId) : null,
                            over: p.moment?.overText ?? '',
                        })),
                    );
                })
                .catch(() => {
                    if (cancelled) return;
                    setIsLive(false);
                    const me: Tile = {
                        id: 'me',
                        name: profile.name,
                        votes: 142,
                        hype: myLatestPost?.hype ?? 97,
                        votedByMe: false,
                        isMine: true,
                        photo: myLatestPost?.frameUri ?? null,
                        over: myLatestPost?.moment.overText ?? '19.6',
                    };
                    setTiles([me, ...DEMO_CROWD]);
                });
            return () => {
                cancelled = true;
            };
        }, [fanId, profile.name, myLatestPost]),
    );

    const vote = (tile: Tile) => {
        const flip = (t: Tile) => (t.id === tile.id ? { ...t, votedByMe: !t.votedByMe, votes: t.votes + (t.votedByMe ? -1 : 1) } : t);
        setTiles((all) => all.map(flip));
        if (!isLive) return;
        voteOnWall(tile.id, fanId)
            .then((result) => setTiles((all) => all.map((t) => (t.id === tile.id ? { ...t, ...result } : t))))
            .catch(() => setTiles((all) => all.map(flip)));
    };

    const over = tiles.find((t) => t.isMine)?.over || tiles[0]?.over || '19.6';

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView contentContainerStyle={styles.page}>
                <View style={{ gap: 6 }}>
                    <Label color={THEME.dropText}>REACTION WALL · {over}</Label>
                    <Text style={styles.title}>THE {profile.team === 'MI' ? 'PALTAN' : 'YELLOW ARMY'} LOST IT</Text>
                    <Text style={styles.sub}>
                        {isLive
                            ? `${tiles.length} ${tiles.length === 1 ? 'reaction' : 'reactions'} from fans. Tap a face to vote.`
                            :'Demo crowd: start the server and post a memory to see real fans.'}
                    </Text>
                </View>

                <View style={styles.grid}>
                    {tiles.slice(0, 12).map((t) => (
                        <Pressable
                            key={t.id}
                            accessibilityRole="button"
                            accessibilityLabel={`${t.name}, ${t.votes} votes${t.votedByMe ? ', you voted' : ''}`}
                            onPress={() => vote(t)}
                            style={[styles.tile, t.isMine && styles.tileMe, t.votedByMe && !t.isMine && styles.tileVoted]}
                        >
                            {t.photo ? <Image source={{ uri: t.photo }} style={[StyleSheet.absoluteFill, { opacity: 0.6 }]} resizeMode="cover" /> : null}
                            {t.isMine ? (
                                <View style={styles.youTag}>
                                    <Text style={styles.youText}>YOU</Text>
                                </View>
                            ) : t.votedByMe ? (
                                <View style={styles.row}>
                                    <Feather name="check" size={11} color={THEME.miText} />
                                    <Text style={styles.votedText}>VOTED</Text>
                                </View>
                            ) : (
                                <View />
                            )}
                            <View>
                                <Text style={styles.tileName} numberOfLines={1}>
                                    {t.name}
                                </Text>
                                <Text style={styles.tileVotes}>{t.votes} votes</Text>
                            </View>
                        </Pressable>
                    ))}
                </View>

                {tiles.length > 0 && (
                    <View style={styles.board}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.h2}>Reaction of the Match</Text>
                            <Text style={styles.small}>votes 70% · hype 30%</Text>
                        </View>
                        {rank(tiles).map((t, i) => (
                            <View key={t.id} style={[styles.rank, i > 0 && styles.rankDivider]}>
                                <Text style={[styles.rankNum, i === 0 && { color: THEME.roar }]}>{i + 1}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.rankName}>
                                        {t.name}
                                        {t.isMine ? <Text style={styles.youInline}>  YOU</Text> : null}
                                    </Text>
                                    <Text style={styles.small}>
                                        {t.votes} votes · hype {t.hype}
                                    </Text>
                                </View>
                                <Text style={styles.score}>{t.score.toFixed(1)}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
            <TabBar />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: THEME.bg },
    page: { padding: 20, paddingTop: 16, gap: 16, paddingBottom: 28 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    title: { fontFamily: FONT.num, fontSize: 46, lineHeight: 44, color: THEME.text },
    sub: { fontFamily: FONT.body, fontSize: 13, color: THEME.muted },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tile: { width: '31.8%', height: 104, borderRadius: 14, borderWidth: 1, borderColor: THEME.line, backgroundColor: THEME.surface, padding: 8, justifyContent: 'space-between', overflow: 'hidden' },
    tileMe: { borderWidth: 2, borderColor: THEME.roar, backgroundColor: '#1F1C10' },
    tileVoted: { borderColor: THEME.mi, backgroundColor: THEME.miDeep },
    youTag: { alignSelf: 'flex-start', backgroundColor: THEME.roar, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
    youText: { fontFamily: FONT.black, fontSize: 10, letterSpacing: 1, color: THEME.bg },
    votedText: { fontFamily: FONT.black, fontSize: 10, color: THEME.miText },
    tileName: { fontFamily: FONT.bold, fontSize: 12, color: THEME.text },
    tileVotes: { fontFamily: FONT.body, fontSize: 11, color: THEME.muted },
    board: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.line, borderRadius: 16, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
    h2: { fontFamily: FONT.bold, fontSize: 15, color: THEME.text },
    small: { fontFamily: FONT.body, fontSize: 12, color: THEME.muted },
    rank: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    rankDivider: { borderTopWidth: 1, borderTopColor: THEME.raised },
    rankNum: { width: 20, fontFamily: FONT.num, fontSize: 24, color: THEME.muted },
    rankName: { fontFamily: FONT.bold, fontSize: 14, color: THEME.text },
    youInline: { fontFamily: FONT.black, fontSize: 11, color: THEME.roar },
    score: { fontFamily: FONT.numBold, fontSize: 20, color: THEME.text },
});
