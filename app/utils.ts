
export function parseText(text: Uint8Array | undefined) : string | undefined {
  if (text === undefined)
    return undefined;
  return decodeURIComponent(Buffer.from(text).toString());
}

export function parseHex(text: Uint8Array | undefined) : string | undefined {
  if (text === undefined)
    return undefined;
  return `0x${Buffer.from(text).toString("hex")}`;
}

export function parseState(state: Uint8Array | undefined) : any {
  if (state === undefined || state === null || state.length === 0)
    return {};
  return JSON.parse(decodeURIComponent(Buffer.from(state).toString()));
}

export function parseStateFromUntrusted(state: string | undefined) : any {
  if (state === undefined || state === null || state.length === 0)
    return {};
  return JSON.parse(decodeURIComponent(state.toString()));
}