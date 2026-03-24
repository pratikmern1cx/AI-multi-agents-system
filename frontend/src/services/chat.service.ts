import api from './api';

export interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
  metadata?: any;
}

export interface Conversation {
  id: string;
  title?: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export const chatService = {
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    const { data } = await api.get('/conversations');
    return data;
  },

  async createConversation(title?: string): Promise<Conversation> {
    const { data } = await api.post('/conversations', { title });
    return data;
  },

  async getConversation(id: string): Promise<Conversation> {
    const { data } = await api.get(`/conversations/${id}`);
    return data;
  },

  async sendMessage(conversationId: string, content: string): Promise<any> {
    const { data } = await api.post(`/conversations/${conversationId}/messages`, { content });
    return data;
  },

  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/conversations/${id}`);
  },
};
