// ─────────────────────────────────────────────────────────────
//  RaPaX™ Discord Bot — Interaction Handlers
//  Handles: slash commands + button interactions
// ─────────────────────────────────────────────────────────────
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
} from 'discord.js';

import {
  listProducts,
  getProduct,
  initiatePurchase,
  getPurchaseStatus,
  getTransactions,
  getDeliveries,
} from './rapaxClient.js';

import {
  productEmbed,
  paymentEmbed,
  statusEmbed,
  errorEmbed,
  statsEmbed,
  CURRENCY_EMOJI,
  CURRENCY_NAMES,
} from './embeds.js';

import { startPolling } from './poller.js';

// Operator Discord user IDs — set in .env as comma-separated list
const OPERATOR_IDS = new Set(
  (process.env.OPERATOR_DISCORD_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
);

function isOperator(userId) {
  return OPERATOR_IDS.size === 0 || OPERATOR_IDS.has(userId);
}

// ── /shop ─────────────────────────────────────────────────────
export async function handleShop(interaction) {
  await interaction.deferReply();

  let products;
  try {
    products = await listProducts();
  } catch (err) {
    return interaction.editReply({ embeds: [errorEmbed('Could not reach the RaPaX™ store. Try again shortly.')] });
  }

  if (!products.length) {
    return interaction.editReply({ embeds: [errorEmbed('No products available right now.')] });
  }

  // Post one embed per product with a BUY button
  const messages = [];
  for (const product of products) {
    const currencies = ['BTC','ETH','SOL','USDT'].filter(c => product[`price_${c.toLowerCase()}`]);

    // Build currency select menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`buy_currency:${product.product_id}`)
      .setPlaceholder('Select currency to purchase')
      .addOptions(
        currencies.map(c =>
          new StringSelectMenuOptionBuilder()
            .setLabel(`${CURRENCY_EMOJI[c]} ${CURRENCY_NAMES[c]}`)
            .setValue(c)
            .setDescription(`${product[`price_${c.toLowerCase()}`]} ${c}`)
        )
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const msg = await interaction.followUp({
      embeds: [productEmbed(product)],
      components: currencies.length ? [row] : [],
    });
    messages.push(msg);
  }
}

// ── /buy ──────────────────────────────────────────────────────
export async function handleBuy(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const productId   = interaction.options.getString('product_id');
  const currency    = interaction.options.getString('currency');
  const buyerWallet = interaction.options.getString('wallet') || null;

  let product;
  try {
    product = await getProduct(productId);
  } catch {
    return interaction.editReply({ embeds: [errorEmbed('Product not found. Use `/shop` to browse available products.')] });
  }

  if (!product) {
    return interaction.editReply({ embeds: [errorEmbed('Product not found.')] });
  }

  let purchase;
  try {
    purchase = await initiatePurchase({ productId, currency, buyerWallet });
  } catch (err) {
    const msg = err.response?.data?.error || err.message;
    return interaction.editReply({ embeds: [errorEmbed(`Purchase failed: ${msg}`)] });
  }

  // Send payment instructions ephemerally to buyer
  await interaction.editReply({
    embeds: [paymentEmbed({ product, purchase, currency })],
    ephemeral: true,
  });

  // Post a visible status message in the channel that updates as payment confirms
  const statusMsg = await interaction.followUp({
    content: `⏳ ${interaction.user} is purchasing **${product.name}** — monitoring payment...`,
    embeds: [statusEmbed({ status: 'pending', transaction_id: purchase.transaction_id })],
    ephemeral: false,
  });

  // Start polling
  startPolling({
    transactionId: purchase.transaction_id,
    product,
    user:          interaction.user,
    statusMessage: statusMsg,
  });
}

// ── /status ───────────────────────────────────────────────────
export async function handleStatus(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const transactionId = interaction.options.getString('transaction_id');

  let status;
  try {
    status = await getPurchaseStatus(transactionId);
  } catch {
    return interaction.editReply({ embeds: [errorEmbed('Transaction not found.')] });
  }

  await interaction.editReply({ embeds: [statusEmbed(status)] });
}

// ── /currencies ───────────────────────────────────────────────
export async function handleCurrencies(interaction) {
  const { EmbedBuilder } = await import('discord.js');
  const embed = new EmbedBuilder()
    .setColor(0xC9A84C)
    .setTitle('💳 Supported Payment Currencies')
    .setDescription('RaPaX™ accepts the following cryptocurrencies:')
    .addFields(
      { name: '₿ Bitcoin',          value: 'BTC — On-chain',          inline: true },
      { name: 'Ξ Ethereum',          value: 'ETH — On-chain',          inline: true },
      { name: '◎ Solana',            value: 'SOL — On-chain',          inline: true },
      { name: '₮ Tether',            value: 'USDT — ERC20',            inline: true },
      { name: '💵 FIAT',             value: 'Coming soon',             inline: true },
    )
    .setFooter({ text: '⬛ RaPaX™ — Sovereign. Zero-Trust. Zero Compromise.' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ── /stats ────────────────────────────────────────────────────
export async function handleStats(interaction) {
  if (!isOperator(interaction.user.id)) {
    return interaction.reply({ embeds: [errorEmbed('This command is restricted to operators.')], ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const [products, transactions, deliveries] = await Promise.all([
      listProducts(),
      getTransactions(200),
      getDeliveries(200),
    ]);

    await interaction.editReply({ embeds: [statsEmbed({ products, transactions, deliveries })] });
  } catch (err) {
    await interaction.editReply({ embeds: [errorEmbed(`Could not fetch stats: ${err.message}`)] });
  }
}

// ── Button / Select Menu interactions ─────────────────────────
// Handles the currency select menu from /shop embeds
export async function handleSelectMenu(interaction) {
  // customId format: buy_currency:{product_id}
  if (!interaction.customId.startsWith('buy_currency:')) return;

  const productId = interaction.customId.split(':')[1];
  const currency  = interaction.values[0];

  await interaction.deferReply({ ephemeral: true });

  let product;
  try {
    product = await getProduct(productId);
  } catch {
    return interaction.editReply({ embeds: [errorEmbed('Product not found.')] });
  }

  let purchase;
  try {
    purchase = await initiatePurchase({ productId, currency, buyerWallet: null });
  } catch (err) {
    const msg = err.response?.data?.error || err.message;
    return interaction.editReply({ embeds: [errorEmbed(`Purchase failed: ${msg}`)] });
  }

  // Payment instructions — private to buyer
  await interaction.editReply({
    embeds: [paymentEmbed({ product, purchase, currency })],
  });

  // Public status message
  const statusMsg = await interaction.followUp({
    content: `⏳ ${interaction.user} is purchasing **${product.name}** — monitoring payment...`,
    embeds: [statusEmbed({ status: 'pending', transaction_id: purchase.transaction_id })],
    ephemeral: false,
  });

  startPolling({
    transactionId: purchase.transaction_id,
    product,
    user:          interaction.user,
    statusMessage: statusMsg,
  });
}
