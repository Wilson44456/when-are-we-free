"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
    format,
    eachDayOfInterval,
    addDays,
    isSameDay
} from 'date-fns';
import { cn } from '@/lib/utils';

interface TimeGridProps {
    startDate: Date;
    endDate: Date;
    onChange?: (selectedSlots: string[]) => void;
    initialSlots?: string[];
    mode?: 'input' | 'heatmap';
    heatmapData?: Record<string, number>;
    maxParticipants?: number;
}

export function TimeGrid({
    startDate,
    endDate,
    onChange,
    initialSlots = [],
    mode = 'input',
    heatmapData = {},
    maxParticipants = 1
}: TimeGridProps) {
    // Generate days based on range
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Generate hours (e.g., 9 AM to 11 PM)
    const hours = Array.from({ length: 15 }, (_, i) => i + 9); // 9 to 23

    // State
    const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set(initialSlots));
    const [isDragging, setIsDragging] = useState(false);
    const [isAdding, setIsAdding] = useState(true); // true = adding, false = removing

    const containerRef = useRef<HTMLDivElement>(null);

    // Helper to generate IDs
    const getSlotId = (date: Date, hour: number) => {
        return `${format(date, 'yyyy-MM-dd')}-${hour}`;
    };

    const handleMouseDown = (slotId: string) => {
        if (mode === 'heatmap') return; // Read-only

        setIsDragging(true);
        const newSet = new Set(selectedSlots);

        if (newSet.has(slotId)) {
            newSet.delete(slotId);
            setIsAdding(false);
        } else {
            newSet.add(slotId);
            setIsAdding(true);
        }

        setSelectedSlots(newSet);
        onChange?.(Array.from(newSet));
    };

    const handleMouseEnter = (slotId: string) => {
        if (mode === 'heatmap') return;
        if (!isDragging) return;

        const newSet = new Set(selectedSlots);
        if (isAdding) {
            newSet.add(slotId);
        } else {
            newSet.delete(slotId);
        }

        setSelectedSlots(newSet);
        onChange?.(Array.from(newSet));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Global mouse up to catch drags that end outside component
    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    const getCellStyles = (slotId: string, isSelected: boolean) => {
        if (mode === 'heatmap') {
            const count = heatmapData[slotId] || 0;
            const opacity = maxParticipants > 0 ? (count / maxParticipants) : 0;

            // Calculate color intensity (Blue)
            // We use rgba to handle opacity cleanly
            if (count === 0) return "bg-white dark:bg-slate-900/40";

            // Helper for tailwind-like colors (Blue-600 is roughly #2563eb)
            return { backgroundColor: `rgba(37, 99, 235, ${Math.max(0.1, opacity)})` };
        }

        // Input Mode
        if (isSelected) return "bg-green-500 hover:bg-green-400";
        return "bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800";
    };

    return (
        <div className="select-none overflow-x-auto pb-4" ref={containerRef}>
            <div className="inline-block min-w-full">
                <div className="flex">
                    {/* Time Labels Column */}
                    <div className="flex flex-col pt-10 sticky left-0 z-20 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 pr-2">
                        {hours.map(h => (
                            <div key={h} className="h-10 text-xs text-slate-400 text-right pr-2 -translate-y-1/2">
                                {h}:00
                            </div>
                        ))}
                    </div>

                    {/* Days Columns */}
                    <div className="flex">
                        {days.map((day, dayIdx) => (
                            <div key={dayIdx} className="flex flex-col flex-1 min-w-[80px]">
                                {/* Header */}
                                <div className="h-10 text-center border-b border-slate-200 dark:border-slate-800 mb-2 sticky top-0 bg-slate-50 dark:bg-slate-950 z-10 px-1">
                                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        {format(day, 'EEE')}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {format(day, 'MMM d')}
                                    </div>
                                </div>

                                {/* Slots */}
                                <div className="flex flex-col gap-[1px] bg-slate-100 dark:bg-slate-800/50">
                                    {hours.map(hour => {
                                        const slotId = getSlotId(day, hour);
                                        const isSelected = selectedSlots.has(slotId);
                                        const styles = getCellStyles(slotId, isSelected);
                                        const count = heatmapData[slotId] || 0;

                                        return (
                                            <div
                                                key={slotId}
                                                onMouseDown={() => handleMouseDown(slotId)}
                                                onMouseEnter={() => handleMouseEnter(slotId)}
                                                style={typeof styles === 'object' ? styles : undefined}
                                                className={cn(
                                                    "h-10 cursor-pointer transition-colors duration-150 relative group border-r border-dashed border-slate-200/50 dark:border-slate-800/50 last:border-r-0 flex items-center justify-center",
                                                    typeof styles === 'string' ? styles : ''
                                                )}
                                                title={mode === 'heatmap' ? `${count}/${maxParticipants} available` : undefined}
                                            >
                                                {/* Optional: Add hover visual indicator */}
                                                {mode === 'input' && !isSelected && <div className="hidden group-hover:block absolute inset-0 bg-blue-400/20 pointer-events-none" />}

                                                {/* Heatmap Count (Optional, only show if space permits or on hover) */}
                                                {mode === 'heatmap' && count > 0 && (
                                                    <span className="text-[10px] font-bold text-blue-900/70 dark:text-white/70 pointer-events-none">
                                                        {count}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-4 text-center text-sm text-slate-500">
                {mode === 'input'
                    ? "Click and drag to paint your availability."
                    : "Darker colors indicate more people are free."}
            </div>
        </div>
    );
}
