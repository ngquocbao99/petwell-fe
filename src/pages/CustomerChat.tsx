import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../store/store';
import { fetchMessages, postMessage, setConversationId, clearChatState, addMessage, setMessages } from '../store/chatSlice';
import { createOrGetConversation, fetchUserConversations, ChatConversation as ImportedChatConversation } from '../utils/chat';
import { IMessage } from '../types/chat';
import { FaUser, FaPaperPlane, FaPhone, FaVideo, FaEllipsisH, FaCheck, FaCheckDouble, FaSearch, FaPlus, FaArrowLeft, FaImage, FaTimes } from 'react-icons/fa';
import uploadImage from '../utils/UploadImage';
import ImageViewer from '../components/ImageViewer';
import { toast } from 'react-hot-toast';

interface UnifiedMessage {
    id: string;
    content: string;
    senderId: string;
    timestamp: Date;
    status: 'sending' | 'delivered' | 'failed';
    isLocal: boolean;
    image?: string;
}

// Sử dụng interface từ utils/chat.ts
type ChatConversation = ImportedChatConversation;

const CustomerChat: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { messages, conversationId } = useSelector((state: RootState) => state.chat);
    const { userId: currentUserId, fullName: currentUserName, avatar: currentUserAvatar } = useSelector((state: RootState) => state.user);
    const location = useLocation();
    const navigate = useNavigate();

    const [inputValue, setInputValue] = useState('');
    const [localMessages, setLocalMessages] = useState<UnifiedMessage[]>([]);
    const [isApiAvailable, setIsApiAvailable] = useState(false);
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [viewImage, setViewImage] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);

    // Get appointment data from navigation state
    const appointmentData = location.state?.appointmentData;

    // Load user conversations on component mount
    useEffect(() => {
        if (currentUserId) {
            loadUserConversations();
        }
    }, [currentUserId]);

    const loadUserConversations = async () => {
        if (!currentUserId) return;

        try {
            setIsLoadingConversations(true);
            const response = await fetchUserConversations(currentUserId);

            if (response.success && response.data) {
                setConversations(response.data);

                // Nếu có appointment data, tìm conversation tương ứng
                if (appointmentData) {
                    const matchingConversation = response.data.find(conv =>
                        conv.appointmentId._id === appointmentData._id
                    );

                    if (matchingConversation) {
                        setSelectedConversation(matchingConversation);
                        dispatch(setConversationId(matchingConversation._id));
                        setIsApiAvailable(true);
                        dispatch(fetchMessages(matchingConversation._id));
                        setLocalMessages([]);
                    }
                } else if (response.data.length > 0) {
                    // Nếu không có appointment data, chọn conversation đầu tiên
                    const firstConversation = response.data[0];
                    setSelectedConversation(firstConversation);
                    dispatch(setConversationId(firstConversation._id));
                    setIsApiAvailable(true);
                    dispatch(fetchMessages(firstConversation._id));
                    setLocalMessages([]);
                }
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setIsLoadingConversations(false);
        }
    };

    // Auto-create conversation if coming from appointment and not found in existing conversations
    useEffect(() => {
        if (appointmentData && currentUserId && !isLoadingConversations && conversations.length === 0) {
            const autoCreateConversation = async () => {
                try {
                    const result = await createOrGetConversation(
                        currentUserId, // customer ID
                        appointmentData.doctorId,
                        appointmentData.clinicId,
                        appointmentData._id
                    );

                    if (result.success && result.conversationId) {
                        // Reload conversations để lấy conversation mới tạo
                        loadUserConversations();
                    }
                } catch (error) {
                    console.error('Error creating conversation:', error);
                }
            };

            autoCreateConversation();
        }
    }, [appointmentData, currentUserId, isLoadingConversations, conversations.length]);

    // Combine and sort messages
    const allMessages = React.useMemo(() => {
        const apiMessages: UnifiedMessage[] = messages.map(msg => ({
            id: msg._id || `api_${Date.now()}`,
            content: msg.content,
            senderId: msg.sender || 'unknown',
            timestamp: new Date(msg.createdAt || msg.updatedAt),
            status: 'delivered' as const,
            isLocal: false,
            image: msg.image // Thêm image vào đây
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

    // Auto scroll cho messages area (chỉ cuộn trong container, không cuộn cả trang)
    const messagesContainerRef = useRef<HTMLDivElement>(null);

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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            setLocalMessages([]);
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

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

    const handleSelectConversation = (conversation: ChatConversation) => {
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
                    window.dispatchEvent(new Event('chat-updated'));
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

    const getOtherParticipant = (conversation: ChatConversation) => {
        // Sử dụng chatPartner từ API response trước
        if (conversation.chatPartner) {
            return conversation.chatPartner;
        }
        // Fallback: tìm trong participants
        return conversation.participants.find(p => p._id !== currentUserId) || conversation.participants[0];
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        } else if (diffDays === 1) {
            return "Hôm qua";
        } else if (diffDays < 7) {
            return `${diffDays} ngày trước`;
        } else {
            return date.toLocaleDateString("vi-VN");
        }
    };

    const filteredConversations = conversations.filter(conv => {
        const otherParticipant = getOtherParticipant(conv);
        return otherParticipant?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conv.lastMessage?.content?.toLowerCase().includes(searchTerm.toLowerCase());
    });

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

    const getLastMessageTimeForConversation = (conversation: ChatConversation) => {
        // Nếu conversation có lastMessage từ API
        if (conversation.lastMessage?.createdAt) {
            return formatTime(conversation.lastMessage.createdAt);
        }

        // Nếu đây là conversation đang được chọn, lấy từ allMessages
        if (selectedConversation?._id === conversation._id && allMessages.length > 0) {
            const lastMessage = allMessages[allMessages.length - 1];
            return lastMessage.timestamp.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        return null;
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FaArrowLeft className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-semibold text-gray-900">Chat</h1>
                    {appointmentData && (
                        <div className="ml-auto text-sm text-gray-600">
                            Appointment: {appointmentData.petName} - {appointmentData.serviceName}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Conversations List */}
                <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                    {/* Profile Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
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

                    {/* Search */}
                    {/* <div className="p-4">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                    </div> */}

                    {/* Chat List Header */}
                    <div className="px-4 pb-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-500">Recent conversations</h3>
                            <button
                                onClick={loadUserConversations}
                                disabled={isLoadingConversations}
                                className="w-6 h-6 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 rounded-full flex items-center justify-center transition-colors"
                                title="Reload list"
                            >
                                <div className={`w-3 h-3 border border-white border-t-transparent rounded-full ${isLoadingConversations ? 'animate-spin' : ''}`}></div>
                            </button>
                        </div>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoadingConversations ? (
                            <div className="p-4 text-center text-gray-500">
                                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                <p>Loading conversations...</p>
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                <p>No conversations yet</p>
                                <p className="text-sm mt-1">Conversations will appear when you book an appointment with a doctor</p>
                            </div>
                        ) : (
                            filteredConversations.map((conversation) => {
                                const otherParticipant = getOtherParticipant(conversation);
                                const isSelected = selectedConversation?._id === conversation._id;

                                return (
                                    <div
                                        key={conversation._id}
                                        onClick={() => handleSelectConversation(conversation)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-orange-50 border-r-4 border-orange-500' : ''
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {otherParticipant?.avatar ? (
                                                    <img
                                                        src={otherParticipant.avatar}
                                                        alt={otherParticipant.fullName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <FaUser className="text-gray-600" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium text-gray-900 truncate">
                                                        {otherParticipant?.fullName || "Unknown"}
                                                    </h4>
                                                    {getLastMessageTimeForConversation(conversation) && (
                                                        <span className="text-xs text-gray-500">
                                                            {getLastMessageTimeForConversation(conversation)}
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
                                            {getOtherParticipant(selectedConversation)?.avatar ? (
                                                <img
                                                    src={getOtherParticipant(selectedConversation)?.avatar}
                                                    alt={getOtherParticipant(selectedConversation)?.fullName}
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
                                                {getOtherParticipant(selectedConversation)?.fullName || "Unknown"}
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
                                                        {getOtherParticipant(selectedConversation)?.avatar ? (
                                                            <img
                                                                src={getOtherParticipant(selectedConversation)?.avatar}
                                                                alt={getOtherParticipant(selectedConversation)?.fullName}
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
                                                                onClick={() => setViewImage(imageUrl)}
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
                                    <FaUser className="text-gray-400 text-3xl" />
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a conversation</h3>
                                <p className="text-gray-500">Select a conversation from the list on the left to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add ImageViewer component */}
            <ImageViewer
                imageUrl={viewImage || ''}
                isOpen={!!viewImage}
                onClose={() => setViewImage(null)}
            />
        </div>
    );
};

export default CustomerChat;