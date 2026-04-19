// ─────────────────────────────────────────────────────────────
//  RaPaX™ Discord Bot — Payment Poller
//  Polls RaPaX™ status endpoint until confirmed,
//  then DMs the buyer their download link.
// ─────────────────────────────────────────────────────────────
import { getPurchaseStatus } from './rapaxClient.js';
import { deliveryEmbed, errorEmbed, statusEmbed } from './embeds.js';

const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS || '15000', 10);
const POLL_TIMEOUT  = parseInt(process.env.POLL_TIMEOUT_MS  || '3600000', 10);

const TERMINAL_STATUSES = new Set(['complete', 'failed', 'expired']);
const DELIVERY_STATUSES = new Set(['delivering', 'complete']);

// Active polls: transactionId → { intervalId, timeoutId }
const activePolls = new Map();

/**
 * Start polling for a transaction.
 * @param {object} opts
 * @param {string}  opts.transactionId
 * @param {object}  opts.product        — product record
 * @param {object}  opts.user           — Discord User to DM
 * @param {Message} opts.statusMessage  — the message to update with status
 */
export function startPolling({ transactionId, product, user, statusMessage }) {
  if (activePolls.has(transactionId)) return;

  console.log(`[RaPaX™ Bot] Polling started: ${transactionId}`);

  const poll = async () => {
    let status;
    try {
      status = await getPurchaseStatus(transactionId);
    } catch (err) {
      console.error(`[RaPaX™ Bot] Poll error for ${transactionId}:`, err.message);
      return;
    }

    // Update the status message in channel
    try {
      await statusMessage.edit({ embeds: [statusEmbed(status)] });
    } catch (_) { /* message may have been deleted */ }

    // Terminal — stop polling
    if (TERMINAL_STATUSES.has(status.status)) {
      stopPolling(transactionId);

      if (DELIVERY_STATUSES.has(status.status) && status.download_link) {
        // DM the buyer
        try {
          const dmChannel = await user.createDM();
          await dmChannel.send({
            embeds: [deliveryEmbed({
              product,
              status,
              downloadLink: status.download_link,
              expiresAt:    status.download_expires_at,
            })],
          });
          console.log(`[RaPaX™ Bot] Delivery DM sent to ${user.tag} for tx: ${transactionId}`);

          // Notify operator log channel if configured
          if (process.env.OPERATOR_LOG_CHANNEL_ID && statusMessage.client) {
            try {
              const logChannel = await statusMessage.client.channels.fetch(
                process.env.OPERATOR_LOG_CHANNEL_ID
              );
              await logChannel.send({
                content: `✅ **Sale complete** — ${user.tag} purchased **${product.name}** | TX: \`${transactionId.slice(0,16)}…\``,
              });
            } catch (_) {}
          }
        } catch (dmErr) {
          console.error(`[RaPaX™ Bot] Could not DM ${user.tag}:`, dmErr.message);
          // Fallback — reply in the status message thread
          try {
            await statusMessage.reply({
              content: `${user} — I couldn't DM you. Please enable DMs from server members, then use \`/status ${transactionId}\` to retrieve your download link.`,
              ephemeral: false,
            });
          } catch (_) {}
        }
      } else if (status.status === 'failed') {
        try {
          const dmChannel = await user.createDM();
          await dmChannel.send({
            embeds: [errorEmbed(
              `Your transaction \`${transactionId.slice(0,16)}…\` failed during processing.\n` +
              `Please contact the operator with your Transaction ID.`
            )],
          });
        } catch (_) {}
      }
    }
  };

  // Start interval
  const intervalId = setInterval(poll, POLL_INTERVAL);

  // Timeout — stop polling and notify buyer
  const timeoutId = setTimeout(async () => {
    stopPolling(transactionId);
    try {
      const dmChannel = await user.createDM();
      await dmChannel.send({
        embeds: [errorEmbed(
          `Payment monitoring timed out for transaction \`${transactionId.slice(0,16)}…\`.\n\n` +
          `If you sent payment, please contact the operator with your Transaction ID and blockchain TX hash.`
        )],
      });
    } catch (_) {}
  }, POLL_TIMEOUT);

  activePolls.set(transactionId, { intervalId, timeoutId });

  // Poll immediately on start
  poll();
}

export function stopPolling(transactionId) {
  const poll = activePolls.get(transactionId);
  if (!poll) return;
  clearInterval(poll.intervalId);
  clearTimeout(poll.timeoutId);
  activePolls.delete(transactionId);
  console.log(`[RaPaX™ Bot] Polling stopped: ${transactionId}`);
}

export function activePollCount() {
  return activePolls.size;
}
