import { excerptStart } from "@/lib/search";
import * as ignoreRepo from "@/repositories/ignore.repository";
import * as pmRepo from "@/repositories/pm.repository";
import * as userRepo from "@/repositories/user.repository";
import * as moderationService from "@/services/moderation.service";
import {
  type ListPmInboxResult,
  PM_MAX_LENGTH,
  PM_MAX_PARTICIPANTS,
  type PmConversationView,
  type PmPerson,
} from "@/types/pm";

export type SendPmError =
  | "banned"
  | "self"
  | "not_found"
  | "ignored"
  | "recipient_banned"
  | "forbidden"
  | "empty"
  | "too_long"
  | "too_many"
  | "already_member";

export type SendPmResult =
  | { ok: true; conversationId: string; messageId?: string }
  | { ok: false; error: SendPmError; reason?: string | null };

function normalizeContent(content: string): string {
  return content.trim();
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

async function assertCanMessage(
  senderId: string,
  recipientId: string,
): Promise<{ ok: false; error: SendPmError; reason?: string | null } | null> {
  if (senderId === recipientId) {
    return { ok: false, error: "self" };
  }
  const recipient = await userRepo.findPublicById(recipientId);
  if (!recipient) return { ok: false, error: "not_found" };
  if (recipient.bannedAt) {
    return { ok: false, error: "recipient_banned" };
  }
  if (await ignoreRepo.isEitherIgnored(senderId, recipientId)) {
    return { ok: false, error: "ignored" };
  }
  return null;
}

type ValidateRecipientsResult =
  | { ok: true; ids: string[] }
  | { ok: false; error: SendPmError; reason?: string | null };

async function validateRecipients(
  senderId: string,
  recipientIds: string[],
): Promise<ValidateRecipientsResult> {
  const block = await moderationService.getWriteBlock(senderId);
  if (block.blocked) {
    return { ok: false, error: "banned", reason: block.reason };
  }

  const ids = uniqueIds(recipientIds).filter((id) => id !== senderId);
  if (ids.length === 0) return { ok: false, error: "self" };
  if (ids.length + 1 > PM_MAX_PARTICIPANTS) {
    return { ok: false, error: "too_many" };
  }

  for (const id of ids) {
    const blocked = await assertCanMessage(senderId, id);
    if (blocked) return blocked;
  }
  return { ok: true, ids };
}

export async function findExistingConversationId(
  userA: string,
  userB: string,
): Promise<string | null> {
  if (!userA || !userB || userA === userB) return null;
  return pmRepo.findConversationIdByPair(userA, userB);
}

export async function sendToUsers(
  senderId: string,
  recipientIds: string[],
  rawContent: string,
): Promise<SendPmResult> {
  const validated = await validateRecipients(senderId, recipientIds);
  if (!validated.ok) return validated;

  const content = normalizeContent(rawContent);
  if (!content) return { ok: false, error: "empty" };
  if (content.length > PM_MAX_LENGTH) return { ok: false, error: "too_long" };

  let conversationId: string | null = null;
  if (validated.ids.length === 1) {
    conversationId = await pmRepo.findConversationIdByPair(
      senderId,
      validated.ids[0],
    );
  }
  if (!conversationId) {
    conversationId = await pmRepo.createConversation([
      senderId,
      ...validated.ids,
    ]);
  }

  const created = await pmRepo.insertMessage({
    conversationId,
    senderId,
    content,
    preview: excerptStart(content, 140),
  });

  return { ok: true, conversationId, messageId: created.id };
}

export async function replyToConversation(
  senderId: string,
  conversationId: string,
  rawContent: string,
): Promise<SendPmResult> {
  const meta = await pmRepo.findConversationMeta(conversationId);
  if (!meta) return { ok: false, error: "not_found" };
  if (!(await pmRepo.isParticipant(conversationId, senderId))) {
    return { ok: false, error: "forbidden" };
  }

  const block = await moderationService.getWriteBlock(senderId);
  if (block.blocked) {
    return { ok: false, error: "banned", reason: block.reason };
  }

  const content = normalizeContent(rawContent);
  if (!content) return { ok: false, error: "empty" };
  if (content.length > PM_MAX_LENGTH) return { ok: false, error: "too_long" };

  const created = await pmRepo.insertMessage({
    conversationId,
    senderId,
    content,
    preview: excerptStart(content, 140),
  });

  return { ok: true, conversationId, messageId: created.id };
}

export async function addMembers(
  actorId: string,
  conversationId: string,
  userIds: string[],
): Promise<SendPmResult> {
  const meta = await pmRepo.findConversationMeta(conversationId);
  if (!meta) return { ok: false, error: "not_found" };
  if (!(await pmRepo.isParticipant(conversationId, actorId))) {
    return { ok: false, error: "forbidden" };
  }

  const existing = new Set(await pmRepo.findParticipantIds(conversationId));
  const incoming = uniqueIds(userIds).filter((id) => id !== actorId);
  const toAdd = incoming.filter((id) => !existing.has(id));
  if (toAdd.length === 0) return { ok: false, error: "already_member" };
  if (existing.size + toAdd.length > PM_MAX_PARTICIPANTS) {
    return { ok: false, error: "too_many" };
  }

  const validated = await validateRecipients(actorId, toAdd);
  if (!validated.ok) return validated;

  await pmRepo.addParticipants(conversationId, validated.ids);
  return { ok: true, conversationId };
}

export async function listInbox(
  userId: string,
  page: number,
  per: number,
): Promise<ListPmInboxResult> {
  const { conversations, totalCount } = await pmRepo.listInbox(
    userId,
    page,
    per,
  );
  const totalPages = Math.ceil(totalCount / per) || 1;
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const people = await pmRepo.findParticipantsByConversationIds(
    conversations.map((row) => row.id),
  );

  return {
    conversations: conversations.map((row) => {
      const others = (people.get(row.id) ?? []).filter(
        (person) => person.id !== userId,
      );
      return {
        id: row.id,
        participants: others,
        lastMessageAt: row.lastMessageAt,
        lastMessagePreview: row.lastMessagePreview ?? "",
        unread:
          !row.lastReadAt ||
          row.lastMessageAt.getTime() > row.lastReadAt.getTime(),
        isGroup: others.length > 1,
      };
    }),
    totalCount,
    totalPages,
    currentPage,
  };
}

export async function getConversation(
  viewerId: string,
  conversationId: string,
): Promise<PmConversationView | null> {
  const meta = await pmRepo.findConversationMeta(conversationId);
  if (!meta) return null;
  if (!(await pmRepo.isParticipant(conversationId, viewerId))) return null;

  const all = await pmRepo.findParticipants(conversationId);
  const others = all.filter((person) => person.id !== viewerId);
  const messages = await pmRepo.findMessages(conversationId, viewerId);

  return {
    id: conversationId,
    participants: others,
    isGroup: others.length > 1,
    messages,
  };
}

export async function markConversationRead(
  viewerId: string,
  conversationId: string,
): Promise<void> {
  if (!(await pmRepo.isParticipant(conversationId, viewerId))) return;
  await pmRepo.markRead(conversationId, viewerId);
}

export async function getUnreadCount(userId: string): Promise<number> {
  return pmRepo.countUnread(userId);
}

export async function searchPeople(
  viewerId: string,
  query: string,
  excludeIds: string[] = [],
): Promise<PmPerson[]> {
  return userRepo.findPublicByNameQuery(query, 8, [viewerId, ...excludeIds]);
}

export function sendErrorStatus(error: SendPmError): number {
  switch (error) {
    case "banned":
    case "recipient_banned":
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    default:
      return 400;
  }
}

export function sendErrorMessage(error: SendPmError): string {
  switch (error) {
    case "banned":
      return "Conta suspensa";
    case "self":
      return "Escolha pelo menos outra pessoa";
    case "not_found":
      return "Usuário não encontrado";
    case "ignored":
      return "Não é possível enviar mensagem para este usuário";
    case "recipient_banned":
      return "Esta conta está suspensa";
    case "forbidden":
      return "Sem permissão";
    case "empty":
      return "Escreva uma mensagem";
    case "too_long":
      return `A mensagem pode ter no máximo ${PM_MAX_LENGTH} caracteres`;
    case "too_many":
      return `A conversa pode ter no máximo ${PM_MAX_PARTICIPANTS} pessoas`;
    case "already_member":
      return "Essa pessoa já está na conversa";
  }
}
