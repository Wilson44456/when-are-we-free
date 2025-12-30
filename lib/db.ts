import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

// Types
export interface Vote {
    user: string;
    slots: string[]; // Format: "yyyy-MM-dd-hour"
}

export interface EventData {
    id: string;
    startDate: string; // ISO string
    endDate: string;   // ISO string
    participants: Vote[];
}

// ---------------------------------------------------------
// Local FileSystem Implementation (for Development)
// ---------------------------------------------------------
const DB_PATH = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_PATH, 'events.json');

const ensureLocalDbInit = () => {
    if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH);
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({}));
};

const localDb = {
    getEvent: async (id: string): Promise<EventData | null> => {
        ensureLocalDbInit();
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        return data[id] || null;
    },

    createEvent: async (event: EventData) => {
        ensureLocalDbInit();
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        data[event.id] = event;
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return event;
    },

    addVote: async (eventId: string, vote: Vote) => {
        ensureLocalDbInit();
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        if (!data[eventId]) return null;

        const event = data[eventId] as EventData;
        const existingIdx = event.participants.findIndex(p => p.user === vote.user);

        if (existingIdx >= 0) {
            event.participants[existingIdx] = vote;
        } else {
            event.participants.push(vote);
        }

        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return event;
    }
};

// ---------------------------------------------------------
// Vercel KV Implementation (for Production)
// ---------------------------------------------------------
const kvDb = {
    getEvent: async (id: string): Promise<EventData | null> => {
        return await kv.get<EventData>(`event:${id}`);
    },

    createEvent: async (event: EventData) => {
        await kv.set(`event:${event.id}`, event);
        return event;
    },

    addVote: async (eventId: string, vote: Vote) => {
        // We need to fetch, update, and save back (Optimistic locking omitted for simplicity)
        const event = await kv.get<EventData>(`event:${eventId}`);
        if (!event) return null;

        const existingIdx = event.participants.findIndex(p => p.user === vote.user);
        if (existingIdx >= 0) {
            event.participants[existingIdx] = vote;
        } else {
            event.participants.push(vote);
        }

        await kv.set(`event:${eventId}`, event);
        return event;
    }
};

// ---------------------------------------------------------
// Export Logic
// ---------------------------------------------------------
// Auto-switch: Use KV if env vars are present, otherwise use local file
const useKv = !!process.env.KV_REST_API_URL;

export const db = useKv ? kvDb : localDb;
