import { z } from 'zod';

export const createConversationSchema = z.object({
  title: z.string().optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
