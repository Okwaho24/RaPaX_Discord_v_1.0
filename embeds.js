// ─────────────────────────────────────────────────────────────
//  RaPaX™ Discord Bot — Embed Builders
//  All embeds use the black/gold brand palette.
//  Discord embed color is set as hex integer.
// ─────────────────────────────────────────────────────────────
import { EmbedBuilder, bold, inlineCode } from 'discord.js';

const GOLD   = 0xC9A84C;
const RED    = 0xC0392B;
const GREEN  = 0x27AE60;
const GREY   = 0x2C2C2C;

const FOOTER = { text: '⬛ RaPaX™ — Sovereign. Zero-Trust. Zero Compromise.' };
const THUMB  = { url: 'https://i.imgur.com/placeholder.png' }; // replace with your logo URL

// ── Currency symbols ──────────────────────────────────────────
export const CURRENCY_EMOJI = {
  BTC:  '₿',
  ETH:  'Ξ',
  SOL:  '◎',
  USDT: '₮',
};

export const CURRENCY_NAMES = {
  BTC:  'Bitcoin',
  ETH:  'Ethereum',
  SOL:  'Solana',
  USDT: 'Tether (USDT)',
};

// ── Status display ────────────────────────────────────────────
const STATUS_DISPLAY = {
  pending:         { label: '⏳ Awaiting Payment',    color: GOLD  },
  confirming:      { label: '🔍 Confirming On-Chain', color: GOLD  },
  confirmed:       { label: '✅ Payment Confirmed',   color: GREEN },
  fingerprinting:  { label: '🔏 Fingerprinting Asset', color: GOLD  },
  delivering:      { label: '📦 Preparing Delivery',  color: GOLD  },
  complete:        { label: '✅ Delivered',            color: GREEN },
  failed:          { label: '❌ Failed',               color: RED   },
  expired:         { label: '⌛ Expired',              color: GREY  },
};

// ── Product catalog embed ─────────────────────────────────────
export function productEmbed(product) {
  const prices = [];
  if (product.price_btc)  prices.push(`${CURRENCY_EMOJI.BTC} ${product.price_btc} BTC`);
  if (product.price_eth)  prices.push(`${CURRENCY_EMOJI.ETH} ${product.price_eth} ETH`);
  if (product.price_sol)  prices.push(`${CURRENCY_EMOJI.SOL} ${product.price_sol} SOL`);
  if (product.price_usdt) prices.push(`${CURRENCY_EMOJI.USDT} ${product.price_usdt} USDT`);

  return new EmbedBuilder()
    .setColor(GOLD)
    .setTitle(`📦 ${product.name}`)
    .setDescription(product.description || '*No description provided.*')
    .addFields(
      { name: '💰 Price', value: prices.join('\n') || '*Contact operator*', inline: true },
      { name: '📋 Version', value: inlineCode(product.version), inline: true },
      { name: '🆔 Product ID', value: inlineCode(product.product_id.slice(0, 16) + '…'), inline: false },
    )
    .setFooter(FOOTER)
    .setTimestamp();
}

// ── Payment instruction embed ─────────────────────────────────
export function paymentEmbed({ product, purchase, currency }) {
  const emoji = CURRENCY_EMOJI[currency] || '💳';
  const currName = CURRENCY_NAMES[currency] || currency;

  return new EmbedBuilder()
    .setColor(GOLD)
    .setTitle(`${emoji} Payment Instructions`)
    .setDescription(
      `Your order for **${product.name}** is ready.\n` +
      `Send the exact amount below to the payment address — then wait. ` +
      `I'll DM you your download link the moment payment confirms.`
    )
    .addFields(
      {
        name: `${emoji} Send Exactly`,
        value: `**${purchase.amount_expected} ${currency}**`,
        inline: true,
      },
      {
        name: '📋 Payment Address',
        value: inlineCode(purchase.payment_address),
        inline: false,
      },
      {
        name: '🆔 Transaction ID',
        value: inlineCode(purchase.transaction_id),
        inline: false,
      },
      {
        name: '⏰ Address Expires',
        value: `<t:${Math.floor(new Date(purchase.expires_at).getTime() / 1000)}:R>`,
        inline: true,
      },
    )
    .setFooter({ text: '⬛ RaPaX™ — Do not close this. I am watching the blockchain.' })
    .setTimestamp();
}

// ── Polling status embed ──────────────────────────────────────
export function statusEmbed(status) {
  const display = STATUS_DISPLAY[status.status] || { label: status.status, color: GREY };

  const embed = new EmbedBuilder()
    .setColor(display.color)
    .setTitle(display.label)
    .addFields(
      { name: 'Transaction', value: inlineCode(status.transaction_id.slice(0, 16) + '…'), inline: true },
      { name: 'Status',      value: bold(display.label), inline: true },
    )
    .setFooter(FOOTER)
    .setTimestamp();

  if (status.confirmations) {
    embed.addFields({ name: 'Confirmations', value: String(status.confirmations), inline: true });
  }

  if (status.download_link && (status.status === 'delivering' || status.status === 'complete')) {
    embed.addFields({
      name: '🔗 Download Link',
      value: `[Click to download your asset](${status.download_link})\nExpires: <t:${Math.floor(new Date(status.download_expires_at).getTime() / 1000)}:R>`,
    });
  }

  return embed;
}

// ── Delivery DM embed ─────────────────────────────────────────
export function deliveryEmbed({ product, status, downloadLink, expiresAt }) {
  return new EmbedBuilder()
    .setColor(GREEN)
    .setTitle('✅ Your Download Is Ready')
    .setDescription(
      `Payment confirmed. Your copy of **${product.name}** has been ` +
      `fingerprinted and is ready for download.\n\n` +
      `This link is **unique to you**. Do not share it.`
    )
    .addFields(
      { name: '📦 Product',       value: product.name, inline: true },
      { name: '📋 Version',       value: inlineCode(product.version), inline: true },
      {
        name: '🔗 Download Link',
        value: `[**Download ${product.name}**](${downloadLink})`,
        inline: false,
      },
      {
        name: '⏰ Link Expires',
        value: `<t:${Math.floor(new Date(expiresAt).getTime() / 1000)}:R>`,
        inline: true,
      },
    )
    .setFooter({ text: '⬛ RaPaX™ — Sovereign. Your asset. Your copy.' })
    .setTimestamp();
}

// ── Error embed ───────────────────────────────────────────────
export function errorEmbed(message) {
  return new EmbedBuilder()
    .setColor(RED)
    .setTitle('❌ Error')
    .setDescription(message)
    .setFooter(FOOTER)
    .setTimestamp();
}

// ── Operator stats embed ──────────────────────────────────────
export function statsEmbed({ products, transactions, deliveries }) {
  const complete  = transactions.filter(t => t.status === 'complete').length;
  const pending   = transactions.filter(t => ['pending','confirming'].includes(t.status)).length;
  const revenue   = {}; // group by currency

  transactions
    .filter(t => t.status === 'complete' && t.amount_received)
    .forEach(t => {
      revenue[t.currency] = (revenue[t.currency] || 0) + t.amount_received;
    });

  const revenueLines = Object.entries(revenue)
    .map(([c, v]) => `${CURRENCY_EMOJI[c] || c} ${v.toFixed(6)} ${c}`)
    .join('\n') || '*No completed sales yet*';

  return new EmbedBuilder()
    .setColor(GOLD)
    .setTitle('📊 RaPaX™ Operator Stats')
    .addFields(
      { name: '📦 Products',      value: String(products.length),  inline: true },
      { name: '🔁 Transactions',  value: String(transactions.length), inline: true },
      { name: '✅ Complete',      value: String(complete),          inline: true },
      { name: '⏳ Pending',       value: String(pending),           inline: true },
      { name: '📬 Deliveries',    value: String(deliveries.length), inline: true },
      { name: '💰 Revenue',       value: revenueLines,              inline: false },
    )
    .setFooter(FOOTER)
    .setTimestamp();
}
