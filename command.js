// ─────────────────────────────────────────────────────────────
//  RaPaX™ Discord Bot — Slash Command Definitions
// ─────────────────────────────────────────────────────────────
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from 'discord.js';

export const commands = [

  // /shop — browse available products
  new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Browse available digital products in the RaPaX™ store'),

  // /buy — initiate a purchase
  new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Purchase a digital product')
    .addStringOption(opt =>
      opt.setName('product_id')
        .setDescription('Product ID (get it from /shop)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('currency')
        .setDescription('Payment currency')
        .setRequired(true)
        .addChoices(
          { name: '₿ Bitcoin (BTC)',      value: 'BTC'  },
          { name: 'Ξ Ethereum (ETH)',     value: 'ETH'  },
          { name: '◎ Solana (SOL)',        value: 'SOL'  },
          { name: '₮ Tether USDT (ERC20)', value: 'USDT' },
        )
    )
    .addStringOption(opt =>
      opt.setName('wallet')
        .setDescription('Your wallet address (optional — used for fingerprinting)')
        .setRequired(false)
    ),

  // /status — check a transaction status
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check the status of a transaction')
    .addStringOption(opt =>
      opt.setName('transaction_id')
        .setDescription('Transaction ID from your /buy confirmation')
        .setRequired(true)
    ),

  // /currencies — show supported currencies
  new SlashCommandBuilder()
    .setName('currencies')
    .setDescription('Show supported payment currencies'),

  // /stats — operator-only store stats
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show store statistics (operator only)'),
].map(cmd => cmd.toJSON());
