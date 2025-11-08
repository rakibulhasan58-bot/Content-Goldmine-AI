
import React, { useEffect } from 'react';
import { XCircle } from 'lucide-react';

interface ToastProps {
    message: string;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => {
            clearTimeout(timer);
        };
    }, [onClose]);

    return (
        <div className="fixed bottom-5 right-5 bg-red-600 text-white py-3 px-5 rounded-lg shadow-lg flex items-center z-50 animate-pulse">
            <XCircle className="h-6 w-6 mr-3" />
            <p>{message}</p>
        </div>
    );
};
