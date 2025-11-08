
import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface IdeaGeneratorProps {
    onGenerate: (topic: string) => void;
    isLoading: boolean;
}

export const IdeaGenerator: React.FC<IdeaGeneratorProps> = ({ onGenerate, isLoading }) => {
    const [topic, setTopic] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (topic.trim() && !isLoading) {
            onGenerate(topic);
        }
    };

    return (
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">1. Generate Content Ideas</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-slate-300 mb-2">
                        Enter a topic or keyword
                    </label>
                    <input
                        type="text"
                        id="topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., 'React performance tips'"
                        className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading || !topic.trim()}
                    className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                >
                    {isLoading ? (
                        <>
                           <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-5 w-5 mr-2" />
                            Generate Ideas
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};
