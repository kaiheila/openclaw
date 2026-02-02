import type { ChannelMessageActionAdapter, ChannelMessageActionName } from "../types.js";
import { createActionGate, readStringParam } from "../../../agents/tools/common.js";
import { handleKookAction } from "../../../agents/tools/kook-actions.js";
import { listKookAccountIds } from "../../../kook/accounts.js";

const providerId = "kook";

export const kookMessageActions: ChannelMessageActionAdapter = {
  listActions: ({ cfg }) => {
    const accountIds = listKookAccountIds(cfg);
    if (accountIds.length === 0) {
      return [];
    }
    const gate = createActionGate(cfg.channels?.kook?.actions);
    const actions = new Set<ChannelMessageActionName>();
    if (gate("getMe")) {
      actions.add("getMe" as ChannelMessageActionName);
    }
    if (gate("getUser")) {
      actions.add("getUser" as ChannelMessageActionName);
    }
    if (gate("getGuildList")) {
      actions.add("getGuildList" as ChannelMessageActionName);
    }
    if (gate("getGuild")) {
      actions.add("getGuild" as ChannelMessageActionName);
    }
    if (gate("getGuildUserCount")) {
      actions.add("getGuildUserCount" as ChannelMessageActionName);
    }
    if (gate("getChannel")) {
      actions.add("getChannel" as ChannelMessageActionName);
    }
    if (gate("getChannelUserList")) {
      actions.add("getChannelUserList" as ChannelMessageActionName);
    }
    if (gate("getGuildUsers")) {
      actions.add("getGuildUsers" as ChannelMessageActionName);
    }
    return Array.from(actions);
  },
  supportsButtons: () => false,
  extractToolSend: () => null,
  handleAction: async ({ action, params, cfg, accountId }) => {
    if (action === "getMe") {
      return await handleKookAction(
        {
          action: "getMe",
          accountId: accountId ?? undefined,
        },
        cfg,
      );
    }

    if (action === "getUser") {
      const userId = readStringParam(params, "userId", { required: true });
      const guildId = readStringParam(params, "guildId");
      return await handleKookAction(
        {
          action: "getUser",
          userId,
          guildId,
          accountId: accountId ?? undefined,
        },
        cfg,
      );
    }

    if (action === "getGuildList") {
      return await handleKookAction(
        {
          action: "getGuildList",
          accountId: accountId ?? undefined,
        },
        cfg,
      );
    }

    if (action === "getGuild") {
      const guildId = readStringParam(params, "guildId", { required: true });
      return await handleKookAction(
        {
          action: "getGuild",
          guildId,
          accountId: accountId ?? undefined,
        },
        cfg,
      );
    }

    if (action === "getGuildUserCount") {
      const guildId = readStringParam(params, "guildId", { required: true });
      return await handleKookAction(
        {
          action: "getGuildUserCount",
          guildId,
          accountId: accountId ?? undefined,
        },
        cfg,
      );
    }

    if (action === "getChannel") {
      const channelId = readStringParam(params, "channelId", { required: true });
      return await handleKookAction(
        {
          action: "getChannel",
          channelId,
          accountId: accountId ?? undefined,
        },
        cfg,
      );
    }

    if (action === "getChannelUserList") {
      const channelId = readStringParam(params, "channelId", { required: true });
      return await handleKookAction(
        {
          action: "getChannelUserList",
          channelId,
          accountId: accountId ?? undefined,
        },
        cfg,
      );
    }

    if (action === "getGuildUsers") {
      const guildId = readStringParam(params, "guildId", { required: true });
      const page = readStringParam(params, "page") ?? "1";
      const pageSize = readStringParam(params, "pageSize") ?? "50";
      return await handleKookAction(
        {
          action: "getGuildUsers",
          guildId,
          page: parseInt(page, 10),
          pageSize: parseInt(pageSize, 10),
          accountId: accountId ?? undefined,
        },
        cfg,
      );
    }

    throw new Error(`Action ${action} is not supported for provider ${providerId}.`);
  },
};
