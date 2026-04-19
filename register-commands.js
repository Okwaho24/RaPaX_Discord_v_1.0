// ─────────────────────────────────────────────────────────────
//  RaPaX™ Discord Bot — Register Slash Commands
//  Run once: node src/register-commands.js
//  Guild registration = instant (dev)
//  No DISCORD_GUILD_ID = global registration (~1hr)
// ─────────────────────────────────────────────────────────────
import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commands } from './commands.js';

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  console.error('[RaPaX™ Bot] DISCORD_TOKEN and DISCORD_CLIENT_ID are required in .env');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

const route = DISCORD_GUILD_ID
  ? Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID)
  : Routes.applicationCommands(DISCORD_CLIENT_ID);

const scope = DISCORD_GUILD_ID ? `guild ${DISCORD_GUILD_ID}` : 'global';

try {
  console.log(`[RaPaX™ Bot] Registering ${commands.length} slash commands (${scope})...`);
  const data = await rest.put(route, { body: commands });
  console.log(`[RaPaX™ Bot] Registered ${data.length} commands ✓`);
  console.log('  Commands:', data.map(c => `/${c.name}`).join(', '));
} catch (err) {
  console.error('[RaPaX™ Bot] Registration failed:', err);
  process.exit(1);
}
