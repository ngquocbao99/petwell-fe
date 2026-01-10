import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaDownload } from 'react-icons/fa';

interface ImageViewerProps {
    imageUrl: string;
    isOpen: boolean;
    onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, isOpen, onClose }) => {
    const [isFullSize, setIsFullSize] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    if (!isOpen) return null;

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'image.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
                onClick={() => {
                    if (isFullSize) {
                        setIsFullSize(false);
                    } else {
                        onClose();
                    }
                }}
            >
                <div className="relative">
                    <div className="absolute -top-8 right-0 flex items-center space-x-4 z-50">
                        <button
                            onClick={handleDownload}
                            className="text-white hover:text-gray-300"
                            title="Download image"
                        >
                            <FaDownload size={16} />
                        </button>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-300"
                            title="Close"
                        >
                            <FaTimes size={16} />
                        </button>
                    </div>
                    {isLoading && !hasError && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    <motion.img
                        src={imageUrl}
                        alt="Preview"
                        initial={false}
                        animate={{
                            width: isFullSize ? '95vw' : '800px',
                            height: isFullSize ? '95vh' : '600px'
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`object-contain rounded-lg cursor-pointer ${isFullSize ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-[800px] max-h-[600px]'
                            } ${hasError ? 'hidden' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsFullSize(!isFullSize);
                        }}
                        onLoad={() => {
                            setIsLoading(false);
                            setHasError(false);
                        }}
                        onError={() => {
                            setIsLoading(false);
                            setHasError(true);
                        }}
                        style={{
                            objectFit: 'contain',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)'
                        }}
                    />
                    {hasError && (
                        <div className="flex flex-col items-center justify-center bg-gray-800 rounded-lg p-8">
                            <p className="text-white text-lg mb-2">Failed to load image</p>
                            <p className="text-gray-400 text-sm">Please try again later</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ImageViewer; 