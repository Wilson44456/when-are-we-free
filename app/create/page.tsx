"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DateRangeSelector } from '@/components/date-range-selector';
import { TimeGrid } from '@/components/time-grid';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Make sure this import exists

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // We don't necessarily need selectedSlots in step 1 anymore, 
  // since we just want to create the event with a date range first.
  const isRangeValid = dateRange.start && dateRange.end;

  const handleCreate = async () => {
    if (!dateRange.start || !dateRange.end) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString()
        })
      });

      if (!res.ok) throw new Error('Failed to create event');

      const data = await res.json();
      router.push(`/event/${data.id}`);
    } catch (error) {
      console.error(error);
      alert('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-500">

      {/* Navbar / Header */}
      <header className="p-6">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start pt-10 px-4 pb-20">

        <div className="max-w-4xl w-full space-y-8">

          {/* Progress Indicators */}
          <div className="flex justify-center space-x-2 mb-8">
            <div className={`h-1 w-16 rounded-full transition-colors ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            <div className={`h-1 w-16 rounded-full transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {step === 1 ? "When is it happening?" : "Review & Create"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {step === 1 ? "Select the potential dates for your event." : "Confirm the range for your group."}
            </p>
          </div>

          <div className="flex justify-center min-h-[400px]">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <DateRangeSelector onRangeChange={setDateRange} />
              </div>
            )}

            {step === 2 && dateRange.start && dateRange.end && (
              <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 animate-in fade-in slide-in-from-right-8 duration-500 flex flex-col items-center text-center">
                <h3 className="text-xl font-bold mb-4">You're all set!</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  You chose a range of <span className="font-semibold text-blue-600">{Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1} days</span>.
                  <br />
                  Create the event to get a shareable link.
                </p>

                {/* Preview TimeGrid could go here, but omitted for simplicity in flow */}
              </div>
            )}
          </div>

          <div className="pt-8 flex justify-center gap-4">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-full font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              >
                Back
              </button>
            )}

            <button
              disabled={!isRangeValid || isSubmitting}
              className={cn(
                "group flex items-center justify-center px-8 py-3 rounded-full font-semibold transition-all duration-300",
                isRangeValid
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:scale-105 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600',
                isSubmitting && 'opacity-80 cursor-wait'
              )}
              onClick={() => {
                if (step === 1) {
                  setStep(2);
                } else {
                  handleCreate();
                }
              }}
            >
              {isSubmitting ? (
                <>Creating <Loader2 className="ml-2 w-4 h-4 animate-spin" /></>
              ) : (
                step === 1 ? "Continue" : "Create Event"
              )}
              {!isSubmitting && <ArrowRight className={cn(
                "w-5 h-5 ml-2 transition-transform duration-300",
                isRangeValid ? 'group-hover:translate-x-1' : ''
              )} />}
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}
