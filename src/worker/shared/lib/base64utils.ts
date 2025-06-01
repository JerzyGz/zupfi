export function uint8ArrayToBinaryString(bytes: Uint8Array): string {
  return String.fromCodePoint(...bytes);
}

/**
 * Encodes a binary string to URL-safe Base64.
 */
export function base64UrlEncode(binaryString: string): string {
  return btoa(binaryString)
    .replace(/\+/g, "-") // replace '+' by '-'
    .replace(/\//g, "_") // replace '/' by '_'
    .replace(/=+$/, ""); // remove padding '='
}
