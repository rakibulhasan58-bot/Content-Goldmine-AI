
import React, { useState } from 'react';
import type { ContentIdea, Day } from '../types';
import { DAYS } from '../types';
import { X, CalendarPlus } from 'lucide-react';

interface ScheduleModalProps {
    idea: ContentIdea;
    onSchedule: (idea: ContentIdea, day: Day, time: string) => void;
    onClose: () => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ idea, onSchedule, onClose }) => {
    const [selectedDay, setSelectedDay] = useState<Day>(DAYS[0]);
    const [time, setTime] = useState('');

    const handleSchedule = () => {
        onSchedule(idea, selectedDay, time);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-lg font-bold text-white flex items-center">
                        <CalendarPlus className="h-5 w-5 mr-3 text-indigo-400" />
                        Schedule Idea
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-slate-300">"<strong>{idea.title}</strong>"</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="day" className="block text-sm font-medium text-slate-400 mb-2">
                                Day
                            </label>
                             <select
                                id="day"
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(e.target.value as Day)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition appearance-none"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                    backgroundPosition: 'right 0.5rem center',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundSize: '1.5em 1.5em',
                                }}
                            >
                                {DAYS.map(day => (
                                    <option key={day} value={day}>{day}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="time" className="block text-sm font-medium text-slate-400 mb-2">
                                Time (optional)
                            </label>
                            <input
                                type="time"
                                id="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            />
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end">
                     <button
                        onClick={handleSchedule}
                        className="w-full sm:w-auto flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                    >
                        <CalendarPlus className="h-5 w-5 mr-2" />
                        Add to Schedule
                    </button>
                </div>
            </div>
        </div>
    );
};
