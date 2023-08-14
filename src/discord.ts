/*
 * The following methods all facilitate OAuth2 communication with Discord.
 * See https://discord.com/developers/docs/topics/oauth2 for more details.
 */
import crypto from 'crypto';
import storage from './storage';

export type Tokens = {
  access_token: string,
  refresh_token: string,
  expires_at: number
}

/*
 * Generate the url which the user will be directed to in order to approve the
 * bot, and see the list of requested scopes.
 */
function getOAuthUrl() {
  const state = crypto.randomUUID();
  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", process.env.DISCORD_CLIENT_ID);
  url.searchParams.set("redirect_uri", process.env.DISCORD_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "role_connections.write identify");
  url.searchParams.set("prompt", "consent");
  return { state, url: url.toString() };
}

/*
 * Given an OAuth2 code from the scope approval page, make a request to Discord's
 * OAuth2 service to retrieve an access token, refresh token, and expiration.
 */
async function getOAuthTokens(code: string) {
  const url = "https://discord.com/api/v10/oauth2/token";
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
  });

  const response = await fetch(url, {
    body,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    throw new Error(
      `Error fetching OAuth tokens: [${response.status}] ${response.statusText}`
    );
  }
}

/*
 * The initial token request comes with both an access token and a refresh
 * token.  Check if the access token has expired, and if it has, use the
 * refresh token to acquire a new, fresh access token.
 */
async function getAccessToken(userId: string, tokens: Tokens) {
  if (Date.now() > tokens.expires_at) {
    const url = "https://discord.com/api/v10/oauth2/token";
    const body = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
    });
    const response = await fetch(url, {
      body,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (response.ok) {
      const tokens = await response.json();
      tokens.expires_at = Date.now() + tokens.expires_in * 1000;
      storage.storeDiscordTokens(userId, tokens);
      return tokens.access_token;
    } else {
      console.error(
        `Error refreshing access token: [${response.status}] ${response.statusText}`

      )
    }
  }
  return tokens.access_token;
}

/*
 * Given a user based access token, fetch profile information for the current user.
 */
async function getUserData(tokens: Tokens) {
  const url = "https://discord.com/api/v10/oauth2/@me";
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });
  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    throw new Error(
      `Error fetching user data: [${response.status}] ${response.statusText}`
    );
  }
}


/*
 * Given metadata that matches the schema, push that data to Discord on behalf
 * of the current user.
 */
async function pushMetadata(userId: string, tokens: Tokens, metadata: any) {
  const url = `https://discord.com/api/v10/users/@me/applications/${process.env.DISCORD_CLIENT_ID}/role-connection`;
  const accessToken = await getAccessToken(userId, tokens);
  const body: {
    platform_name: string,
    platform_username: string,
    metadata: any
  } = {
    platform_name: "Statistiche Bedwars",
    platform_username: "8hi",
    metadata,
  };
  const response = await fetch(url, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(
      `Error pushing discord metadata: [${response.status}] ${response.statusText}`
    );
  }
}

/*
 * Fetch the metadata currently pushed to Discord for the currently logged
 * in user, for this specific bot.
 */
async function getMetadata(userId: string, tokens: Tokens) {
  const url = `https://discord.com/api/v10/users/@me/applications/${process.env.DISCORD_CLIENT_ID}/role-connection`;
  const accessToken = await getAccessToken(userId, tokens);
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    throw new Error(`Error getting discord metadata: [${response.status}] ${response.statusText}`);
  }
}

export default { getOAuthUrl, getOAuthTokens, getAccessToken, getUserData, pushMetadata, getMetadata };
