"use client";

import React, { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isWithinInterval,
    startOfWeek,
    endOfWeek
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangeSelectorProps {
    onRangeChange: (range: { start: Date | null; end: Date | null }) => void;
}

export function DateRangeSelector({ onRangeChange }: DateRangeSelectorProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const handleDayClick = (day: Date) => {
        if (!startDate || (startDate && endDate)) {
            // Start a new selection
            setStartDate(day);
            setEndDate(null);
            onRangeChange({ start: day, end: null });
        } else {
            // Complete the selection
            let newStart = startDate;
            let newEnd = day;

            if (day < startDate) {
                newStart = day;
                newEnd = startDate;
            }

            setStartDate(newStart);
            setEndDate(newEnd);
            onRangeChange({ start: newStart, end: newEnd });
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDateCalendar = startOfWeek(monthStart);
    const endDateCalendar = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: startDateCalendar,
        end: endDateCalendar
    });

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
        <div className="p-4 bg-white/50 backdrop-blur-md border border-slate-200 rounded-2xl shadow-sm dark:bg-slate-900/50 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-2">
                {weekDays.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                    const isSelected = (startDate && isSameDay(day, startDate)) || (endDate && isSameDay(day, endDate));
                    const isInRange = startDate && endDate && isWithinInterval(day, { start: startDate, end: endDate });
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

                    return (
                        <button
                            key={idx}
                            onClick={() => handleDayClick(day)}
                            className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all duration-200 relative",
                                !isCurrentMonth && "text-slate-300 dark:text-slate-700",
                                isCurrentMonth && "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                                isInRange && "bg-blue-100 text-blue-700 rounded-none dark:bg-blue-900/30 dark:text-blue-300",
                                isSelected && "bg-blue-600 text-white rounded-full shadow-md scale-105 z-10 hover:bg-blue-700 dark:bg-blue-500",
                                // Round edges of range
                                isInRange && isSameDay(day, startDate!) && "rounded-l-full",
                                isInRange && isSameDay(day, endDate!) && "rounded-r-full"
                            )}
                        >
                            {format(day, 'd')}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 text-center text-sm text-slate-500">
                {!startDate ? "Select a start date" : !endDate ? "Select an end date" :
                    `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`}
            </div>
        </div>
    );
}
