// One live WebSocket to the roast room, shared by the whole app.
// Why: roasts must arrive instantly and reconnect by themselves if Wi-Fi drops.

import { create } from 'zustand';
import type { Team } from '@/lib/match/types';
import { hasServer, socketUrl } from '@/lib/api';

const RETRY_MS = 3000;

export type RoastMsg = { id: string; from: string; team: Team; text: string; tag: string; at: number; mine: boolean } & RoastExtras;

export type RoastExtras = { sound?: string | null; voiceId?: string | null; stickers?: string[] };
type Member = { name: string; team: Team };

type RivalState = {
    status: 'off' | 'connecting' | 'online';
    members: Member[];
    messages: RoastMsg[];
    toast: RoastMsg | null;
    dismissToast: () => void;
};

export const useRival = create<RivalState>((set) => ({
    status: 'off',
    members: [],
    messages: [],
    toast: null,
    dismissToast: () => set({ toast: null }),
}));

let socket: WebSocket | null = null;
let wanted: { room: string; fanId: string; name: string; team: Team } | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function connect() {
    if (!wanted || !hasServer()) return;
    if (retryTimer) clearTimeout(retryTimer);
    socket?.close();

    useRival.setState({ status: 'connecting' });
    const ws = new WebSocket(socketUrl());
    socket = ws;

    ws.onopen = () => {
        if (!wanted) return;
        useRival.setState({ status: 'online' });
        ws.send(JSON.stringify({ type: 'join', ...wanted }));
    };

    ws.onmessage = (event) => {
        let msg: any;
        try {
            msg = JSON.parse(String(event.data));
        } catch {
            return;
        }
        if (msg.type === 'presence') useRival.setState({ members: msg.members });
        if (msg.type === 'history') {
            const myFanId = wanted?.fanId;
            const history: RoastMsg[] = msg.roasts.map((r: Omit<RoastMsg, 'mine'> & { fanId: string }) => ({ ...r, mine: r.fanId === myFanId }));
            useRival.setState({ messages: history });
        }
        if (msg.type === 'roast') {
            const roast: RoastMsg = { ...msg, mine: false };
            useRival.setState((s) => ({ messages: [roast, ...s.messages].slice(0, 50), toast: roast }));
        }
    };

    ws.onclose = () => {
        if (socket !== ws) return;
        socket = null;
        useRival.setState({ status: wanted ? 'connecting' : 'off', members: [] });
        if (wanted) retryTimer = setTimeout(connect, RETRY_MS);
    };
}

export function joinRoom(room: string, fanId: string, name: string, team: Team) {
    const code = room.trim().toUpperCase();
    if (!code) return;
    wanted = { room: code, fanId, name, team };
    connect();
}

export function leaveRoom() {
    wanted = null;
    if (retryTimer) clearTimeout(retryTimer);
    socket?.close();
    socket = null;
    useRival.setState({ status: 'off', members: [] });
}

export function sendRoast(text: string, tag: string, extras: RoastExtras = {}): boolean {
    if (!socket || socket.readyState !== WebSocket.OPEN || !wanted) return false;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    socket.send(JSON.stringify({ type: 'roast', id, text, tag, ...extras }));
    const mine: RoastMsg = { id, from: wanted.name, team: wanted.team, text, tag, ...extras, at: Date.now(), mine: true };
    useRival.setState((s) => ({ messages: [mine, ...s.messages].slice(0, 50) }));
    return true;
}

export const rivalHere = (members: Member[]) => members.length > 1;
