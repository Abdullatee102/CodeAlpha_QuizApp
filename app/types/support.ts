// app/types/support.ts

export type SupportStatus =
  | 'OPEN'
  | 'AI_HANDLING'
  | 'WAITING_FOR_ADMIN'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_USER'
  | 'RESOLVED'
  | 'CLOSED'
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export type SupportPriority = 'low' | 'medium' | 'high' | 'urgent';

export type SupportCategory =
  | 'academic'
  | 'technical'
  | 'billing'
  | 'account'
  | 'general';

export type SupportSenderRole =
  | 'user'
  | 'admin'
  | 'support'
  | 'ai_assistant'
  | 'assistant';

export interface SupportAttachment {
  id: string;
  requestId: string;
  messageId?: string | null;
  uploadedBy: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderRole: SupportSenderRole;
  message: string;
  createdAt: string;
  sender?: {
    id: string;
    fullName: string;
    username: string;
    photoURL?: string | null;
  } | null;
  attachment?: SupportAttachment | null;
}

export interface SupportRequest {
  id: string;
  userId: string;
  subject: string;
  category: SupportCategory;
  status: SupportStatus;
  priority: SupportPriority;
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    id: string;
    message: string;
    senderRole: SupportSenderRole;
    createdAt: string;
    senderName?: string;
  } | null;
  messageCount?: number;
  messages?: SupportMessage[];
  attachments?: SupportAttachment[];
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: {
    url?: string;
    requestId?: string;
    [key: string]: unknown;
  };
  isRead: boolean;
  createdAt: string;
}
