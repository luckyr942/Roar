// Live banter rooms over WebSocket: fans with the same room code get each other's roasts instantly.
// Why: roasting your rival is only fun in real time; every roast is also saved to MongoDB.

import { WebSocketServer } from 'ws';
import { collections } from './db.mjs';

const MAX_TEXT = 280;
const HISTORY_SIZE = 20;
const rooms = new Map(); // room code → Set of open sockets

function membersOf(room) {
    return [...(rooms.get(room) ?? [])].map((socket) => ({ name: socket.fan.name, team: socket.fan.team }));
}

function sendToRoom(room, message, skipSocket) {
    const data = JSON.stringify(message);
    for (const socket of rooms.get(room) ?? []) {
        if (socket !== skipSocket && socket.readyState === socket.OPEN) socket.send(data);
    }
}

function leaveRoom(socket) {
    const room = socket.fan?.room;
    if (!room || !rooms.has(room)) return;
    rooms.get(room).delete(socket);
    if (rooms.get(room).size === 0) rooms.delete(room);
    else sendToRoom(room, { type: 'presence', members: membersOf(room) });
}

async function joinRoom(socket, message) {
    leaveRoom(socket);
    const room = String(message.room ?? '').trim().toUpperCase().slice(0, 12);
    if (!room) return;

    socket.fan = {
        room,
        fanId: String(message.fanId ?? '').slice(0, 80),
        name: String(message.name ?? 'Fan').slice(0, 24),
        team: message.team === 'CSK' ? 'CSK' : 'MI',
    };
    if (!rooms.has(room)) rooms.set(room, new Set());
    rooms.get(room).add(socket);
    sendToRoom(room, { type: 'presence', members: membersOf(room) });

    // Send the newcomer the recent chat from the database.
    const history = await collections.roasts.find({ room }).sort({ at: -1 }).limit(HISTORY_SIZE).toArray();
    socket.send(JSON.stringify({ type: 'history', roasts: history.map(({ _id, ...roast }) => ({ id: String(_id), ...roast })) }));
}

async function sendRoast(socket, message) {
    if (!socket.fan) return;
    const roast = {
        room: socket.fan.room,
        fanId: socket.fan.fanId,
        from: socket.fan.name,
        team: socket.fan.team,
        text: String(message.text ?? '').slice(0, MAX_TEXT),
        tag: String(message.tag ?? '').slice(0, 40),
        at: Date.now(),
    };
    if (!roast.text) return;

    sendToRoom(roast.room, { type: 'roast', id: String(message.id ?? roast.at), ...roast }, socket);
    await collections.roasts.insertOne({ ...roast });
}

export function startRoastRooms(httpServer) {
    const wss = new WebSocketServer({ server: httpServer });
    // Start-up errors (like "port in use") are handled once in index.mjs; don't crash here.
    wss.on('error', () => {});

    wss.on('connection', (socket) => {
        socket.on('message', (raw) => {
            let message;
            try {
                message = JSON.parse(String(raw));
            } catch {
                return; // ignore anything that isn't JSON
            }
            const handle = message.type === 'join' ? joinRoom : message.type === 'roast' ? sendRoast : null;
            handle?.(socket, message).catch((error) => console.error('roast room:', error.message));
        });
        socket.on('close', () => leaveRoom(socket));
    });
}
