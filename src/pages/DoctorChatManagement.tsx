import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { FaCommentDots, FaUser, FaClock, FaSync, FaPhone, FaVideo, FaEllipsisH, FaCheck, FaCheckDouble, FaPaperPlane, FaArrowLeft, FaImage, FaTimes } from "react-icons/fa";
import { getDoctorConversations } from "../utils/chat";
import { fetchMessages, postMessage, setConversationId, clearChatState } from "../store/chatSlice";
import { useNavigate } from "react-router-dom";
import React from "react";
import uploadImage from '../utils/UploadImage';
import toast from "react-hot-toast";

interface UnifiedMessage {
    id: string;
    content: string;
    senderId: string;
    timestamp: Date;
    status: 'sending' | 'delivered' | 'failed';
    isLocal: boolean;
    image?: string;
}

interface ChatConversation {
    _id: string;
    participants: {
        _id: string;
        fullName: string;
        avatar?: string;
        role: string;
    }[];
    lastMessage?: {
        content: string;
        createdAt: string;
        senderId: string;
    };
    createdAt: string;
    updatedAt: string;
    messages?: any[];
}

const DoctorChatManagement: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();
    const { userId: currentUserId, fullName: currentUserName, avatar: currentUserAvatar } = useSelector((state: RootState) => state.user);
    const { messages, conversationId } = useSelector((state: RootState) => state.chat);

    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [localMessages, setLocalMessages] = useState<UnifiedMessage[]>([]);
    const [isApiAvailable, setIsApiAvailable] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isSending, setIsSending] = useState(false);

    // Combine and sort messages
    const allMessages = React.useMemo(() => {
        const apiMessages: UnifiedMessage[] = messages.map(msg => ({
            id: msg._id || `api_${Date.now()}`,
            content: msg.content,
            senderId: msg.sender || 'unknown',
            timestamp: new Date(msg.createdAt || msg.updatedAt),
            status: 'delivered' as const,
            isLocal: false,
            image: msg.image
        }));

        // Lọc bỏ local messages đã có trong API messages
        const filteredLocalMessages = localMessages.filter(localMsg =>
            !apiMessages.some(apiMsg =>
                apiMsg.content === localMsg.content &&
                apiMsg.senderId === localMsg.senderId &&
                Math.abs(apiMsg.timestamp.getTime() - localMsg.timestamp.getTime()) < 5000 // trong vòng 5 giây
            )
        );

        const combined = [...apiMessages, ...filteredLocalMessages];
        return combined.sort((a, b) =>
            a.timestamp.getTime() - b.timestamp.getTime()
        );
    }, [messages, localMessages]);

    // Auto scroll cho messages area
    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    const prevMessagesLength = useRef(allMessages.length);
    useEffect(() => {
        // Chỉ cuộn khi có tin nhắn mới được thêm vào
        if (allMessages.length > prevMessagesLength.current) {
            scrollToBottom();
        }
        prevMessagesLength.current = allMessages.length;
    }, [allMessages.length]);

    // Polling for new messages
    useEffect(() => {
        if (!conversationId || !isApiAvailable) return;

        const pollMessages = () => {
            dispatch(fetchMessages(conversationId));
        };

        pollIntervalRef.current = setInterval(pollMessages, 1000);

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [conversationId, isApiAvailable, dispatch]);

    // Fetch conversations for the doctor
    useEffect(() => {
        const fetchDoctorConversations = async () => {
            if (!currentUserId) {
                return;
            }

            setLoading(true);
            try {
                const result = await getDoctorConversations(currentUserId);

                if (result.success && result.data && result.data.length > 0) {
                    setConversations(result.data);
                } else {
                    setConversations([]);
                }
                setLastUpdated(new Date());
            } catch (err) {
                setConversations([]);
            }
            setLoading(false);
        };

        if (currentUserId) {
            setConversations([]);
            setSelectedConversation(null);
            fetchDoctorConversations();
        }
    }, [currentUserId]);

    // Polling để tự động refresh conversations mỗi 3 giây
    useEffect(() => {
        let pollInterval: NodeJS.Timeout;

        const fetchConversations = async () => {
            if (!currentUserId) return;

            try {
                const result = await getDoctorConversations(currentUserId);
                if (result.success && result.data) {
                    setConversations(result.data);
                    setLastUpdated(new Date());
                }
            } catch (err) {
                // Silent fail for polling
            }
        };

        if (currentUserId) {
            // Poll mỗi 3 giây để nhận conversations mới
            pollInterval = setInterval(fetchConversations, 3000);
        }

        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [currentUserId]);

    const refreshConversations = async () => {
        if (!currentUserId) return;

        setLoading(true);
        try {
            const result = await getDoctorConversations(currentUserId);
            if (result.success && result.data) {
                setConversations(result.data);
                setLastUpdated(new Date());
            }
        } catch (err) {
            // Silent fail
        }
        setLoading(false);
    };

    const handleOpenChat = (conversation: ChatConversation) => {
        setSelectedConversation(conversation);
        dispatch(setConversationId(conversation._id));
        setIsApiAvailable(true);
        dispatch(fetchMessages(conversation._id));
        setLocalMessages([]);
    };

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Kiểm tra định dạng file
            const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validImageTypes.includes(file.type)) {
                toast.error('Chỉ chấp nhận file ảnh định dạng JPG, PNG, GIF hoặc WEBP', {
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
            // Kiểm tra kích thước file (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Kích thước file không được vượt quá 5MB', {
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
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = async () => {
        if ((!inputValue.trim() && !selectedImage) || !currentUserId || !selectedConversation) return;
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
                const errorMessage = error instanceof Error ? error.message : 'Không thể tải lên ảnh';
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

        // Create message object
        const finalContent = uploadedImageUrl
            ? `${messageContent}\n[image:${uploadedImageUrl}]`
            : messageContent;

        const messageData = {
            senderId: currentUserId,
            content: finalContent || ' ', // Đảm bảo content không rỗng
            image: uploadedImageUrl || undefined
        };

        const tempMessage: UnifiedMessage = {
            id: tempMessageId,
            content: finalContent || ' ', // Đảm bảo content không rỗng
            senderId: currentUserId,
            timestamp: new Date(),
            status: 'sending',
            isLocal: true,
            image: uploadedImageUrl || undefined
        };

        // Thêm tin nhắn tạm thời vào state local
        setLocalMessages(prev => [...prev, tempMessage]);

        // Send message
        if (conversationId && currentUserId) {
            try {
                const result = await dispatch(postMessage({
                    conversationId,
                    message: messageData
                }));

                if (postMessage.fulfilled.match(result)) {
                    // Xóa tin nhắn tạm và fetch tin nhắn mới
                    setLocalMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
                    await dispatch(fetchMessages(conversationId));
                } else {
                    console.error('Failed to send message:', result);
                    setLocalMessages(prev => prev.map(msg =>
                        msg.id === tempMessageId ? { ...msg, status: 'failed' } : msg
                    ));
                }
            } catch (error) {
                console.error('Error sending message:', error);
                setLocalMessages(prev => prev.map(msg =>
                    msg.id === tempMessageId ? { ...msg, status: 'failed' } : msg
                ));
            } finally {
                setIsSending(false);
            }
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
                return <FaCheckDouble className="text-orange-500 text-xs" />;
            case 'failed':
                return <span className="text-red-500 text-xs">!</span>;
            default:
                return <FaCheckDouble className="text-orange-500 text-xs" />;
        }
    };

    const getCustomerFromConversation = (conversation: ChatConversation) => {
        return conversation.participants.find(p => p.role === 'customer') || conversation.participants[0];
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        } else if (diffDays === 1) {
            return "Yesterday";
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString("en-US");
        }
    };

    // Thêm hàm getLastMessageForConversation
    const getLastMessageForConversation = (conversation: ChatConversation) => {
        // Nếu conversation có lastMessage từ API
        if (conversation.lastMessage) {
            // Kiểm tra xem tin nhắn có chứa ảnh không
            const imageUrlMatch = conversation.lastMessage.content?.match(/\[image:(.*?)\]/);
            if (imageUrlMatch) {
                return 'Sent an image';
            }
            return conversation.lastMessage.content;
        }

        // Nếu đây là conversation đang được chọn, lấy từ allMessages
        if (selectedConversation?._id === conversation._id && allMessages.length > 0) {
            const lastMessage = allMessages[allMessages.length - 1];
            // Kiểm tra xem tin nhắn có chứa ảnh không
            const imageUrlMatch = lastMessage.content?.match(/\[image:(.*?)\]/);
            if (imageUrlMatch || lastMessage.image) {
                return 'Sent an image';
            }
            return lastMessage.content;
        }

        // Fallback
        return "Start a conversation";
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Top Navigation Bar */}


            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Conversations List */}
                <div className="w-50 bg-white border-r border-gray-200 flex flex-col">
                    {/* Profile Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <div className="w-16 h-14 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                                    {currentUserAvatar ? (
                                        <img
                                            src={currentUserAvatar}
                                            alt={currentUserName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <FaUser className="text-gray-600 text-xl" />
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-orange-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">{currentUserName}</h2>
                                <p className="text-sm text-orange-600">Available</p>
                            </div>
                        </div>
                    </div>

                    {/* Header with refresh button */}
                    <div className="px-4 py-2 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-500">Conversations</h3>
                            <button
                                onClick={refreshConversations}
                                disabled={loading}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                            >
                                <FaSync className={`text-gray-600 text-sm ${loading ? "animate-spin" : ""}`} />
                            </button>
                        </div>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="w-8 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                <FaCommentDots className="text-4xl text-gray-400 mx-auto mb-2" />
                                <p className="text-sm">No conversations yet</p>
                                <p className="text-xs text-gray-400">Conversations will appear when customers message you</p>
                            </div>
                        ) : (
                            conversations.map((conversation) => {
                                const customer = getCustomerFromConversation(conversation);
                                const isSelected = selectedConversation?._id === conversation._id;

                                return (
                                    <div
                                        key={conversation._id}
                                        onClick={() => handleOpenChat(conversation)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-orange-50 border-r-4 border-orange-500' : ''
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {customer?.avatar ? (
                                                    <img
                                                        src={customer.avatar}
                                                        alt={customer.fullName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <FaUser className="text-gray-600" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium text-gray-900 truncate">
                                                        {customer?.fullName || "Unknown Customer"}
                                                    </h4>
                                                    {conversation.lastMessage && (
                                                        <span className="text-xs text-gray-500">
                                                            {formatTime(conversation.lastMessage.createdAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 truncate">
                                                    {getLastMessageForConversation(conversation)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Main Chat Area */}
                <div className="flex-1 flex flex-col">
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 bg-white border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                                            {getCustomerFromConversation(selectedConversation)?.avatar ? (
                                                <img
                                                    src={getCustomerFromConversation(selectedConversation)?.avatar}
                                                    alt={getCustomerFromConversation(selectedConversation)?.fullName}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = 'https://via.placeholder.com/150';
                                                    }}
                                                />
                                            ) : (
                                                <FaUser className="text-gray-600" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {getCustomerFromConversation(selectedConversation)?.fullName || "Unknown Customer"}
                                            </h3>
                                            <div className="flex items-center space-x-1">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                <span className="text-sm text-gray-500">Online</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button className="p-2 hover:bg-gray-100 rounded-full">
                                            <FaPhone className="text-gray-600" />
                                        </button>
                                        <button className="p-2 hover:bg-gray-100 rounded-full">
                                            <FaVideo className="text-gray-600" />
                                        </button>
                                        <button className="p-2 hover:bg-gray-100 rounded-full">
                                            <FaEllipsisH className="text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div
                                ref={messagesContainerRef}
                                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                            >
                                {allMessages.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FaUser className="text-gray-400 text-2xl" />
                                        </div>
                                        <p className="text-gray-500 text-lg font-medium">No messages yet</p>
                                        <p className="text-gray-400 text-sm">Start the conversation!</p>
                                    </div>
                                ) : (
                                    allMessages.map((message, index) => {
                                        const isCurrentUser = message.senderId === currentUserId;
                                        const showAvatar = index === 0 || allMessages[index - 1].senderId !== message.senderId;

                                        // Extract image URL from content if exists
                                        const imageUrlMatch = message.content?.match(/\[image:(.*?)\]/);
                                        const imageUrl = message.image || (imageUrlMatch ? imageUrlMatch[1] : null);
                                        const cleanContent = message.content?.replace(/\[image:.*?\]/, '').trim();

                                        // Determine what content to show
                                        const showContent = cleanContent && cleanContent !== ' '
                                            ? cleanContent
                                            : (imageUrl ? 'Sent an image' : '');

                                        return (
                                            <div
                                                key={message.id}
                                                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : 'mt-1'}`}
                                            >
                                                {!isCurrentUser && showAvatar && (
                                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2 flex-shrink-0 overflow-hidden">
                                                        {getCustomerFromConversation(selectedConversation)?.avatar ? (
                                                            <img
                                                                src={getCustomerFromConversation(selectedConversation)?.avatar}
                                                                alt={getCustomerFromConversation(selectedConversation)?.fullName}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src = 'https://via.placeholder.com/150';
                                                                }}
                                                            />
                                                        ) : (
                                                            <FaUser className="text-gray-600 text-sm" />
                                                        )}
                                                    </div>
                                                )}
                                                {!isCurrentUser && !showAvatar && (
                                                    <div className="w-8 mr-2"></div>
                                                )}

                                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${isCurrentUser
                                                    ? 'bg-orange-500 text-white rounded-br-sm'
                                                    : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
                                                    }`}>
                                                    {imageUrl && (
                                                        <div className="mb-2">
                                                            <img
                                                                src={imageUrl}
                                                                alt="Sent"
                                                                className="rounded-lg max-w-full h-auto cursor-pointer"
                                                                onClick={() => window.open(imageUrl, '_blank')}
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src = 'https://via.placeholder.com/150?text=Image+not+found';
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                    {showContent && (
                                                        <p className="text-sm">{showContent}</p>
                                                    )}
                                                    <div className={`flex items-center justify-end mt-1 space-x-1 ${isCurrentUser ? 'text-orange-100' : 'text-gray-400'
                                                        }`}>
                                                        <span className="text-xs">
                                                            {message.timestamp.toLocaleTimeString('en-US', {
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
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-gray-200">
                                {imagePreview && (
                                    <div className="mb-2 relative">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-20 h-20 object-cover rounded-lg"
                                        />
                                        <button
                                            onClick={handleRemoveImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                        >
                                            <FaTimes size={12} />
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-center space-x-3">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Type a message..."
                                            className="w-full px-4 py-3 bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                                            disabled={isSending}
                                        />
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        onChange={handleImageSelect}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                                        title="Send image"
                                        disabled={isSending}
                                    >
                                        <FaImage className="text-xl" />
                                    </button>
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={(!inputValue.trim() && !selectedImage) || isSending}
                                        className="w-12 h-12 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors"
                                    >
                                        {isSending ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <FaPaperPlane className="text-sm" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* No conversation selected */
                        <div className="flex-1 flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaCommentDots className="text-gray-400 text-3xl" />
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a Conversation</h3>
                                <p className="text-gray-500">Choose a conversation from the list to start messaging with customers</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorChatManagement; 