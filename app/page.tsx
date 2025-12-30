import Link from "next/link";
import { ArrowRight, Calendar, Users, Clock } from "lucide-react";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 relative overflow-hidden">

            {/* Hero Section */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-700">

                <div className="inline-flex items-center px-4 py-2 rounded-full border border-slate-200 bg-white/50 backdrop-blur-sm text-slate-600 text-sm font-medium mb-4 shadow-sm dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-300">
                    <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
                    No more group chat chaos
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                    Find the Perfect Time <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        For Everyone.
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                    The visual way to schedule meetings. Create a grid, share the link, and let your group paint their free time. See the overlap instantly.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Link
                        href="/create"
                        className="group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-white transition-all duration-200 bg-blue-600 rounded-full hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Create an Event <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </Link>

                    <button className="inline-flex items-center justify-center px-8 py-4 font-semibold text-slate-700 transition-all duration-200 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">
                        View Example
                    </button>
                </div>
            </div>

            {/* Feature Grid / Visuals */}
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl z-10">
                {[
                    { icon: Calendar, title: "Select Dates", desc: "Pick a range of dates for your potential meetup." },
                    { icon: Users, title: "Share Link", desc: "Send a unique link to your friends or colleagues." },
                    { icon: Clock, title: "Visual Overlap", desc: "Instantly see the heatmap of when everyone is free." }
                ].map((feature, idx) => (
                    <div key={idx} className="glass-panel p-8 rounded-2xl flex flex-col items-start hover:scale-105 transition-transform duration-300 cursor-default">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 dark:bg-blue-900/30 dark:text-blue-400">
                            <feature.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
            </div>

        </main>
    );
}
