import { create } from 'zustand';
import { chatService, Conversation } from '../services/chat.service';

const deriveTitle = (content: string) => {
  const cleaned = content.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'New Conversation';
  const maxLength = 48;
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength).trimEnd()}...`;
};

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
    const shouldUpdateTitle =
      !currentConversation.title || currentConversation.title === 'New Conversation';
    const newTitle = shouldUpdateTitle ? deriveTitle(content) : undefined;

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
              title: newTitle ?? state.currentConversation.title,
              messages: [
                ...(state.currentConversation.messages || []),
                userMessage,
                assistantMessage,
              ],
            }
          : null,
        conversations: state.conversations.map((conversation) =>
          conversation.id === currentConversation.id
            ? { ...conversation, title: newTitle ?? conversation.title }
            : conversation
        ),
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
