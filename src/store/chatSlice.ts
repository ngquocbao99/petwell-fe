import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as chatApi from '../utils/chat';
import { IMessage } from '../types/chat';

interface ChatState {
    messages: IMessage[];
    conversationId: string | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: ChatState = {
    messages: [],
    conversationId: null,
    status: 'idle',
    error: null,
};

export const fetchMessages = createAsyncThunk(
    'chat/fetchMessages',
    async (conversationId: string, { rejectWithValue }) => {
        try {
            const response = await chatApi.getMessages(conversationId);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const postMessage = createAsyncThunk(
    'chat/postMessage',
    async (
        {
            conversationId,
            message,
        }: {
            conversationId: string;
            message: { senderId: string; content: string; image?: string };
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await chatApi.sendMessage(conversationId, message.content, message.senderId);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response.data);
        }
    }
);

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        addMessage: (state, action) => {
            state.messages.push(action.payload);
        },
        setConversationId: (state, action) => {
            state.conversationId = action.payload;
        },
        setMessages: (state, action) => {
            state.messages = action.payload;
        },
        clearChatState: (state) => {
            state.conversationId = null;
            state.messages = [];
            state.status = 'idle';
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMessages.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchMessages.fulfilled, (state, action: PayloadAction<IMessage[]>) => {
                state.status = 'succeeded';
                state.messages = action.payload;
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            .addCase(postMessage.fulfilled, (state, action: PayloadAction<IMessage>) => {
                // The message will be added via socket event, so we don't need to add it here
                // Or if we don't have socket for the sender, we can add it here.
                // state.messages.push(action.payload);
            });
    },
});

export const { addMessage, setConversationId, setMessages, clearChatState } = chatSlice.actions;

export default chatSlice.reducer; 