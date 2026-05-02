// ============================================================
// engine/tiktokChannels.ts — Supabase CRUD for TikTok channels
// Phase 18: TikTok Channel Manager
//
// ALL credential encryption/decryption happens HERE, not in components.
// Components receive/pass CryptoKey opaquely.
// ============================================================
import { supabase } from '../lib/supabase';
import { encrypt, decrypt } from './encryption';
import type {
  TiktokChannel,
  TiktokChannelStatus,
  EncryptedCredentials,
  PlainCredentials,
} from '../types';

// ── Row → Frontend type ───────────────────────────────────────
function parseEncField(raw: string | null): EncryptedCredentials | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as EncryptedCredentials; } catch { return null; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToChannel(row: Record<string, any>): TiktokChannel {
  return {
    id:            row['id'],
    userId:        row['user_id'],
    workspaceId:   row['workspace_id'] ?? null,
    channelName:   row['channel_name'],
    username:      row['username'],
    channelUrl:    row['channel_url'],
    channelId:     row['channel_id'] ?? null,
    uuid:          row['uuid'] ?? null,
    targetKeywords: row['target_keywords'] ?? [],
    niche:          row['niche'] ?? null,
    language:       row['language'] ?? null,
    regionCountry:  row['region_country'] ?? null,
    status:         (row['status'] ?? 'active') as TiktokChannelStatus,
    healthScore:    row['health_score'] ?? null,
    lastPostAt:     row['last_post_at'] ?? null,
    lastLoginAt:    row['last_login_at'] ?? null,
    postingFrequency: row['posting_frequency'] ?? null,
    followersCount:   row['followers_count'] ?? 0,
    followingCount:   row['following_count'] ?? 0,
    videosCount:      row['videos_count'] ?? 0,
    totalLikes:       row['total_likes'] ?? 0,
    avgViews:         row['avg_views'] ?? 0,
    engagementRate:   row['engagement_rate'] ?? null,
    metricsUpdatedAt: row['metrics_updated_at'] ?? null,
    accountCreatedAt: row['account_created_at'] ?? null,
    isMonetized:      row['is_monetized'] ?? false,
    isCreatorFund:    row['is_creator_fund'] ?? false,
    encryptedEmail:           parseEncField(row['encrypted_email']),
    encryptedSecondaryEmail:  parseEncField(row['encrypted_secondary_email']),
    encryptedPassword:        parseEncField(row['encrypted_password']),
    encryptedToken:           parseEncField(row['encrypted_token']),
    encryptedCookie:          parseEncField(row['encrypted_cookie']),
    encryptedRecoveryCodes:   parseEncField(row['encrypted_recovery_codes']),
    encryptedPhone:           parseEncField(row['encrypted_phone']),
    encryptionMethod:         row['encryption_method'] ?? 'aes-256-gcm-pbkdf2',
    proxyUrl:          row['proxy_url'] ?? null,
    proxyCountry:      row['proxy_country'] ?? null,
    deviceFingerprint: row['device_fingerprint'] ?? null,
    userAgent:         row['user_agent'] ?? null,
    tags:       row['tags'] ?? [],
    notes:      row['notes'] ?? null,
    ownerLabel: row['owner_label'] ?? null,
    priority:   row['priority'] ?? 0,
    createdAt:  row['created_at'],
    updatedAt:  row['updated_at'],
  };
}

function encFieldToDb(enc: EncryptedCredentials | null | undefined): string | null {
  if (!enc) return null;
  return JSON.stringify(enc);
}

function channelToInsertRow(
  ch: Omit<TiktokChannel, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string,
) {
  return {
    user_id:        userId,
    workspace_id:   ch.workspaceId ?? null,
    channel_name:   ch.channelName,
    username:       ch.username,
    channel_url:    ch.channelUrl,
    channel_id:     ch.channelId ?? null,
    uuid:           ch.uuid ?? null,
    target_keywords: ch.targetKeywords ?? [],
    niche:          ch.niche ?? null,
    language:       ch.language ?? null,
    region_country: ch.regionCountry ?? null,
    status:         ch.status ?? 'active',
    health_score:   ch.healthScore ?? null,
    last_post_at:   ch.lastPostAt ?? null,
    last_login_at:  ch.lastLoginAt ?? null,
    posting_frequency: ch.postingFrequency ?? null,
    followers_count:  ch.followersCount ?? 0,
    following_count:  ch.followingCount ?? 0,
    videos_count:     ch.videosCount ?? 0,
    total_likes:      ch.totalLikes ?? 0,
    avg_views:        ch.avgViews ?? 0,
    engagement_rate:  ch.engagementRate ?? null,
    account_created_at: ch.accountCreatedAt ?? null,
    is_monetized:   ch.isMonetized ?? false,
    is_creator_fund: ch.isCreatorFund ?? false,
    encrypted_email:           encFieldToDb(ch.encryptedEmail),
    encrypted_secondary_email: encFieldToDb(ch.encryptedSecondaryEmail),
    encrypted_password:        encFieldToDb(ch.encryptedPassword),
    encrypted_token:           encFieldToDb(ch.encryptedToken),
    encrypted_cookie:          encFieldToDb(ch.encryptedCookie),
    encrypted_recovery_codes:  encFieldToDb(ch.encryptedRecoveryCodes),
    encrypted_phone:           encFieldToDb(ch.encryptedPhone),
    encryption_method: ch.encryptionMethod ?? 'aes-256-gcm-pbkdf2',
    proxy_url:          ch.proxyUrl ?? null,
    proxy_country:      ch.proxyCountry ?? null,
    device_fingerprint: ch.deviceFingerprint ?? null,
    user_agent:         ch.userAgent ?? null,
    tags:       ch.tags ?? [],
    notes:      ch.notes ?? null,
    owner_label: ch.ownerLabel ?? null,
    priority:   ch.priority ?? 0,
  };
}

// ── CRUD ──────────────────────────────────────────────────────
export async function fetchChannels(
  userId: string,
  workspaceId?: string | null,
): Promise<TiktokChannel[]> {
  let q = supabase
    .from('tiktok_channels')
    .select('*')
    .eq('user_id', userId)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (workspaceId) q = q.eq('workspace_id', workspaceId);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(rowToChannel);
}

export async function insertChannel(
  ch: Omit<TiktokChannel, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string,
): Promise<TiktokChannel> {
  const row = channelToInsertRow({ ...ch, userId } as Omit<TiktokChannel, 'id' | 'createdAt' | 'updatedAt'>, userId);
  const { data, error } = await supabase
    .from('tiktok_channels').insert(row).select().single();
  if (error) throw error;
  return rowToChannel(data as Record<string, unknown>);
}

export async function updateChannel(
  id: string,
  patch: Partial<TiktokChannel>,
): Promise<TiktokChannel> {
  // Build only the columns that changed (avoid overwriting unrelated fields)
  const row: Record<string, unknown> = {};
  const map: [keyof TiktokChannel, string][] = [
    ['channelName','channel_name'], ['username','username'], ['channelUrl','channel_url'],
    ['channelId','channel_id'], ['uuid','uuid'], ['targetKeywords','target_keywords'],
    ['niche','niche'], ['language','language'], ['regionCountry','region_country'],
    ['status','status'], ['healthScore','health_score'], ['lastPostAt','last_post_at'],
    ['lastLoginAt','last_login_at'], ['postingFrequency','posting_frequency'],
    ['followersCount','followers_count'], ['followingCount','following_count'],
    ['videosCount','videos_count'], ['totalLikes','total_likes'],
    ['avgViews','avg_views'], ['engagementRate','engagement_rate'],
    ['accountCreatedAt','account_created_at'], ['isMonetized','is_monetized'],
    ['isCreatorFund','is_creator_fund'], ['encryptionMethod','encryption_method'],
    ['proxyUrl','proxy_url'], ['proxyCountry','proxy_country'],
    ['deviceFingerprint','device_fingerprint'], ['userAgent','user_agent'],
    ['tags','tags'], ['notes','notes'], ['ownerLabel','owner_label'], ['priority','priority'],
  ];
  for (const [jsKey, dbKey] of map) {
    if (jsKey in patch) row[dbKey] = patch[jsKey];
  }
  // Encrypted fields need JSON serialization
  const encMap: [keyof TiktokChannel, string][] = [
    ['encryptedEmail','encrypted_email'],
    ['encryptedSecondaryEmail','encrypted_secondary_email'],
    ['encryptedPassword','encrypted_password'],
    ['encryptedToken','encrypted_token'],
    ['encryptedCookie','encrypted_cookie'],
    ['encryptedRecoveryCodes','encrypted_recovery_codes'],
    ['encryptedPhone','encrypted_phone'],
  ];
  for (const [jsKey, dbKey] of encMap) {
    if (jsKey in patch) {
      const v = patch[jsKey] as EncryptedCredentials | null | undefined;
      row[dbKey] = v ? JSON.stringify(v) : null;
    }
  }

  const { data, error } = await supabase
    .from('tiktok_channels').update(row).eq('id', id).select().single();
  if (error) throw error;
  return rowToChannel(data as Record<string, unknown>);
}

export async function deleteChannel(id: string): Promise<void> {
  const { error } = await supabase.from('tiktok_channels').delete().eq('id', id);
  if (error) throw error;
}

// ── Credential encryption helpers ─────────────────────────────
type CredField = keyof PlainCredentials;
const CRED_FIELD_MAP: Array<{
  plain: CredField;
  enc: keyof Pick<
    TiktokChannel,
    | 'encryptedEmail' | 'encryptedSecondaryEmail' | 'encryptedPassword'
    | 'encryptedToken' | 'encryptedCookie' | 'encryptedPhone'
  >;
}> = [
  { plain: 'email',          enc: 'encryptedEmail' },
  { plain: 'secondaryEmail', enc: 'encryptedSecondaryEmail' },
  { plain: 'password',       enc: 'encryptedPassword' },
  { plain: 'token',          enc: 'encryptedToken' },
  { plain: 'cookie',         enc: 'encryptedCookie' },
  { plain: 'phone',          enc: 'encryptedPhone' },
];

/**
 * Encrypt all non-empty PlainCredentials fields using the provided CryptoKey.
 * Returns partial TiktokChannel fields ready to be merged into an update.
 */
export async function encryptCredentials(
  creds: PlainCredentials,
  key: CryptoKey,
): Promise<Partial<TiktokChannel>> {
  const patch: Partial<TiktokChannel> = {};

  for (const { plain, enc } of CRED_FIELD_MAP) {
    const value = creds[plain] as string | undefined;
    if (value !== undefined) {
      (patch as Record<string, unknown>)[enc] = value ? await encrypt(value, key) : null;
    }
  }

  if (creds.recoveryCodes !== undefined) {
    patch.encryptedRecoveryCodes = creds.recoveryCodes?.length
      ? await encrypt(JSON.stringify(creds.recoveryCodes), key)
      : null;
  }
  return patch;
}

/**
 * Decrypt all encrypted fields from a TiktokChannel using the CryptoKey.
 * Returns PlainCredentials; fields that fail to decrypt are omitted.
 */
export async function decryptCredentials(
  channel: TiktokChannel,
  key: CryptoKey,
): Promise<PlainCredentials> {
  const creds: PlainCredentials = {};

  for (const { plain, enc } of CRED_FIELD_MAP) {
    const encVal = channel[enc] as EncryptedCredentials | null | undefined;
    if (encVal) {
      try {
        (creds as Record<string, unknown>)[plain] = await decrypt(encVal.ciphertext, encVal.iv, key);
      } catch { /* wrong key or corrupted — skip */ }
    }
  }

  if (channel.encryptedRecoveryCodes) {
    try {
      const raw = await decrypt(
        channel.encryptedRecoveryCodes.ciphertext,
        channel.encryptedRecoveryCodes.iv,
        key,
      );
      creds.recoveryCodes = JSON.parse(raw) as string[];
    } catch { /* skip */ }
  }

  return creds;
}

// ── Audit log ─────────────────────────────────────────────────
export type AuditAction =
  | 'view_password' | 'view_token' | 'view_cookie'
  | 'view_recovery' | 'export' | 'edit';

export async function logCredentialAccess(params: {
  userId: string;
  channelId: string;
  action: AuditAction;
}): Promise<void> {
  try {
    await supabase.from('credential_access_log').insert({
      user_id:    params.userId,
      channel_id: params.channelId,
      action:     params.action,
      user_agent: navigator.userAgent,
    });
  } catch (err) {
    // Audit log failure is non-fatal but should be noted
    console.warn('[audit] Failed to log credential access:', err);
  }
}

export async function fetchAuditLog(
  userId: string,
  channelId?: string,
  limit = 50,
) {
  let q = supabase
    .from('credential_access_log')
    .select('*')
    .eq('user_id', userId)
    .order('accessed_at', { ascending: false })
    .limit(limit);
  if (channelId) q = q.eq('channel_id', channelId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

// ── Master password helpers ───────────────────────────────────
export async function fetchMasterPasswordRecord(userId: string) {
  const { data } = await supabase
    .from('user_master_password')
    .select('salt, canary_ciphertext, canary_iv')
    .eq('user_id', userId)
    .single();
  return data as { salt: string; canary_ciphertext: string; canary_iv: string } | null;
}

export async function saveMasterPasswordRecord(
  userId: string,
  salt: string,
  canaryCiphertext: string,
  canaryIv: string,
): Promise<void> {
  const { error } = await supabase.from('user_master_password').upsert({
    user_id:           userId,
    salt,
    canary_ciphertext: canaryCiphertext,
    canary_iv:         canaryIv,
  }, { onConflict: 'user_id' });
  if (error) throw error;
}
