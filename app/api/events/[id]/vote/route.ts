import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const { user, slots } = body;

        if (!user || user.trim() === '') {
            return NextResponse.json({ error: 'User name required' }, { status: 400 });
        }

        const updatedEvent = db.addVote(params.id, { user, slots });

        if (!updatedEvent) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
