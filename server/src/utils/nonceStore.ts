const nonceMap = new Map<string, string>(); // address -> nonce

export function generateNonce(): string {
  return Math.floor(Math.random() * 1000000).toString();
}

export function saveNonce(address: string, nonce: string) {
  nonceMap.set(address.toLowerCase(), nonce);
}

export function getNonce(address: string): string | undefined {
  return nonceMap.get(address.toLowerCase());
}

export function clearNonce(address: string) {
  nonceMap.delete(address.toLowerCase());
}
