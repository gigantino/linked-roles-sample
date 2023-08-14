import "dotenv/config";
import { z } from "zod";

const envVariables = z.object({
  DISCORD_CLIENT_ID: z.string(),
  DISCORD_CLIENT_SECRET: z.string(),
  DISCORD_TOKEN: z.string(),
  DISCORD_REDIRECT_URI: z.string(),
  COOKIE_SECRET: z.string(),
});

envVariables.parse(process.env);

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envVariables> { }
  }
}
