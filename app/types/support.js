// app/types/support.js
/**
 * Support Ticket & Attachment Constants and JSDoc Definitions
 * Brain Buzz Mobile
 */

export const SUPPORT_STATUS = {
  OPEN: 'OPEN',
  AI_HANDLING: 'AI_HANDLING',
  WAITING_FOR_ADMIN: 'WAITING_FOR_ADMIN',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_FOR_USER: 'WAITING_FOR_USER',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
};

export const SUPPORT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const SUPPORT_CATEGORY = {
  ACADEMIC: 'academic',
  TECHNICAL: 'technical',
  BILLING: 'billing',
  ACCOUNT: 'account',
  GENERAL: 'general',
};

export const SUPPORT_SENDER_ROLE = {
  USER: 'user',
  ADMIN: 'admin',
  SUPPORT: 'support',
  AI_ASSISTANT: 'ai_assistant',
  ASSISTANT: 'assistant',
};

/**
 * @typedef {Object} SupportAttachment
 * @property {string|number} id
 * @property {string} requestId
 * @property {string|number|null} [messageId]
 * @property {string|number} uploadedBy
 * @property {string} fileName
 * @property {string} mimeType
 * @property {number} size
 * @property {string} url
 * @property {string} createdAt
 */

/**
 * @typedef {Object} SupportMessage
 * @property {string|number} id
 * @property {string} requestId
 * @property {string|number} senderId
 * @property {string} senderRole
 * @property {string} message
 * @property {string} createdAt
 * @property {Object|null} [sender]
 * @property {SupportAttachment|null} [attachment]
 */

/**
 * @typedef {Object} SupportRequest
 * @property {string} id
 * @property {string|number} userId
 * @property {string} subject
 * @property {string} category
 * @property {string} status
 * @property {string} priority
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {SupportMessage|null} [lastMessage]
 * @property {number} [messageCount]
 * @property {SupportMessage[]} [messages]
 * @property {SupportAttachment[]} [attachments]
 */

/**
 * @typedef {Object} AppNotification
 * @property {string|number} id
 * @property {string|number} userId
 * @property {string} title
 * @property {string} message
 * @property {string} type
 * @property {boolean} isRead
 * @property {Object} [data]
 * @property {string} [data.requestId]
 * @property {string} createdAt
 */

