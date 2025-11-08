import React from 'react';
import type { ScheduledItem, Day } from '../types';
import { DAYS } from '../types';
import { useDrop, useDrag } from 'react-dnd';
import { Calendar, GripVertical, Trash2, Clock, Download } from 'lucide-react';

const ITEM_TYPE = 'SCHEDULED_ITEM';

const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHours = h % 12 === 0 ? 12 : h % 12;
    const formattedMinutes = m < 10 ? `0${m}` : m;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

interface DraggableItemProps {
    item: ScheduledItem;
    removeItem: (id: string) => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ item, removeItem }) => {
    const [{ isDragging }, drag, preview] = useDrag(() => ({
        type: ITEM_TYPE,
        item: { id: item.id },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div ref={preview} style={{ opacity: isDragging ? 0.5 : 1 }} className="mb-2">
            <div ref={drag} className="flex items-start bg-slate-700 p-2 rounded-md cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5 text-slate-500 mr-2 flex-shrink-0 mt-0.5" />
                <div className="flex-grow">
                    <p className="text-sm text-slate-200">{item.idea.title}</p>
                    {item.time && (
                        <div className="flex items-center text-xs text-indigo-300 mt-1">
                            <Clock size={12} className="mr-1.5" />
                            <span>{formatTime(item.time)}</span>
                        </div>
                    )}
                </div>
                 <button onClick={() => removeItem(item.id)} className="ml-2 p-1 text-slate-400 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

interface DayColumnProps {
    day: Day;
    items: ScheduledItem[];
    moveItem: (id: string, day: Day) => void;
    removeItem: (id: string) => void;
}

const DayColumn: React.FC<DayColumnProps> = ({ day, items, moveItem, removeItem }) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ITEM_TYPE,
        drop: (draggedItem: { id: string }) => moveItem(draggedItem.id, day),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    return (
        <div
            ref={drop}
            className={`rounded-lg p-3 h-full transition-colors ${isOver ? 'bg-slate-700/50' : ''}`}
        >
            <h3 className="font-bold text-center text-sm uppercase tracking-wider text-slate-400 mb-4">{day}</h3>
            <div className="space-y-2">
                {items.map((item) => (
                    <DraggableItem key={item.id} item={item} removeItem={removeItem} />
                ))}
                 {items.length === 0 && <div className="h-10"></div>}
            </div>
        </div>
    );
};


interface SchedulerProps {
    scheduledItems: ScheduledItem[];
    moveItem: (id: string, day: Day) => void;
    removeItem: (id: string) => void;
}

export const Scheduler: React.FC<SchedulerProps> = ({ scheduledItems, moveItem, removeItem }) => {
    const handleExportCSV = () => {
        if (scheduledItems.length === 0) return;

        const csvHeader = '"Title","Day","Time"\n';
        const csvRows = scheduledItems.map(item => {
            const title = `"${item.idea.title.replace(/"/g, '""')}"`; // Escape double quotes
            const day = item.day;
            const time = item.time ? formatTime(item.time) : '';
            return [title, day, time].join(',');
        }).join('\n');

        const csvContent = csvHeader + csvRows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.href) {
            URL.revokeObjectURL(link.href);
        }
        link.href = URL.createObjectURL(blob);
        link.download = 'content_schedule.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-indigo-400" />
                    3. Content Schedule
                </h2>
                <button
                    onClick={handleExportCSV}
                    disabled={scheduledItems.length === 0}
                    className="flex items-center text-sm text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Export to CSV"
                >
                    <Download size={16} className="mr-2" />
                    Export to CSV
                </button>
            </div>
            {scheduledItems.length === 0 && (
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                         <Calendar className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                         <p className="text-slate-400">Your schedule is empty.</p>
                         <p className="text-sm text-slate-500">Add ideas from the left to plan your week.</p>
                    </div>
                </div>
            )}
            {scheduledItems.length > 0 && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 flex-grow overflow-y-auto">
                    {DAYS.map((day) => (
                        <DayColumn
                            key={day}
                            day={day}
                            items={scheduledItems.filter((item) => item.day === day)}
                            moveItem={moveItem}
                            removeItem={removeItem}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};