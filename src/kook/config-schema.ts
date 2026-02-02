// KOOK Configuration Schema
import { z } from "zod";

const DmPolicySchema = z.enum(["open", "allowlist", "pairing"]);
const GroupPolicySchema = z.enum(["open", "allowlist", "disabled"]);
const ReplyToModeSchema = z.enum(["off", "first", "all"]);

const KookChannelConfigSchema = z
  .object({
    allow: z.boolean().optional(),
    users: z.array(z.union([z.string(), z.number()])).optional(),
  })
  .strict();

const KookGuildConfigSchema = z
  .object({
    slug: z.string().optional(),
    requireMention: z.boolean().optional(),
    users: z.array(z.union([z.string(), z.number()])).optional(),
    channels: z.record(z.string(), KookChannelConfigSchema.optional()).optional(),
  })
  .strict();

const KookDmConfigSchema = z
  .object({
    enabled: z.boolean().optional(),
    policy: DmPolicySchema.optional().default("allowlist"),
    allowFrom: z.array(z.union([z.string(), z.number()])).optional(),
  })
  .strict();

const KookAccountConfigSchema = z
  .object({
    name: z.string().optional(),
    enabled: z.boolean().optional(),
    token: z.string().optional(),
    tokenFile: z.string().optional(),
    dm: KookDmConfigSchema.optional(),
    groupPolicy: GroupPolicySchema.optional().default("disabled"),
    guilds: z.record(z.string(), KookGuildConfigSchema.optional()).optional(),
    historyLimit: z.number().optional(),
    mediaMaxMb: z.number().optional(),
    textChunkLimit: z.number().optional(),
    replyToMode: ReplyToModeSchema.optional(),
  })
  .strict();

export const KookConfigSchema = z
  .object({
    enabled: z.boolean().optional(),
    token: z.string().optional(),
    tokenFile: z.string().optional(),
    dm: KookDmConfigSchema.optional(),
    groupPolicy: GroupPolicySchema.optional().default("disabled"),
    guilds: z.record(z.string(), KookGuildConfigSchema.optional()).optional(),
    historyLimit: z.number().optional(),
    mediaMaxMb: z.number().optional(),
    textChunkLimit: z.number().optional(),
    replyToMode: ReplyToModeSchema.optional(),
    accounts: z.record(z.string(), KookAccountConfigSchema.optional()).optional(),
    actions: z.record(z.string(), z.boolean()).optional(),
  })
  .strict();

export type KookConfigSchemaType = z.infer<typeof KookConfigSchema>;
export type KookAccountConfigSchemaType = z.infer<typeof KookAccountConfigSchema>;
