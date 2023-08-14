// ! In production, this should be replaced by an actual database
const store = new Map();
import type { Tokens } from "./discord";

function storeDiscordTokens(userId: string, tokens: Tokens) {
  store.set(`discord-${userId}`, tokens);
}

function getDiscordTokens(userId: string | number) {
  return store.get(`discord-${userId}`);
}

export default { getDiscordTokens, storeDiscordTokens };
