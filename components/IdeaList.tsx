import React, { useState, useEffect } from 'react';
import type { ContentIdea } from '../types';
import { BookOpen, CalendarPlus, Lightbulb, Twitter, Linkedin } from 'lucide-react';

interface IdeaListProps {
    ideas: ContentIdea[];
    onExpand: (idea: ContentIdea) => void;
    onSchedule: (idea: ContentIdea) => void;
}

const IdeaListItem: React.FC<{ idea: ContentIdea; onExpand: (idea: ContentIdea) => void; onSchedule: (idea: ContentIdea) => void; }> = ({ idea, onExpand, onSchedule }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    const handleLinkedInCopy = () => {
        const text = `Sharing a new content idea: "${idea.title}"\n\n#ContentStrategy #Marketing`;
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            window.open('https://www.linkedin.com/feed/', '_blank');
        });
    };

    return (
        <li className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:bg-slate-700/80 transition">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 flex-grow min-w-0 mr-2">
                    <p className="text-slate-200 font-medium truncate">{idea.title}</p>
                    {idea.isDraft && (
                        <span className="bg-slate-600 text-indigo-300 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Draft</span>
                    )}
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                        onClick={() => {
                            const text = `Just generated a new content idea with AI: "${idea.title}" #ContentCreation #AI`;
                            const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                            window.open(url, '_blank');
                        }}
                        title="Share on Twitter"
                        className="p-1.5 text-slate-400 hover:text-[#1DA1F2] hover:bg-slate-600 rounded-md transition"
                    >
                        <Twitter className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleLinkedInCopy}
                        title="Copy for LinkedIn"
                        className="p-1.5 text-slate-400 hover:text-[#0A66C2] hover:bg-slate-600 rounded-md transition"
                    >
                        <Linkedin className="h-5 w-5" />
                    </button>
                    <button onClick={() => onExpand(idea)} title="Expand Idea" className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-600 rounded-md transition">
                        <BookOpen className="h-5 w-5" />
                    </button>
                    <button onClick={() => onSchedule(idea)} title="Add to Schedule" className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-600 rounded-md transition">
                        <CalendarPlus className="h-5 w-5" />
                    </button>
                </div>
            </div>
            {copied && <p className="text-xs text-green-400 text-right mt-1 animate-pulse">Copied! Opening LinkedIn...</p>}
        </li>
    );
};


export const IdeaList: React.FC<IdeaListProps> = ({ ideas, onExpand, onSchedule }) => {
    if (ideas.length === 0) {
        return (
            <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700 flex flex-col items-center justify-center h-full text-center">
                <Lightbulb className="h-12 w-12 text-slate-500 mb-4" />
                <h3 className="text-lg font-semibold text-white">Your Ideas Will Appear Here</h3>
                <p className="text-slate-400 text-sm">Enter a topic above to get started!</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">2. Your Generated Ideas</h2>
            <ul className="space-y-3 max-h-[calc(100vh-450px)] overflow-y-auto pr-2">
                {ideas.map((idea) => (
                    <IdeaListItem key={idea.id} idea={idea} onExpand={onExpand} onSchedule={onSchedule} />
                ))}
            </ul>
        </div>
    );
};
