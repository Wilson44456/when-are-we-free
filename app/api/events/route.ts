import { NextResponse } from 'next/server';
import { db, EventData } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { start, end } = body;

        if (!start || !end) {
            return NextResponse.json({ error: 'Missing dates' }, { status: 400 });
        }

        const newEvent: EventData = {
            id: Math.random().toString(36).substring(2, 8), // Short ID
            startDate: start,
            endDate: end,
            participants: []
        };

        await db.createEvent(newEvent);

        return NextResponse.json({ id: newEvent.id });
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
