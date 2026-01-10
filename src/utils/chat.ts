import Axios from "./Axios";
import SummaryApi, { baseURL } from "../common/SummarryAPI";

// Function để tạo hoặc lấy conversation
export const createOrGetConversation = async (customerId: string, doctorId: string, clinicId: string, appointmentId: string) => {
    try {
        const response = await Axios({
            url: "/api/v1/chat/conversations",
            method: "post",
            data: {
                customerId,
                doctorId,
                clinicId,
                appointmentId
            }
        });

        if (response.data.success) {
            return {
                success: true,
                conversationId: response.data.data._id,
                data: response.data.data
            };
        } else {
            return {
                success: false,
                message: response.data.message || "Failed to create conversation"
            };
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || error.message || "Network error"
        };
    }
};

// Function để lấy messages của conversation
export const getMessages = async (conversationId: string) => {
    try {
        const response = await Axios({
            url: `/api/v1/chat/conversations/${conversationId}/messages`,
            method: "get",
        });

        if (response.data.success) {
            return {
                success: true,
                data: response.data.data
            };
        } else {
            return {
                success: false,
                data: [],
                message: response.data.message || "Failed to fetch messages"
            };
        }
    } catch (error: any) {
        return {
            success: false,
            data: [],
            message: error.response?.data?.message || error.message || "Network error"
        };
    }
};

// Function để gửi message
export const sendMessage = async (conversationId: string, content: string, senderId: string) => {
    try {
        const requestData = {
            content,
            senderId: senderId
        };

        const response = await Axios({
            url: `/api/v1/chat/conversations/${conversationId}/messages`,
            method: "post",
            data: requestData
        });

        if (response.data.success) {
            return {
                success: true,
                data: response.data.data
            };
        } else {
            return {
                success: false,
                message: response.data.message || "Failed to send message"
            };
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || error.message || "Network error"
        };
    }
};

// Function để lấy conversations của doctor
export const getDoctorConversations = async (doctorId: string) => {
    try {
        const response = await Axios({
            url: `/api/v1/chat/doctor/${doctorId}/conversations`,
            method: "get",
        });

        if (response.data.success) {
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
        } else {
            return {
                success: false,
                data: [],
                message: response.data.message || "Failed to fetch conversations"
            };
        }
    } catch (error: any) {
        return {
            success: false,
            data: [],
            message: error.response?.data?.message || error.message || "Network error"
        };
    }
};

// Thêm interface cho conversation response
export interface ConversationListResponse {
    message: string;
    success: boolean;
    error: boolean;
    data: ChatConversation[];
    total: number;
}

export interface ChatConversation {
    _id: string;
    participants: ConversationParticipant[];
    clinicId: {
        _id: string;
        name: string;
        address: string;
        phone: number;
        email: string;
    };
    appointmentId: {
        _id: string;
        status: string;
    };
    isClosed: boolean;
    createdAt: string;
    updatedAt: string;
    chatPartner: ConversationParticipant;
    lastMessage?: {
        content: string;
        createdAt: string;
        senderId: string;
    };
    messages?: any[];
}

export interface ConversationParticipant {
    _id: string;
    email: string;
    fullName: string;
    phone: number;
    role: string;
    avatar?: string;
}

// Function để lấy danh sách conversations của user
export const fetchUserConversations = async (userId: string): Promise<ConversationListResponse> => {
    try {
        const token = localStorage.getItem('accesstoken');
        const response = await fetch(`${baseURL}/api/v1/chat/user/${userId}/conversations`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ConversationListResponse = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching user conversations:', error);
        throw error;
    }
}; 