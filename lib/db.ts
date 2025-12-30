import fs from 'fs';
import path from 'path';

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

const DB_PATH = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_PATH, 'events.json');

// Ensure DB exists
if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_PATH);
}
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({}));
}

// Helpers
export const db = {
    getEvent: (id: string): EventData | null => {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        return data[id] || null;
    },

    createEvent: (event: EventData) => {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        data[event.id] = event;
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return event;
    },

    addVote: (eventId: string, vote: Vote) => {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        if (!data[eventId]) return null;

        const event = data[eventId] as EventData;

        // Check if user already voted, update if so
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
