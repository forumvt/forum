export const PM_MAX_LENGTH = 4000;
export const PM_MAX_PARTICIPANTS = 20;

export interface PmPerson {
  id: string;
  name: string;
  avatar: string | null;
}

export interface PmInboxItem {
  id: string;
  participants: PmPerson[];
  lastMessageAt: Date;
  lastMessagePreview: string;
  unread: boolean;
  isGroup: boolean;
}

export interface PmMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  createdAt: Date;
  mine: boolean;
}

export interface PmConversationView {
  id: string;
  participants: PmPerson[];
  isGroup: boolean;
  messages: PmMessageItem[];
}

export interface ListPmInboxResult {
  conversations: PmInboxItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export function pmConversationTitle(participants: PmPerson[]): string {
  const names = participants.map((person) => person.name.trim() || "Usuário");
  if (names.length === 0) return "Conversa";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  return `${names[0]}, ${names[1]} e mais ${names.length - 2}`;
}
