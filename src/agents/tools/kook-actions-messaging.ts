import type {AgentToolResult} from "@mariozechner/pi-agent-core";
import type {KookActionConfig} from "../../config/config.js";
import {
  addKookReaction,
  deleteKookMessage,
  deleteKookReaction,
  getKookMessage,
  getKookMessageList,
  getKookReactionList,
  sendKookMessage,
  updateKookMessage,
} from "../../kook/api.js";
import {type ActionGate, jsonResult, readNumberParam, readStringParam,} from "./common.js";
import {withNormalizedTimestamp} from "../date-time.js";

export async function handleKookMessagingAction(
  action: string,
  params: Record<string, unknown>,
  isActionEnabled: ActionGate<KookActionConfig>,
): Promise<AgentToolResult<unknown>> {
  const accountId = readStringParam(params, "accountId");
  // Note: Token resolution is handled in the main handler

  switch (action) {
    case "sendMessage": {
      if (!isActionEnabled("messages")) {
        throw new Error("KOOK message sending is disabled.");
      }
      const to = readStringParam(params, "to", { required: true });
      const content = readStringParam(params, "content", { required: true });
      const type = readNumberParam(params, "type", {}) ?? 1;
      const quote = readStringParam(params, "quote");
      const nonce = readStringParam(params, "nonce");

      // Parse target format "channel:123" or "user:456"
      const targetMatch = to.match(/^(channel|user):(.+)$/);
      if (!targetMatch) {
        throw new Error("Invalid target format. Expected 'channel:<id>' or 'user:<id>'");
      }

      const [, targetType, targetId] = targetMatch;

      const result = await sendKookMessage({
        token: params.token as string,
        type,
        targetId,
        content,
        quote,
        nonce,
      });

      return jsonResult({
        ok: true,
        msgId: result.msgId,
        msgTimestamp: result.msgTimestamp,
        nonce: result.nonce,
      });
    }

    case "readMessages": {
      if (!isActionEnabled("messages")) {
        throw new Error("KOOK message reading is disabled.");
      }
      const channelId = readStringParam(params, "channelId", { required: true });
      const limit = readNumberParam(params, "limit", {}) ?? 20;
      const msgId = readStringParam(params, "msgId");
      const flag = readStringParam(params, "flag");

      const messages = await getKookMessageList({
        token: params.token as string,
        targetId: channelId,
        msgId,
        flag: (flag as "before" | "around" | "after") || undefined,
        pageSize: limit ?? 20,
      });

      return jsonResult({
        ok: true,
        messages: messages.map((msg) =>
          withNormalizedTimestamp(msg as Record<string, unknown>, msg.createAt),
        ),
      });
    }

    case "fetchMessage": {
      if (!isActionEnabled("messages")) {
        throw new Error("KOOK message fetching is disabled.");
      }
      const msgId = readStringParam(params, "msgId", { required: true });

      const message = await getKookMessage({
        token: params.token as string,
        msgId,
      });

      return jsonResult({
        ok: true,
        message: withNormalizedTimestamp(message as Record<string, unknown>, message.createAt),
      });
    }

    case "editMessage": {
      if (!isActionEnabled("messages")) {
        throw new Error("KOOK message editing is disabled.");
      }
      const channelId = readStringParam(params, "channelId", { required: true });
      const msgId = readStringParam(params, "messageId", { required: true });
      const content = readStringParam(params, "content", { required: true });
      const quote = readStringParam(params, "quote");

      await updateKookMessage({
        token: params.token as string,
        msgId,
        content,
        quote,
      });

      return jsonResult({ ok: true });
    }

    case "deleteMessage": {
      if (!isActionEnabled("messages")) {
        throw new Error("KOOK message deletion is disabled.");
      }
      const channelId = readStringParam(params, "channelId", { required: true });
      const msgId = readStringParam(params, "messageId", { required: true });

      await deleteKookMessage({
        token: params.token as string,
        msgId,
      });

      return jsonResult({ ok: true });
    }

    case "react": {
      if (!isActionEnabled("reactions")) {
        throw new Error("KOOK reactions are disabled.");
      }
      const channelId = readStringParam(params, "channelId", { required: true });
      const messageId = readStringParam(params, "messageId", { required: true });
      const emoji = readStringParam(params, "emoji", { required: true });

      await addKookReaction({
        token: params.token as string,
        msgId: messageId,
        emoji,
      });

      return jsonResult({ ok: true });
    }

    case "reactions": {
      if (!isActionEnabled("reactions")) {
        throw new Error("KOOK reactions are disabled.");
      }
      const channelId = readStringParam(params, "channelId", { required: true });
      const messageId = readStringParam(params, "messageId", { required: true });
      const emoji = readStringParam(params, "emoji", { required: true });
      const limit = readNumberParam(params, "limit", {}) ?? 50;

      const users = await getKookReactionList({
        token: params.token as string,
        msgId: messageId,
        emoji,
      });

      return jsonResult({
        ok: true,
        users: users.map((u) => ({
          id: u.id,
          username: u.username,
          nickname: u.nickname,
          identifyNum: u.identifyNum,
          online: u.online,
          bot: u.bot,
          avatar: u.avatar,
          reactionTime: u.reactionTime,
        })),
      });
    }

    case "removeReaction": {
      if (!isActionEnabled("reactions")) {
        throw new Error("KOOK reactions are disabled.");
      }
      const channelId = readStringParam(params, "channelId", { required: true });
      const messageId = readStringParam(params, "messageId", { required: true });
      const emoji = readStringParam(params, "emoji", { required: true });
      const userId = readStringParam(params, "userId");

      await deleteKookReaction({
        token: params.token as string,
        msgId: messageId,
        emoji,
        userId,
      });

      return jsonResult({ ok: true });
    }

    default:
      throw new Error(`Unknown KOOK messaging action: ${action}`);
  }
}
