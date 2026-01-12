import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { fetchMessages, postMessage, addMessage, setConversationId, setMessages, clearChatState } from '../store/chatSlice';
import { createOrGetConversation } from '../utils/chat';
import { IMessage } from '../types/chat';
import socketService from '../utils/socket';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { FaUser, FaPaperPlane, FaTimes, FaPhone, FaVideo, FaEllipsisH, FaCheck, FaCheckDouble, FaImage } from 'react-icons/fa';
import toast from "react-hot-toast";
import uploadImage from '../utils/UploadImage';

interface ChatPopupProps {
    isOpen: boolean;
    onClose: () => void;
    appointmentId: string;
    doctorId: string;
    clinicId: string;
    customer_id: string;
    doctorName: string;
    conversationData?: {
        _id: string;
        messages: any[];
        participants: any[];
    };
}

interface UnifiedMessage {
    id: string;
    content: string;
    senderId: string;
    timestamp: Date;
    status: 'sending' | 'delivered' | 'failed';
    isLocal: boolean;
}

const ChatPopup = ({ isOpen, onClose, appointmentId, doctorId, clinicId, customer_id, doctorName, conversationData }: ChatPopupProps) => {
    const [inputValue, setInputValue] = useState('');
    const [localMessages, setLocalMessages] = useState<UnifiedMessage[]>([]);
    const [isApiAvailable, setIsApiAvailable] = useState(false);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [isSending, setIsSending] = useState(false);
    const dispatch: AppDispatch = useDispatch();
    const { messages, conversationId } = useSelector((state: RootState) => state.chat);
    const currentUser = useSelector((state: RootState) => state.user);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Combine and sort messages
    const allMessages = React.useMemo(() => {
        const apiMessages: UnifiedMessage[] = messages.map(msg => ({
            id: msg._id || `api_${Date.now()}`,
            content: msg.content,
            senderId: msg.sender || 'unknown',
            timestamp: new Date(msg.createdAt || msg.updatedAt),
            status: 'delivered' as const,
            isLocal: false
        }));

        const combined = [...apiMessages, ...localMessages];
        return combined.sort((a, b) =>
            a.timestamp.getTime() - b.timestamp.getTime()
        );
    }, [messages, localMessages]);

    // Auto scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [allMessages]);

    useEffect(() => {
        if (isOpen) {
            // Nếu có conversationData từ props, sử dụng nó trước
            if (conversationData && conversationData._id) {
                // Clear previous chat state chỉ khi cần thiết
                if (conversationId !== conversationData._id) {
                    dispatch(clearChatState());
                    setLocalMessages([]);
                }

                dispatch(setConversationId(conversationData._id));

                if (conversationData.messages && conversationData.messages.length > 0) {
                    dispatch(setMessages(conversationData.messages));
                    setLocalMessages(conversationData.messages.map(msg => ({
                        id: msg._id || `socket_${Date.now()}`,
                        content: msg.content,
                        senderId: msg.sender || msg.senderId,
                        timestamp: new Date(msg.createdAt || msg.updatedAt),
                        status: 'delivered',
                        isLocal: false
                    })));
                    setIsApiAvailable(true);
                    return;
                } else {
                    // Nếu có conversation ID nhưng chưa có messages, fetch từ API
                    dispatch(fetchMessages(conversationData._id));
                    setIsApiAvailable(true);
                    return;
                }
            }

            // Clear previous chat state khi mở popup mới (chỉ khi không có conversationData)
            dispatch(clearChatState());
            setLocalMessages([]);

            // Fallback logic cũ nếu không có conversationData
            const getConversation = async () => {
                try {
                    // Kiểm tra các ID có hợp lệ không
                    if (!appointmentId || !doctorId || !clinicId || !customer_id) {
                        return;
                    }

                    // Thử tạo conversation thật từ backend
                    try {
                        const conversationResult = await createOrGetConversation(customer_id, doctorId, clinicId, appointmentId);

                        if (conversationResult.success && conversationResult.conversationId) {
                            dispatch(setConversationId(conversationResult.conversationId));
                            setIsApiAvailable(true);

                            // Fetch messages ngay
                            dispatch(fetchMessages(conversationResult.conversationId));
                            return;
                        }
                    } catch (apiError) {
                        // Fallback: Thử với format appointment ID
                        const fallbackConversationId = `appointment_${appointmentId}`;

                        try {
                            const existingMessages = await dispatch(fetchMessages(fallbackConversationId));
                            if (fetchMessages.fulfilled.match(existingMessages) && existingMessages.payload.length > 0) {
                                dispatch(setConversationId(fallbackConversationId));
                                setIsApiAvailable(true);
                                return;
                            }
                        } catch (fallbackError) {
                            // Silent fail
                        }
                    }

                } catch (error) {
                    // Silent fail
                }
            };
            getConversation();
        } else {
            // Clear state khi đóng popup
            dispatch(clearChatState());
            setLocalMessages([]);
        }
    }, [isOpen, conversationData, appointmentId, clinicId, customer_id, doctorId, dispatch, currentUser.userId, doctorName]);

    useEffect(() => {
        if (conversationId && isApiAvailable) {
            // Chỉ fetch messages từ API nếu API có sẵn
            dispatch(fetchMessages(conversationId));
        }
    }, [conversationId, dispatch, isApiAvailable]);

    // Socket connection and real-time messaging
    useEffect(() => {
        if (isOpen && currentUser.userId) {
            // Kết nối Socket
            const socket = socketService.connect(currentUser.userId);

            // Update connection status
            const updateConnectionStatus = () => {
                setIsSocketConnected(socketService.isSocketConnected());
            };

            socket?.on('connect', updateConnectionStatus);
            socket?.on('disconnect', updateConnectionStatus);

            updateConnectionStatus();

            // Lắng nghe tin nhắn mới
            const handleNewMessage = (message: any) => {
                // Chỉ thêm message nếu thuộc conversation hiện tại
                if (message.conversationId === conversationId) {
                    const newMessage: IMessage = {
                        _id: message._id || `socket_${Date.now()}`,
                        sender: message.sender || message.senderId,
                        content: message.content,
                        createdAt: message.createdAt || new Date().toISOString(),
                        updatedAt: message.updatedAt || new Date().toISOString(),
                        conversationId: message.conversationId,
                        image: message.image || null,
                        isRead: message.isRead || false
                    };

                    // Force update both Redux and local state
                    dispatch(addMessage(newMessage));
                    setLocalMessages(prev => {
                        // Tránh duplicate messages
                        const exists = prev.some(msg => msg.id === newMessage._id || msg.content === newMessage.content);
                        if (!exists) {
                            const updated = [...prev, {
                                id: newMessage._id || `socket_${Date.now()}`,
                                content: newMessage.content,
                                senderId: newMessage.sender || 'unknown',
                                timestamp: new Date(newMessage.createdAt || newMessage.updatedAt),
                                status: 'delivered' as const,
                                isLocal: false
                            }];
                            return updated;
                        }
                        return prev;
                    });
                } else {
                }
            };

            // Lắng nghe typing indicators
            const handleTyping = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
                if (data.conversationId === conversationId && data.userId !== currentUser.userId) {
                    setTypingUsers(prev => {
                        if (data.isTyping) {
                            return prev.includes(data.userId) ? prev : [...prev, data.userId];
                        } else {
                            return prev.filter(id => id !== data.userId);
                        }
                    });
                }
            };

            socketService.onNewMessage(handleNewMessage);
            socketService.onTyping(handleTyping);

            // Join conversation room khi có conversationId
            if (conversationId) {
                socketService.joinConversation(conversationId);
            }

            // Cleanup function
            return () => {
                if (conversationId) {
                    socketService.leaveConversation(conversationId);
                }
                socketService.off('new-message', handleNewMessage);
                socketService.off('typing', handleTyping);
            };
        }
    }, [isOpen, currentUser.userId, conversationId, dispatch]);

    // Cleanup khi đóng popup
    useEffect(() => {
        if (!isOpen) {
            setTypingUsers([]);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        }
    }, [isOpen]);

    // Polling messages để cập nhật real-time (vì Socket có thể không hoạt động)
    useEffect(() => {
        let pollInterval: NodeJS.Timeout;

        if (isOpen && conversationId && isApiAvailable) {
            // Poll ngay lập tức
            dispatch(fetchMessages(conversationId));

            // Sau đó poll mỗi 1 giây để real-time hơn
            pollInterval = setInterval(() => {
                dispatch(fetchMessages(conversationId));
            }, 1000); // Giảm xuống 1 giây để real-time hơn
        }

        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [isOpen, conversationId, isApiAvailable, dispatch]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, localMessages]);

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file format
            const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validImageTypes.includes(file.type)) {
                toast.error('Only JPG, PNG, GIF or WEBP image files are accepted', {
                    duration: 3000,
                    position: 'top-right',
                    style: {
                        background: '#FF4B4B',
                        color: '#fff',
                        borderRadius: '8px',
                    }
                });
                return;
            }
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must not exceed 5MB', {
                    duration: 3000,
                    position: 'top-right',
                    style: {
                        background: '#FF4B4B',
                        color: '#fff',
                        borderRadius: '8px',
                    }
                });
                return;
            }
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSendMessage = async () => {
        if ((!inputValue.trim() && !selectedImage) || !currentUser.userId) return;
        setIsSending(true);

        const messageContent = inputValue.trim();
        setInputValue('');

        const tempMessageId = `temp_${Date.now()}`;
        let uploadedImageUrl = '';

        // Upload image if selected
        if (selectedImage) {
            try {
                uploadedImageUrl = await uploadImage(selectedImage);
            } catch (error) {
                console.error('Error uploading image:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unable to upload image';
                toast.error(errorMessage, {
                    duration: 3000,
                    position: 'top-right',
                    style: {
                        background: '#FF4B4B',
                        color: '#fff',
                        borderRadius: '8px',
                    }
                });
                setIsSending(false);
                return;
            } finally {
                setSelectedImage(null);
                setImagePreview(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        }

        let currentConversationId = conversationId;

        // Create conversation if not exists
        if (!conversationId) {
            try {
                const conversationResult = await createOrGetConversation(customer_id, doctorId, clinicId, appointmentId);
                if (conversationResult.success && conversationResult.conversationId) {
                    dispatch(setConversationId(conversationResult.conversationId));
                    currentConversationId = conversationResult.conversationId;
                    setIsApiAvailable(true);
                } else {
                    setLocalMessages(prev => prev.map(msg =>
                        msg.id === tempMessageId ? { ...msg, status: 'failed' } : msg
                    ));
                    setIsSending(false);
                    return;
                }
            } catch (error) {
                setLocalMessages(prev => prev.map(msg =>
                    msg.id === tempMessageId ? { ...msg, status: 'failed' } : msg
                ));
                setIsSending(false);
                return;
            }
        }

        // Send message
        if (currentConversationId && currentUser.userId) {
            try {
                const messageData = {
                    senderId: currentUser.userId,
                    content: messageContent,
                };

                const result = await dispatch(postMessage({
                    conversationId: currentConversationId,
                    message: messageData
                }));

                if (postMessage.fulfilled.match(result)) {
                    setLocalMessages(prev => prev.map(msg =>
                        msg.id === tempMessageId ? { ...msg, status: 'delivered' } : msg
                    ));

                    // Refresh messages
                    setTimeout(() => {
                        dispatch(fetchMessages(currentConversationId));
                    }, 500);
                } else {
                    setLocalMessages(prev => prev.map(msg =>
                        msg.id === tempMessageId ? { ...msg, status: 'failed' } : msg
                    ));
                }
            } catch (error) {
                setLocalMessages(prev => prev.map(msg =>
                    msg.id === tempMessageId ? { ...msg, status: 'failed' } : msg
                ));
            } finally {
                setIsSending(false);
            }
        } else {
            setLocalMessages(prev => prev.map(msg =>
                msg.id === tempMessageId ? { ...msg, status: 'failed' } : msg
            ));
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const getMessageStatusIcon = (status: string) => {
        switch (status) {
            case 'sending':
                return <FaCheck className="text-gray-400 text-xs" />;
            case 'delivered':
                return <FaCheckDouble className="text-blue-500 text-xs" />;
            case 'failed':
                return <span className="text-red-500 text-xs">!</span>;
            default:
                return <FaCheckDouble className="text-blue-500 text-xs" />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed bottom-5 right-5 bg-white rounded-lg shadow-xl w-96 h-[600px] flex flex-col z-50"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                >
                    <header className="bg-blue-500 text-white p-4 flex justify-between items-center rounded-t-lg">
                        <div>
                            <h2 className="font-bold text-lg">
                                {doctorName ? `Chat with Dr. ${doctorName}` : 'Chat with Doctor'}
                            </h2>
                            <div className="text-xs opacity-75">
                                {isSocketConnected ? '🟢 Real-time' : isApiAvailable ? '🟡 Auto-refresh (1s)' : '🔴 Offline'}
                                {conversationId && <span className="ml-2">ID: {conversationId.substring(0, 8)}...</span>}
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white hover:text-gray-200">
                            <CloseIcon />
                        </button>
                    </header>
                    <main className="flex-1 p-4 overflow-y-auto bg-gray-50">
                        {allMessages.length === 0 ? (
                            <div className="text-center text-gray-500 mt-8">
                                <ChatBubbleOutlineIcon className="text-4xl mb-2" />
                                <p>No messages yet</p>
                                <p className="text-sm">Start the conversation!</p>
                            </div>
                        ) : (
                            allMessages.map((message, index) => {
                                const isCurrentUser = message.senderId === currentUser.userId;
                                const showAvatar = index === 0 || allMessages[index - 1].senderId !== message.senderId;

                                return (
                                    <div
                                        key={message.id}
                                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : 'mt-1'}`}
                                    >
                                        {!isCurrentUser && showAvatar && (
                                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                                                <FaUser className="text-gray-600 text-sm" />
                                            </div>
                                        )}
                                        {!isCurrentUser && !showAvatar && (
                                            <div className="w-8 mr-2"></div>
                                        )}

                                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${isCurrentUser
                                            ? 'bg-blue-500 text-white rounded-br-sm'
                                            : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
                                            }`}>
                                            <p className="text-sm">{message.content}</p>
                                            <div className={`flex items-center justify-end mt-1 space-x-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-400'
                                                }`}>
                                                <span className="text-xs">
                                                    {message.timestamp.toLocaleTimeString('vi-VN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                {isCurrentUser && message.isLocal && getMessageStatusIcon(message.status)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* Typing Indicators */}
                        {typingUsers.length > 0 && (
                            <div className="flex justify-start mb-2">
                                <div className="bg-gray-200 text-gray-600 rounded-lg px-3 py-2 text-sm">
                                    <div className="flex items-center gap-1">
                                        <span>Typing</span>
                                        <div className="flex gap-1">
                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </main>
                    <footer className="p-4 bg-white border-t border-gray-200">
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Nhập tin nhắn..."
                                className="flex-1 border rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                disabled={isSending}
                            />
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="ml-2 p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                                disabled={isSending}
                            >
                                <FaImage className="text-xl" />
                            </button>
                            <button
                                onClick={handleSendMessage}
                                className="ml-3 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center w-10 h-10"
                                disabled={(!inputValue.trim() && !selectedImage) || isSending}
                            >
                                {isSending ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <SendIcon />
                                )}
                            </button>
                        </div>
                        {imagePreview && (
                            <div className="mt-2 relative inline-block">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-20 h-20 object-cover rounded-lg"
                                />
                                <button
                                    onClick={() => {
                                        setSelectedImage(null);
                                        setImagePreview(null);
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                    <FaTimes size={12} />
                                </button>
                            </div>
                        )}
                    </footer>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ChatPopup;
