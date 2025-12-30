"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { TimeGrid } from '@/components/time-grid';
import { ArrowLeft, Share2, Copy, Check, Loader2, User, RefreshCw, ArrowRight, QrCode, X } from 'lucide-react';

interface EventData {
    id: string;
    startDate: string;
    endDate: string;
    participants: { user: string; slots: string[] }[];
}

export default function EventPage({ params }: { params: { id: string } }) {
    const [event, setEvent] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // User State
    const [guestName, setGuestName] = useState('');
    const [isNameSet, setIsNameSet] = useState(false);
    const [mySlots, setMySlots] = useState<string[]>([]);

    // View State
    const [viewMode, setViewMode] = useState<'input' | 'heatmap'>('input');
    const [copied, setCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showQR, setShowQR] = useState(false); // New state for QR Modal

    // Polling Ref
    const isFirstLoad = useRef(true);

    // 1. Fetch Event & Polling
    const fetchEvent = async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const res = await fetch(`/api/events/${params.id}`);
            if (!res.ok) throw new Error('Event not found');
            const data: EventData = await res.json();
            setEvent(data);
            return data;
        } catch (err) {
            if (showLoading) setError('Event not found');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    // Initial Load + Polling Setup
    useEffect(() => {
        // Determine user from LocalStorage
        const savedName = localStorage.getItem(`event_user_${params.id}`);
        if (savedName) {
            setGuestName(savedName);
            setIsNameSet(true);
        }

        // First fetch
        fetchEvent(true).then((data) => {
            // Restore slots if user exists
            if (savedName && data) {
                // Safety check: ensure participants exists
                const participants = Array.isArray(data.participants) ? data.participants : [];
                const myVote = participants.find(p => p.user === savedName);

                if (myVote) {
                    setMySlots(myVote.slots);
                    // Automatically show heatmap if I've already voted
                    if (myVote.slots.length > 0) setViewMode('heatmap');
                }
            }
            isFirstLoad.current = false;
        });

        // Start Polling (every 3 seconds)
        const interval = setInterval(() => {
            fetchEvent(false);
        }, 3000);

        return () => clearInterval(interval);
    }, [params.id]);

    // 2. Handle Login / Name Set
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestName.trim()) return;

        localStorage.setItem(`event_user_${params.id}`, guestName);
        setIsNameSet(true);

        // Check if this user already has data on server
        if (event) {
            const participants = Array.isArray(event.participants) ? event.participants : [];
            const myVote = participants.find(p => p.user === guestName);
            if (myVote) {
                setMySlots(myVote.slots);
                if (myVote.slots.length > 0) setViewMode('heatmap');
            }
        }
    };

    // 3. Handle Vote Submission
    const handleSave = async () => {
        if (!guestName) return;
        setIsSaving(true);
        try {
            await fetch(`/api/events/${params.id}/vote`, {
                method: 'POST',
                body: JSON.stringify({ user: guestName, slots: mySlots })
            });
            await fetchEvent(false); // Immediate refresh
            setViewMode('heatmap');
        } catch (e) {
            alert('Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const getShareUrl = () => {
        if (typeof window === 'undefined') return '';
        let url = window.location.href;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            url = url.replace(window.location.hostname, '192.168.0.101');
        }
        return url;
    };

    const handleCopy = async () => {
        const url = getShareUrl();
        try {
            // Try modern Clipboard API first (works on localhost / HTTPS)
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                setCopied(true);
            } else {
                throw new Error('Clipboard API not available');
            }
        } catch (err) {
            // Fallback for non-secure contexts (e.g., HTTP on LAN)
            try {
                const textArea = document.createElement("textarea");
                textArea.value = url;

                // Move off-screen
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";

                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (successful) {
                    setCopied(true);
                } else {
                    throw new Error('Fallback copy failed');
                }
            } catch (fallbackErr) {
                // Absolute last resort: Prompt user
                window.prompt("Copy to clipboard: Ctrl+C, Enter", url);
            }
        }
        setTimeout(() => setCopied(false), 2000);
    };

    // Calculate Heatmap Data
    const heatmapData = React.useMemo(() => {
        if (!event) return {};
        const counts: Record<string, number> = {};

        // Safety check: ensure participants exists and is an array
        const participants = Array.isArray(event.participants) ? event.participants : [];

        participants.forEach(p => {
            if (Array.isArray(p.slots)) {
                p.slots.forEach(slot => {
                    counts[slot] = (counts[slot] || 0) + 1;
                });
            }
        });
        return counts;
    }, [event]);

    if (loading && isFirstLoad.current) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    if (error || !event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
                <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
                <p className="text-slate-500 mb-4">This event might have expired or the link is incorrect.</p>
                <Link href="/" className="text-blue-600 hover:underline">Create a new one</Link>
            </div>
        );
    }

    // Guest Name Modal
    if (!isNameSet) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <User className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-center mb-2">Welcome!</h2>
                    <p className="text-center text-slate-500 mb-6">Enter your name to join this event.</p>

                    <form onSubmit={handleLogin}>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Your Name (e.g. Eren)"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mb-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={guestName}
                            onChange={e => setGuestName(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!guestName.trim()}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Continue
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">

            {/* Header */}
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 transition-all">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Home
                    </Link>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center text-sm text-slate-500 mr-4">
                            Logged in as <span className="font-bold text-blue-600 dark:text-blue-400 ml-1">{guestName}</span>
                        </div>

                        <button
                            onClick={() => setShowQR(true)}
                            className="inline-flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-3 md:py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                            title="Show QR Code"
                        >
                            <QrCode className="w-4 h-4 md:mr-1" />
                            <span className="hidden md:inline">QR Code</span>
                        </button>

                        <button
                            onClick={handleCopy}
                            className="inline-flex items-center justify-center w-8 h-8 md:w-auto md:h-auto md:px-3 md:py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                            title="Copy Link"
                        >
                            {copied ? <Check className="w-4 h-4 md:mr-1" /> : <Copy className="w-4 h-4 md:mr-1" />}
                            <span className="hidden md:inline">{copied ? "Copied!" : "Share Link"}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* QR Modal */}
            {showQR && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col items-center">
                        <button
                            onClick={() => setShowQR(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h3 className="text-lg font-bold mb-4 text-slate-900">Scan to Join</h3>
                        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-inner">
                            <QRCode
                                value={getShareUrl()}
                                size={200}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                        <p className="mt-4 text-sm text-slate-500 max-w-[200px] text-center break-all">
                            {getShareUrl()}
                        </p>
                    </div>
                </div>
            )}

            <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 flex flex-col items-center">

                <div className="text-center mb-8 space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                        Event Availability 🗓️
                    </h1>
                    <p className="text-slate-500 flex items-center justify-center gap-2">
                        <User className="w-4 h-4" /> {event.participants?.length || 0} responded
                        {/* Visual indicator for polling */}
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-2" title="Live updates active"></span>
                    </p>
                </div>

                {/* Toggle Switch */}
                <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-lg flex mb-8 items-center cursor-pointer relative">
                    <button
                        onClick={() => setViewMode('input')}
                        className={`flex-1 px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 z-10 ${viewMode === 'input'
                            ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                            }`}
                    >
                        My Vote
                    </button>
                    <button
                        onClick={() => setViewMode('heatmap')}
                        className={`flex-1 px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 z-10 ${viewMode === 'heatmap'
                            ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                            }`}
                    >
                        Group Heatmap
                    </button>
                </div>

                {/* Main Grid Card */}
                <div className="w-full bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 overflow-hidden relative">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                            {viewMode === 'input' ? `Select times you are free` : 'Heatmap: Darker = Better'}
                        </h2>
                        {viewMode === 'heatmap' && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="w-3 h-3 bg-blue-100 rounded"></span>
                                <ArrowRight className="w-3 h-3" />
                                <span className="w-3 h-3 bg-blue-600 rounded"></span>
                            </div>
                        )}
                    </div>

                    <TimeGrid
                        startDate={new Date(event.startDate)}
                        endDate={new Date(event.endDate)}
                        onChange={setMySlots}
                        initialSlots={mySlots}
                        mode={viewMode}
                        heatmapData={heatmapData}
                        maxParticipants={event.participants?.length || 1}
                    />
                </div>

                {/* Action Bar (Only in Input Mode) */}
                {viewMode === 'input' && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
                        <button
                            disabled={isSaving}
                            className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-8 py-3 rounded-full font-bold shadow-2xl hover:scale-105 transition-all flex items-center disabled:opacity-70 disabled:scale-100 ring-2 ring-white dark:ring-slate-900"
                            onClick={handleSave}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                            {isSaving ? 'Saving...' : 'Save Availability'}
                        </button>
                    </div>
                )}

            </main>
        </div>
    );
}
