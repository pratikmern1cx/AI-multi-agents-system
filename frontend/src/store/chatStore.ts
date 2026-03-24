import { create } from 'zustand';
import { chatService, Conversation } from '../services/chat.service';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  loadConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  isLoading: false,
  isSending: false,
  error: null,

  loadConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { conversations } = await chatService.getConversations();
      set({ conversations, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to load conversations', isLoading: false });
    }
  },

  createConversation: async (title) => {
    set({ isLoading: true, error: null });
    try {
      const conversation = await chatService.createConversation(title);
      set((state) => ({
        conversations: [conversation, ...state.conversations],
        currentConversation: conversation,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to create conversation', isLoading: false });
    }
  },

  selectConversation: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const conversation = await chatService.getConversation(id);
      set({ currentConversation: conversation, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to load conversation', isLoading: false });
    }
  },

  sendMessage: async (content) => {
    const { currentConversation } = get();
    if (!currentConversation) return;

    set({ isSending: true, error: null });
    try {
      const { userMessage, assistantMessage } = await chatService.sendMessage(
        currentConversation.id,
        content
      );

      set((state) => ({
        currentConversation: state.currentConversation
          ? {
              ...state.currentConversation,
              messages: [
                ...(state.currentConversation.messages || []),
                userMessage,
                assistantMessage,
              ],
            }
          : null,
        isSending: false,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to send message', isSending: false });
    }
  },

  deleteConversation: async (id) => {
    try {
      await chatService.deleteConversation(id);
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        currentConversation: state.currentConversation?.id === id ? null : state.currentConversation,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to delete conversation' });
    }
  },
}));
