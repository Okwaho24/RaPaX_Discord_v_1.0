// ─────────────────────────────────────────────────────────────
//  RaPaX™ Discord Bot — Main Entry Point
//  Archer Chain Analytics™ — Sovereign Digital Vending
// ─────────────────────────────────────────────────────────────
import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Events,
  ActivityType,
  InteractionType,
  ComponentType,
} from 'discord.js';

import {
  handleShop,
  handleBuy,
  handleStatus,
  handleCurrencies,
  handleStats,
  handleSelectMenu,
} from './handlers.js';

import { activePollCount } from './poller.js';
import { listProducts } from './rapaxClient.js';

// ── Validate environment ──────────────────────────────────────
const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'RAPAX_API_URL', 'RAPAX_OPERATOR_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`[RaPaX™ Bot] Missing required env var: ${key}`);
    process.exit(1);
  }
}

// ── Create client ─────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
  ],
});

// ── Ready ─────────────────────────────────────────────────────
client.once(Events.ClientReady, async (c) => {
  console.log('\n ██████╗  █████╗ ██████╗  █████╗ ██╗  ██╗');
  console.log(' ██╔══██╗██╔══██╗██╔══██╗██╔══██╗╚██╗██╔╝');
  console.log(' ██████╔╝███████║██████╔╝███████║ ╚███╔╝ ');
  console.log(' ██╔══██╗██╔══██║██╔═══╝ ██╔══██║ ██╔██╗ ');
  console.log(' ██║  ██║██║  ██║██║     ██║  ██║██╔╝ ██╗');
  console.log(' ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝');
  console.log(`\n RaPaX™ Discord Bot — Ready`);
  console.log(` Logged in as: ${c.user.tag}`);
  console.log(` RaPaX™ API:   ${process.env.RAPAX_API_URL}\n`);

  // Set bot presence
  const updatePresence = async () => {
    try {
      const products = await listProducts();
      c.user.setPresence({
        activities: [{
          name: `${products.length} product${products.length !== 1 ? 's' : ''} | /shop`,
          type: ActivityType.Watching,
        }],
        status: 'online',
      });
    } catch {
      c.user.setPresence({
        activities: [{ name: 'RaPaX™ Store | /shop', type: ActivityType.Watching }],
        status: 'online',
      });
    }
  };

  await updatePresence();
  // Refresh presence every 5 minutes
  setInterval(updatePresence, 5 * 60 * 1000);

  // Post product catalog to configured channel on startup (if set)
  if (process.env.PRODUCT_CHANNEL_ID) {
    try {
      const channel = await c.channels.fetch(process.env.PRODUCT_CHANNEL_ID);
      if (channel) {
        const products = await listProducts();
        if (products.length) {
          console.log(`[RaPaX™ Bot] Posting ${products.length} products to #${channel.name}`);
          // Handled by /shop when operator runs it in that channel
        }
      }
    } catch (err) {
      console.warn('[RaPaX™ Bot] Could not access PRODUCT_CHANNEL_ID:', err.message);
    }
  }
});

// ── Interaction handler ───────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      switch (interaction.commandName) {
        case 'shop':       return await handleShop(interaction);
        case 'buy':        return await handleBuy(interaction);
        case 'status':     return await handleStatus(interaction);
        case 'currencies': return await handleCurrencies(interaction);
        case 'stats':      return await handleStats(interaction);
        default:
          return interaction.reply({ content: 'Unknown command.', ephemeral: true });
      }
    }

    // Select menu interactions (from /shop product embeds)
    if (interaction.isStringSelectMenu()) {
      return await handleSelectMenu(interaction);
    }

  } catch (err) {
    console.error('[RaPaX™ Bot] Interaction error:', err);
    const errMsg = { content: '⚠️ An error occurred. Please try again.', ephemeral: true };
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errMsg);
      } else {
        await interaction.reply(errMsg);
      }
    } catch (_) {}
  }
});

// ── Error handling ────────────────────────────────────────────
client.on(Events.Error, (err) => {
  console.error('[RaPaX™ Bot] Client error:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('[RaPaX™ Bot] Unhandled rejection:', err);
});

process.on('SIGINT', () => {
  console.log('\n[RaPaX™ Bot] Shutting down...');
  client.destroy();
  process.exit(0);
});

// ── Login ─────────────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN);
