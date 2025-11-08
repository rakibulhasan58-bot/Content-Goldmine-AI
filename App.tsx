import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { IdeaGenerator } from './components/IdeaGenerator';
import { IdeaList } from './components/IdeaList';
import { Scheduler } from './components/Scheduler';
import { LiveCoach } from './components/LiveCoach';
import { ContentEditorModal } from './components/ContentEditorModal';
import { ScheduleModal } from './components/ScheduleModal';
import { Toast } from './components/Toast';
import { generateContentIdeas, expandContentIdea, generateFullContent, generateContentImage, generateContentVideo } from './services/geminiService';
import type { ContentIdea, ScheduledItem, Day } from './types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const DRAFTS_STORAGE_KEY = 'content-goldmine-drafts';

const App: React.FC = () => {
    const [ideas, setIdeas] = useState<ContentIdea[]>([]);
    const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([]);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
    const [isLoadingOutline, setIsLoadingOutline] = useState(false);
    const [isLoadingFullContent, setIsLoadingFullContent] = useState(false);
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const [isLoadingVideo, setIsLoadingVideo] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

    useEffect(() => {
        try {
            const savedDrafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
            if (savedDrafts) {
                const drafts: ContentIdea[] = JSON.parse(savedDrafts);
                setIdeas(drafts);
            }
        } catch (e) {
            console.error("Failed to load drafts from localStorage", e);
            setError("Could not load saved drafts.");
        }
    }, []);


    const handleGenerateIdeas = async (topic: string) => {
        setIsLoadingIdeas(true);
        setError(null);
        try {
            const ideaTitles = await generateContentIdeas(topic);
            const newIdeas: ContentIdea[] = ideaTitles.map(title => ({
                id: crypto.randomUUID(),
                title,
                isDraft: false,
            }));
            // Prepend new ideas, keeping existing drafts
            setIdeas(prevIdeas => [...newIdeas, ...prevIdeas.filter(i => i.isDraft)]);
        } catch (err) {
            console.error(err);
            setError('Failed to generate ideas. Please check your API key and try again.');
        } finally {
            setIsLoadingIdeas(false);
        }
    };

    const handleExpandIdea = async (idea: ContentIdea) => {
        setSelectedIdea(idea);
        setIsEditorOpen(true);
        
        if (idea.outline && idea.summary) return;

        setIsLoadingOutline(true);
        setError(null);
        try {
            const { outline, summary } = await expandContentIdea(idea.title);
            const updatedIdea = { ...idea, outline, summary };
            setIdeas(prevIdeas => prevIdeas.map(i => i.id === idea.id ? updatedIdea : i));
            setSelectedIdea(updatedIdea);
        } catch (err) {
            console.error(err);
            setError('Failed to expand the idea. Please try again.');
        } finally {
            setIsLoadingOutline(false);
        }
    };

    const handleGenerateFullContent = async (idea: ContentIdea) => {
        if (!idea.outline) return;
        setIsLoadingFullContent(true);
        setError(null);
        try {
            const fullContent = await generateFullContent(idea.title, idea.outline);
            const updatedIdea = { ...idea, fullContent };
            setIdeas(prevIdeas => prevIdeas.map(i => i.id === idea.id ? updatedIdea : i));
            setSelectedIdea(updatedIdea);
        } catch (err) {
             console.error(err);
            setError('Failed to generate the full content. Please try again.');
        } finally {
            setIsLoadingFullContent(false);
        }
    };

    const handleGenerateImage = async (idea: ContentIdea) => {
        setIsLoadingImage(true);
        setError(null);
        try {
            const imageUrl = await generateContentImage(idea.title);
            const updatedIdea = { ...idea, imageUrl };
            setIdeas(prevIdeas => prevIdeas.map(i => i.id === idea.id ? updatedIdea : i));
            setSelectedIdea(updatedIdea);
        } catch (err) {
            console.error(err);
            setError('Failed to generate the image. Please try again.');
        } finally {
            setIsLoadingImage(false);
        }
    };

    const handleGenerateVideo = async (idea: ContentIdea) => {
        const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
        if (!hasKey) {
            await (window as any).aistudio?.openSelectKey();
        }

        setIsLoadingVideo(true);
        setError(null);
        try {
            if (!idea.fullContent) {
                throw new Error("Full content must be generated before creating a video.");
            }
            const videoUrl = await generateContentVideo(idea.title, idea.fullContent);
            const updatedIdea = { ...idea, videoUrl };
            setIdeas(prevIdeas => prevIdeas.map(i => i.id === idea.id ? updatedIdea : i));
            setSelectedIdea(updatedIdea);
        } catch (err: any) {
            console.error(err);
            if (err.message.includes("Your API key is invalid")) {
                 setError('Your API key is invalid. Please click "Generate Video" again to select a new key.');
            } else {
                setError('Failed to generate the video. Please try again.');
            }
        } finally {
            setIsLoadingVideo(false);
        }
    };

    const handleSaveDraft = (ideaToSave: ContentIdea) => {
        const updatedIdeas = ideas.map(i => 
            i.id === ideaToSave.id ? { ...ideaToSave, isDraft: true } : i
        );
        setIdeas(updatedIdeas);
        setSelectedIdea(prev => prev ? { ...prev, isDraft: true } : null);

        const draftsToSave = updatedIdeas.filter(idea => idea.isDraft);
        try {
            localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(draftsToSave));
        } catch (e) {
            console.error("Failed to save drafts to localStorage", e);
            setError("Could not save draft.");
        }
    };

    const handleOpenScheduleModal = (idea: ContentIdea) => {
        setSelectedIdea(idea);
        setIsSchedulerOpen(true);
    };

    const handleScheduleItem = (idea: ContentIdea, day: Day, time: string) => {
        setScheduledItems(prev => [...prev, { id: crypto.randomUUID(), idea, day, time }]);
        setIsSchedulerOpen(false);
        setSelectedIdea(null);
    };

    const moveScheduledItem = useCallback((itemId: string, newDay: Day) => {
        setScheduledItems(prev =>
            prev.map(item => (item.id === itemId ? { ...item, day: newDay } : item))
        );
    }, []);

    const removeScheduledItem = (itemId: string) => {
        setScheduledItems(prev => prev.filter(item => item.id !== itemId));
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
                <Header />
                <main className="flex-grow p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
                    <div className="lg:col-span-1 flex flex-col gap-8">
                        <IdeaGenerator onGenerate={handleGenerateIdeas} isLoading={isLoadingIdeas} />
                        <IdeaList
                            ideas={ideas}
                            onExpand={handleExpandIdea}
                            onSchedule={handleOpenScheduleModal}
                        />
                    </div>
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        <LiveCoach onError={setError} />
                        <Scheduler 
                            scheduledItems={scheduledItems} 
                            moveItem={moveScheduledItem}
                            removeItem={removeScheduledItem}
                        />
                    </div>
                </main>
                
                {isEditorOpen && selectedIdea && (
                    <ContentEditorModal
                        idea={selectedIdea}
                        isLoadingOutline={isLoadingOutline}
                        isLoadingFullContent={isLoadingFullContent}
                        isLoadingImage={isLoadingImage}
                        isLoadingVideo={isLoadingVideo}
                        onClose={() => setIsEditorOpen(false)}
                        onGenerateFullContent={handleGenerateFullContent}
                        onGenerateImage={handleGenerateImage}
                        onGenerateVideo={handleGenerateVideo}
                        onSaveDraft={handleSaveDraft}
                    />
                )}

                {isSchedulerOpen && selectedIdea && (
                    <ScheduleModal
                        idea={selectedIdea}
                        onSchedule={handleScheduleItem}
                        onClose={() => setIsSchedulerOpen(false)}
                    />
                )}
                
                {error && <Toast message={error} onClose={() => setError(null)} />}
            </div>
        </DndProvider>
    );
};

export default App;