// KOOK Message Sending

import {
  sendKookMessage as apiSendKookMessage,
  sendKookDirectMessage as apiSendKookDirectMessage,
} from "./api.js";
import { resolveKookAccount } from "./accounts.js";
import { resolveKookToken } from "./token.js";
import { loadConfig } from "../config/io.js";
import type { OpenClawConfig } from "../config/types.openclaw.js";

export type KookSendOpts = {
  accountId?: string;
  token?: string;
  type?: 1 | 9 | 10; // 1=text, 9=kmarkdown, 10=card
  quote?: string; // Reply to message ID
  nonce?: string;
};

export type KookSendResult = {
  channel: "kook";
  messageId: string;
  timestamp: number;
};

/**
 * Parse target string to extract targetId and channel type
 */
function parseTarget(to: string): { targetId: string; isDm: boolean } {
  // Format: "user:<id>" for DM, "channel:<id>" or just "<id>" for channel
  if (to.startsWith("user:")) {
    return { targetId: to.slice(5), isDm: true };
  }
  if (to.startsWith("channel:")) {
    return { targetId: to.slice(8), isDm: false };
  }
  return { targetId: to, isDm: false };
}

/**
 * Send a text message to KOOK channel or user
 * Alias for sendMessageKook for backward compatibility
 */
/**
 * Send a text message to KOOK channel or user
 * Alias for sendMessageKook for backward compatibility
 */
export async function sendKookMessage(
  to: string,
  text: string,
  opts: KookSendOpts = {},
  cfg?: OpenClawConfig,
): Promise<KookSendResult> {
  return sendMessageKook(to, text, opts, cfg);
}

/**
 * Send a text message to KOOK channel or user
 */
export async function sendMessageKook(
  to: string,
  text: string,
  opts: KookSendOpts = {},
  cfg?: OpenClawConfig,
): Promise<KookSendResult> {
  console.log(`[KOOK-SEND] sendMessageKook called: to="${to}", text="${text.slice(0, 50)}..."`);

  console.log(
    `[KOOK-SEND] Parameters check: opts.token=${opts.token ? "exists" : "MISSING"}, cfg=${cfg ? "exists" : "MISSING"}`,
  );
  console.log(`[KOOK-SEND] accountId from opts: ${opts.accountId || "default"}`);

  // Get token from opts or resolve from config
  let token = opts.token || "";

  // If no token in opts, resolve from config
  if (!token) {
    console.log(`[KOOK-SEND] Attempting to resolve token from config...`);

    // Ensure we have a valid config (either provided or loaded from file)
    let effectiveCfg = cfg;
    if (!effectiveCfg) {
      console.log(`[KOOK-SEND] cfg is missing, loading from file...`);
      try {
        effectiveCfg = loadConfig();
        console.log(`[KOOK-SEND] Config loaded from file`);
      } catch (error) {
        console.error(`[KOOK-SEND] Failed to load config from file:`, error);
      }
    }

    // If cfg is provided (or loaded), use it to resolve token
    if (effectiveCfg) {
      const account = resolveKookAccount({ cfg: effectiveCfg, accountId: opts.accountId });
      token = account.token || "";
      console.log(
        `[KOOK-SEND] Resolved token from config: ${token ? "FOUND" : "MISSING"}, length=${token.length}`,
      );
    } else {
      // If cfg is missing, use direct token resolution (will try env)
      console.log(`[KOOK-SEND] cfg is missing, using direct token resolution...`);
      const tokenRes = resolveKookToken(undefined, { accountId: opts.accountId });
      token = tokenRes.token;
      console.log(
        `[KOOK-SEND] Resolved token directly: ${token ? "FOUND" : "MISSING"}, length=${token.length}, source=${tokenRes.source}`,
      );
    }
  }

  // Final check
  if (!token) {
    console.error(`[KOOK-SEND] Token not found in opts or config!`);
    throw new Error("KOOK token not found");
  }

  console.log(`[KOOK-SEND] Using token: length=${token.length}`);

  const { targetId, isDm } = parseTarget(to);
  const type = opts.type || 1; // Default to text

  console.log(`[KOOK-SEND] Parsed target: targetId="${targetId}", isDm=${isDm}, type=${type}`);

  // Send message using API functions
  const sendFn = isDm ? apiSendKookDirectMessage : apiSendKookMessage;
  console.log(`[KOOK-SEND] Using API: ${isDm ? "direct-message/create" : "message/create"}`);

  try {
    const result = await sendFn({
      token,
      type,
      targetId,
      content: text,
      quote: opts.quote,
      nonce: opts.nonce,
    });

    console.log(`[KOOK-SEND] Message sent successfully: msgId=${result.msgId}`);

    return {
      channel: "kook",
      messageId: result.msgId,
      timestamp: result.msgTimestamp,
    };
  } catch (error) {
    console.error(`[KOOK-SEND] Failed to send message: ${error}`);
    throw error;
  }
}

/**
 * Send a direct message (convenience wrapper)
 */
export async function sendDirectMessageKook(
  userId: string,
  text: string,
  opts: KookSendOpts = {},
  cfg?: OpenClawConfig,
): Promise<KookSendResult> {
  return sendMessageKook(`user:${userId}`, text, opts, cfg);
}
