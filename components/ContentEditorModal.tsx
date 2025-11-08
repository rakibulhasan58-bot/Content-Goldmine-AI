
import React, { useState, useEffect } from 'react';
import type { ContentIdea } from '../types';
import { X, Twitter, Linkedin, FileText, Sparkles, Pilcrow, Save, Image as ImageIcon, Download, RefreshCw, Video } from 'lucide-react';

interface ContentEditorModalProps {
    idea: ContentIdea;
    isLoadingOutline: boolean;
    isLoadingFullContent: boolean;
    isLoadingImage: boolean;
    isLoadingVideo: boolean;
    onClose: () => void;
    onGenerateFullContent: (idea: ContentIdea) => void;
    onGenerateImage: (idea: ContentIdea) => void;
    onGenerateVideo: (idea: ContentIdea) => void;
    onSaveDraft: (idea: ContentIdea) => void;
}

type ActiveTab = 'outline' | 'fullContent' | 'image' | 'video';

// Helper function to convert simple markdown to HTML for better display
const renderMarkdown = (markdownText: string = ''): string => {
    if (!markdownText) return '';

    const lines = markdownText.split('\n');
    let html = '';
    let inList = false;

    const closeList = () => {
        if (inList) {
            html += '</ul>';
            inList = false;
        }
    };
    
    const applyInlineFormatting = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic
    };

    for (const line of lines) {
        if (line.startsWith('### ')) {
            closeList();
            html += `<h3>${applyInlineFormatting(line.substring(4))}</h3>`;
            continue;
        }
        if (line.startsWith('## ')) {
            closeList();
            html += `<h2>${applyInlineFormatting(line.substring(3))}</h2>`;
            continue;
        }
        if (line.startsWith('# ')) {
            closeList();
            html += `<h1>${applyInlineFormatting(line.substring(2))}</h1>`;
            continue;
        }
        if (line.startsWith('* ') || line.startsWith('- ')) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            html += `<li>${applyInlineFormatting(line.substring(2))}</li>`;
            continue;
        }
        
        closeList();

        if (line.trim() === '') {
            html += '<br />';
        } else {
            html += `<p>${applyInlineFormatting(line)}</p>`;
        }
    }

    closeList();

    return html;
};


export const ContentEditorModal: React.FC<ContentEditorModalProps> = ({ 
    idea, 
    isLoadingOutline, 
    isLoadingFullContent,
    isLoadingImage,
    isLoadingVideo,
    onClose,
    onGenerateFullContent,
    onGenerateImage,
    onGenerateVideo,
    onSaveDraft
}) => {
    const [summaryCopied, setSummaryCopied] = useState(false);
    const [fullContentCopied, setFullContentCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>('outline');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (summaryCopied) {
            const timer = setTimeout(() => setSummaryCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [summaryCopied]);
    
    useEffect(() => {
        if (fullContentCopied) {
            const timer = setTimeout(() => setFullContentCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [fullContentCopied]);

    useEffect(() => {
        if (isSaved) {
            const timer = setTimeout(() => setIsSaved(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isSaved]);

    useEffect(() => {
        if (!isLoadingFullContent && idea.fullContent) {
            setActiveTab('fullContent');
        }
    }, [idea.fullContent, isLoadingFullContent]);

    const handleSave = () => {
        onSaveDraft(idea);
        setIsSaved(true);
    };

    const handleShareSummaryTwitter = () => {
        if (!idea.summary) return;
        const text = idea.summary;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleShareSummaryLinkedIn = () => {
        if (!idea.summary) return;
        navigator.clipboard.writeText(idea.summary).then(() => {
            setSummaryCopied(true);
            window.open('https://www.linkedin.com/feed/', '_blank');
        });
    };
    
    const handleShareFullContentTwitter = () => {
        if (!idea.title) return;
        const text = `I just wrote a new article: "${idea.title}". #ContentCreation #Blogging`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleShareFullContentLinkedIn = () => {
        if (!idea.fullContent) return;
        navigator.clipboard.writeText(idea.fullContent).then(() => {
            setFullContentCopied(true);
            window.open('https://www.linkedin.com/feed/', '_blank');
        });
    };


    const renderContent = () => {
        if (isLoadingOutline && !idea.outline) {
            return (
                <div className="flex items-center justify-center h-48">
                    <svg className="animate-spin h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            );
        }

        if (activeTab === 'outline') {
            return (
                <article className="prose prose-invert prose-sm sm:prose-base max-w-none prose-headings:text-indigo-400 prose-strong:text-slate-100 prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
                    <div dangerouslySetInnerHTML={{ __html: idea.outline ? renderMarkdown(idea.outline) : 'No outline generated.' }} />
                </article>
            );
        }

        if (activeTab === 'fullContent') {
            if (isLoadingFullContent) {
                return (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                        <svg className="animate-spin h-8 w-8 text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-slate-300 font-semibold">AI is writing...</p>
                        <p className="text-sm text-slate-400">This might take a moment.</p>
                    </div>
                );
            }

            if (idea.fullContent) {
                 return (
                    <article className="prose prose-invert prose-sm sm:prose-base max-w-none prose-headings:text-indigo-400 prose-strong:text-slate-100 prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
                         <div dangerouslySetInnerHTML={{ __html: renderMarkdown(idea.fullContent) }} />
                    </article>
                 );
            }

            return (
                 <div className="text-center flex flex-col items-center justify-center h-48">
                     <FileText className="h-12 w-12 text-slate-500 mb-4" />
                     <h3 className="font-semibold text-slate-200">Generate the full article</h3>
                     <p className="text-sm text-slate-400 mb-4">Let the AI write a complete post based on the outline.</p>
                     <button
                        onClick={() => onGenerateFullContent(idea)}
                        className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                    >
                         <Sparkles className="h-5 w-5 mr-2" />
                         Write Article
                    </button>
                 </div>
            );
        }
        
        if (activeTab === 'image') {
            if (isLoadingImage) {
                return (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                        <svg className="animate-spin h-8 w-8 text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-slate-300 font-semibold">AI is creating an image...</p>
                        <p className="text-sm text-slate-400">This can take a few moments.</p>
                    </div>
                );
            }
            if (idea.imageUrl) {
                return (
                    <div className="flex flex-col items-center gap-4">
                        <img src={idea.imageUrl} alt={idea.title} className="rounded-lg max-w-full max-h-[400px] object-contain border border-slate-600" />
                        <div className="flex items-center gap-4">
                            <a 
                                href={idea.imageUrl} 
                                download={`${idea.title.replace(/\s/g, '_')}.png`}
                                className="flex items-center bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-md transition"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </a>
                            <button
                                onClick={() => onGenerateImage(idea)}
                                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Regenerate
                            </button>
                        </div>
                    </div>
                );
            }
            return (
                <div className="text-center flex flex-col items-center justify-center h-48">
                    <ImageIcon className="h-12 w-12 text-slate-500 mb-4" />
                    <h3 className="font-semibold text-slate-200">Generate a cover image</h3>
                    <p className="text-sm text-slate-400 mb-4">Let the AI create a unique image for your content.</p>
                    <button
                        onClick={() => onGenerateImage(idea)}
                        className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                    >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate Image
                    </button>
                </div>
            );
        }

        if (activeTab === 'video') {
            if (isLoadingVideo) {
                return (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                        <svg className="animate-spin h-8 w-8 text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-slate-300 font-semibold">AI is creating your video...</p>
                        <p className="text-sm text-slate-400">This process can take several minutes.</p>
                    </div>
                );
            }
             if (idea.videoUrl) {
                return (
                    <div className="flex flex-col items-center gap-4">
                        <video src={idea.videoUrl} controls className="rounded-lg max-w-full max-h-[400px] border border-slate-600 bg-black" />
                        <div className="flex items-center gap-4">
                            <a 
                                href={idea.videoUrl} 
                                download={`${idea.title.replace(/\s/g, '_')}.mp4`}
                                className="flex items-center bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-md transition"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </a>
                            <button
                                onClick={() => onGenerateVideo(idea)}
                                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Regenerate
                            </button>
                        </div>
                    </div>
                );
            }
            return (
                <div className="text-center flex flex-col items-center justify-center h-48">
                    <Video className="h-12 w-12 text-slate-500 mb-4" />
                    <h3 className="font-semibold text-slate-200">Generate a video summary</h3>
                    <p className="text-sm text-slate-400 mb-4">Create a short video from your full content.</p>
                    <button
                        onClick={() => onGenerateVideo(idea)}
                        className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                    >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate Video
                    </button>
                    <p className="text-xs text-slate-500 mt-4">
                        Video generation uses the Veo API. You may be prompted to select an API key.
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline ml-1">Learn about billing.</a>
                    </p>
                </div>
            );
        }

        return null;
    }
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start p-4 border-b border-slate-700">
                    <div className="flex-1">
                         <h2 className="text-lg font-bold text-white">{idea.title}</h2>
                        <div className="border-b border-slate-700 mt-4">
                            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                                <button
                                    onClick={() => setActiveTab('outline')}
                                    className={`${
                                        activeTab === 'outline'
                                            ? 'border-indigo-400 text-indigo-400'
                                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
                                >
                                    <Pilcrow className="h-4 w-4 mr-2" />
                                    Outline
                                </button>
                                <button
                                    onClick={() => setActiveTab('fullContent')}
                                     disabled={!idea.outline}
                                    className={`${
                                        activeTab === 'fullContent'
                                            ? 'border-indigo-400 text-indigo-400'
                                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Full Content
                                </button>
                                <button
                                    onClick={() => setActiveTab('image')}
                                    className={`${
                                        activeTab === 'image'
                                            ? 'border-indigo-400 text-indigo-400'
                                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
                                >
                                    <ImageIcon className="h-4 w-4 mr-2" />
                                    Image
                                </button>
                                <button
                                    onClick={() => setActiveTab('video')}
                                     disabled={!idea.fullContent}
                                    className={`${
                                        activeTab === 'video'
                                            ? 'border-indigo-400 text-indigo-400'
                                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <Video className="h-4 w-4 mr-2" />
                                    Video
                                </button>
                            </nav>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition ml-4">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {renderContent()}
                </div>
                 <div className="p-4 border-t border-slate-700 flex justify-between items-center min-h-[68px]">
                    <div className="flex items-center gap-2 flex-1">
                        {activeTab === 'outline' && (
                            <>
                                <span className="text-sm font-medium text-slate-400">Share Summary:</span>
                                <button
                                    onClick={handleShareSummaryTwitter}
                                    disabled={isLoadingOutline || !idea.summary}
                                    className="p-2 text-slate-400 hover:text-[#1DA1F2] hover:bg-slate-700 rounded-md transition disabled:cursor-not-allowed disabled:opacity-50"
                                    title="Share Summary on Twitter"
                                >
                                    <Twitter className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={handleShareSummaryLinkedIn}
                                    disabled={isLoadingOutline || !idea.summary}
                                    className="p-2 text-slate-400 hover:text-[#0A66C2] hover:bg-slate-700 rounded-md transition disabled:cursor-not-allowed disabled:opacity-50"
                                    title="Copy Summary for LinkedIn"
                                >
                                    <Linkedin className="h-5 w-5" />
                                </button>
                                {summaryCopied && <span className="text-sm text-green-400 animate-pulse">Copied!</span>}
                            </>
                        )}
                        {activeTab === 'fullContent' && idea.fullContent && (
                             <>
                                <span className="text-sm font-medium text-slate-400">Share Full Content:</span>
                                <button
                                    onClick={handleShareFullContentTwitter}
                                    className="p-2 text-slate-400 hover:text-[#1DA1F2] hover:bg-slate-700 rounded-md transition"
                                    title="Share Article Title on Twitter"
                                >
                                    <Twitter className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={handleShareFullContentLinkedIn}
                                    className="p-2 text-slate-400 hover:text-[#0A66C2] hover:bg-slate-700 rounded-md transition"
                                    title="Copy Full Content for LinkedIn"
                                >
                                    <Linkedin className="h-5 w-5" />
                                </button>
                                {fullContentCopied && <span className="text-sm text-green-400 animate-pulse">Copied!</span>}
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaved}
                            className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                             <Save className="h-4 w-4 mr-2" />
                            {isSaved ? 'Saved!' : 'Save Draft'}
                        </button>
                        <button 
                            onClick={onClose} 
                            className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-md transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
