import {
  uint8ArrayToBinaryString,
  base64UrlEncode,
} from "@/worker/shared/lib/base64utils";

export interface TokenValidationSuccess {
  isValid: true;
  userId: string;
}

export interface TokenValidationFailure {
  isValid: false;
  reason:
    | "TOKEN_NOT_FOUND_OR_EXPIRED"
    | "TOKEN_EXPIRED"
    | "TOKEN_ALREADY_USED"
    | "INVALID_TOKEN_FORMAT";
}

export interface TokenData {
  userId: string;
  createdAt: number; // Timestamp en milisegundos
  expiresAt: number; // Timestamp en milisegundos
  isUsed: boolean;
}

export type TokenValidationResult =
  | TokenValidationSuccess
  | TokenValidationFailure;

const TOKEN_EXPIRATION_MINUTES = 15;
const TOKEN_TTL_SECONDS = TOKEN_EXPIRATION_MINUTES * 60; // TTL en segundos para Cloudflare KV

export class TelegramDeepLinkTokenManager {
  private tokenStore: KVNamespace<string>;

  constructor(tokenStore: KVNamespace) {
    this.tokenStore = tokenStore;
  }

  async generateTelegramDeepLinkTokenUrl({
    id,
    botName,
    prefixToken,
  }: {
    id: string;
    botName: string;
    prefixToken: string;
  }): Promise<string> {
    const token = await this.generateOneTimeToken(id);
    const urlToken = `${prefixToken}_${token}`;
    return new URL(`https://t.me/${botName}?start=${urlToken}`).toString();
  }

  // TODO: could be extended to handle more data instead of just user id
  async generateOneTimeToken(id: string): Promise<string> {
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);

    const token = base64UrlEncode(uint8ArrayToBinaryString(randomBytes));

    const now = Date.now();
    const expiresAt = now + TOKEN_EXPIRATION_MINUTES * 60 * 1000; // milisegundos

    const tokenData: TokenData = {
      userId: id,
      createdAt: now,
      expiresAt: expiresAt,
      isUsed: false,
    };

    //https://developers.cloudflare.com/kv/api/write-key-value-pairs/#expiring-keys
    await this.tokenStore.put(`token:${token}`, JSON.stringify(tokenData), {
      expirationTtl: TOKEN_TTL_SECONDS,
    });

    return token;
  }

  async validateToken(token: string): Promise<TokenValidationResult> {
    const tokenKey = `token:${token}`;
    const tokenDataString = await this.tokenStore.get(tokenKey);

    if (!tokenDataString) {
      return { isValid: false, reason: "TOKEN_NOT_FOUND_OR_EXPIRED" };
    }

    const tokenData: TokenData = JSON.parse(tokenDataString);
    const now = Date.now();
    console.log("Token data:", tokenData);
    if (tokenData.expiresAt < now) {
      await this.tokenStore.delete(tokenKey);
      return { isValid: false, reason: "TOKEN_EXPIRED" };
    }

    if (tokenData.isUsed) {
      return { isValid: false, reason: "TOKEN_ALREADY_USED" };
    }

    // Mark the token as used
    tokenData.isUsed = true;

    //https://developers.cloudflare.com/kv/api/write-key-value-pairs/#expiring-keys
    await this.tokenStore.put(tokenKey, JSON.stringify(tokenData), {
      expirationTtl: TOKEN_TTL_SECONDS,
    });

    return { isValid: true, userId: tokenData.userId };
  }

  async validateTelegramDeepLinkToken({
    token,
    prefixToken,
  }: {
    token: string;
    prefixToken: string;
  }): Promise<TokenValidationResult> {
    if (!token.startsWith(prefixToken)) {
      return { isValid: false, reason: "INVALID_TOKEN_FORMAT" };
    }
    // +1 to skip the underscore after the prefix
    const tokenValue = token.substring(prefixToken.length + 1);
    return this.validateToken(tokenValue);
  }
}
