
import React from 'react';
import { Lightbulb } from 'lucide-react';

export const Header: React.FC = () => {
    return (
        <header className="bg-slate-900/70 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-700/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-3">
                         <div className="bg-indigo-500 p-2 rounded-lg">
                            <Lightbulb className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                            Content Goldmine <span className="text-indigo-400">AI</span>
                        </h1>
                    </div>
                </div>
            </div>
        </header>
    );
};
