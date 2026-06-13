# RaPaX™ Discord Bot
## Sovereign Digital Product Vending — Discord Integration
**Archer Chain Analytics™ — Mahihkan.com**

---

## What It Does

Buyers browse, purchase, and receive digital products entirely inside Discord.

- `/shop` — Browse available products with currency select menus
- `/buy` — Purchase by product ID and currency
- `/status` — Check any transaction status
- `/currencies` — Show supported payment methods
- `/stats` — Operator-only store statistics

**Full flow inside Discord:**
1. Buyer runs `/shop` — sees product embeds with currency selectors
2. Buyer selects currency — receives private payment address via ephemeral message
3. Public status message appears in channel, updates in real time
4. Payment confirms on-chain → RaPaX™ fingerprints asset → Bot DMs buyer the download link
5. Operator log channel receives sale notification

---

## Setup

### Step 1 — Create Discord Application

1. Go to https://discord.com/developers/applications
2. Click **New Application** → name it `RaPaX™` (or your brand name)
3. Go to **Bot** → click **Add Bot**
4. Under **Token** → click **Reset Token** → copy it → save as `DISCORD_TOKEN`
5. Under **Privileged Gateway Intents** → enable **Message Content Intent**
6. Go to **OAuth2 → General** → copy **Client ID** → save as `DISCORD_CLIENT_ID`

### Step 2 — Invite Bot to Your Server

In Discord Developer Portal:
1. Go to **OAuth2 → URL Generator**
2. Scopes: `bot`, `applications.commands`
3. Bot Permissions: `Send Messages`, `Embed Links`, `Read Message History`, `Use Slash Commands`
4. Copy the generated URL → open in browser → invite to your server

### Step 3 — Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_server_id      # Right-click server → Copy Server ID
RAPAX_API_URL=http://localhost:4000/api
RAPAX_OPERATOR_SECRET=your_rapax_operator_secret
OPERATOR_DISCORD_IDS=your_discord_user_id  # Right-click your name → Copy User ID
PRODUCT_CHANNEL_ID=                   # Optional: channel for catalog
OPERATOR_LOG_CHANNEL_ID=              # Optional: channel for sale notifications
```

### Step 4 — Install & Register Commands

```bash
npm install
npm run register    # Registers slash commands with Discord
```

Registration with DISCORD_GUILD_ID = **instant**.
Without it (global) = takes up to 1 hour.

### Step 5 — Start the Bot

```bash
npm start           # production
npm run dev         # development (auto-restart)
```

---

## Requirements

- Node.js 18 LTS or higher
- RaPaX™ v1.0.0 running and accessible
- Discord bot token and application

---

## Commands Reference

| Command | Who | Description |
|---|---|---|
| `/shop` | Everyone | Browse product catalog with buy buttons |
| `/buy [product_id] [currency] [wallet?]` | Everyone | Initiate purchase |
| `/status [transaction_id]` | Everyone | Check transaction status |
| `/currencies` | Everyone | List accepted currencies |
| `/stats` | Operator only | Store stats and revenue summary |

---

## Flow Diagram

```
Buyer runs /shop
    └── Bot fetches GET /api/products
    └── Posts product embeds with currency select menus

Buyer selects currency
    └── Bot calls POST /api/purchase/initiate
    └── Returns payment address (ephemeral — only buyer sees it)
    └── Posts public status message in channel

Bot polls GET /api/purchase/status every 15 seconds
    └── Updates status message as: pending → confirming → confirmed → fingerprinting → delivering

Payment confirmed + fingerprinting complete
    └── Bot DMs buyer: download link embed
    └── Notifies operator log channel (if configured)
    └── Status message updated to: ✅ Delivered
```

---

## Buyer DMs

The bot DMs download links directly to buyers. Buyers must have **Allow direct messages from server members** enabled in Discord privacy settings.

If DMs are blocked, the bot posts a fallback notice in the channel directing the buyer to use `/status [transaction_id]`.

---

## Security Notes

- Payment instructions (address + amount) are sent as **ephemeral messages** — only the buyer sees them
- `/stats` is restricted to `OPERATOR_DISCORD_IDS`
- The bot never exposes file paths, database contents, or operator credentials
- All download links come directly from RaPaX™ — cryptographically random, time-limited tokens

---

## Operator Log Channel

Set `OPERATOR_LOG_CHANNEL_ID` to receive a notification on every completed sale:

```
✅ Sale complete — BuyerName#1234 purchased Sovereign Beat Pack | TX: 12a7b4a0…
```

---

*© Archer Chain Analytics™ — All Rights Reserved.*
*Sovereign. Zero-Trust. Zero Compromise.*

---

## Ownership & Legal

**© 2026 Neil Scott Archer / Archer Chain Analytics**
- **ISC Registration:** 102237785
- **CRA BN:** 709110639
- **Address:** 417 Avenue G S, 5th Ave N, Saskatoon SK S7M 1V5
- **Contact:** archerchainanalytics@gmail.com

All rights reserved. Exclusive property of Neil Scott Archer operating as Archer Chain Analytics. Unauthorized use prohibited. Trademark applications pending with CIPO.

---
