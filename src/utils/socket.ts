import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;
    private isConnected = false;

    connect(userId: string, token?: string) {
        if (this.socket && this.isConnected) {
            return this.socket;
        }

        // Kết nối tới backend socket server
        this.socket = io('http://localhost:5000', {
            auth: {
                userId,
                token
            },
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            this.isConnected = true;

            // Join user room để nhận tin nhắn cá nhân
            this.socket?.emit('join-user-room', userId);
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.isConnected = false;
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // Join conversation room để nhận tin nhắn real-time
    joinConversation(conversationId: string) {
        if (this.socket && this.isConnected) {
            this.socket.emit('join-conversation', conversationId);
        }
    }

    // Leave conversation room
    leaveConversation(conversationId: string) {
        if (this.socket && this.isConnected) {
            this.socket.emit('leave-conversation', conversationId);
        }
    }

    // Gửi tin nhắn real-time
    sendMessage(conversationId: string, message: any) {
        if (this.socket && this.isConnected) {
            this.socket.emit('send-message', {
                conversationId,
                ...message
            });
        }
    }

    // Lắng nghe tin nhắn mới
    onNewMessage(callback: (message: any) => void) {
        if (this.socket) {
            this.socket.on('new-message', callback);
        }
    }

    // Lắng nghe user online/offline
    onUserStatusChange(callback: (data: { userId: string; isOnline: boolean }) => void) {
        if (this.socket) {
            this.socket.on('user-status-change', callback);
        }
    }

    // Lắng nghe typing indicators
    onTyping(callback: (data: { conversationId: string; userId: string; isTyping: boolean }) => void) {
        if (this.socket) {
            this.socket.on('typing', callback);
        }
    }

    // Gửi typing indicator
    sendTyping(conversationId: string, isTyping: boolean) {
        if (this.socket && this.isConnected) {
            this.socket.emit('typing', { conversationId, isTyping });
        }
    }

    // Remove event listeners
    off(event: string, callback?: any) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    // Get connection status
    isSocketConnected() {
        return this.isConnected && this.socket?.connected;
    }

    // Get socket instance
    getSocket() {
        return this.socket;
    }
}

// Singleton instance
const socketService = new SocketService();
export default socketService; 