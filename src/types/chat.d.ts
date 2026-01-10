export interface ChatMessage {
  role: "user" | "model";
  parts: Array<{
    text?: string;
    inline_data?: {
      data: string;
      mime_type: string;
    };
  }>;
}

export interface IMessage {
  _id: string;
  conversationId: string;
  sender: string;
  content: string;
  image: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface IConversation {
  _id: string;
  participants: string[];
  clinicId: string;
  appointmentId: string;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
}


export interface UnifiedMessage {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  status: 'sending' | 'delivered' | 'failed';
  isLocal: boolean;
  image?: string;
}


