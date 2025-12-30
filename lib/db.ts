import fs from 'fs';
import path from 'path';
import Redis from 'ioredis';

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

// --- Local File Implementation (For Development) ---
// Initialize paths lazily/safely or outside, but ensures we only access FS in dev
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

        // Find existing vote
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

// --- Redis Implementation (Production / Standard Redis) ---
// Only initialize if REDIS_URL is present to prevent connection errors in dev
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

const redisDb = {
    getEvent: async (id: string): Promise<EventData | null> => {
        if (!redis) return null;
        const data = await redis.get(`event:${id}`);
        return data ? JSON.parse(data) : null;
    },

    createEvent: async (event: EventData) => {
        if (!redis) throw new Error("Redis not configured");
        // Save event via Redis, set to auto-expire in 90 days (7776000 seconds)
        await redis.set(`event:${event.id}`, JSON.stringify(event), 'EX', 7776000);
        return event;
    },

    addVote: async (eventId: string, vote: Vote) => {
        if (!redis) throw new Error("Redis not configured");
        // Optimistic locking / Transaction recommended for high concurrency but okay for MVP
        const data = await redis.get(`event:${eventId}`);
        if (!data) return null;

        const event = JSON.parse(data) as EventData;
        const existingIdx = event.participants.findIndex(p => p.user === vote.user);

        if (existingIdx >= 0) {
            event.participants[existingIdx] = vote;
        } else {
            event.participants.push(vote);
        }

        // Save and refresh expiration (another 90 days)
        await redis.set(`event:${eventId}`, JSON.stringify(event), 'EX', 7776000);
        return event;
    }
};

// Export Logic: Prefer Redis if configured, otherwise fallback to local file
export const db = redis ? redisDb : localDb;
