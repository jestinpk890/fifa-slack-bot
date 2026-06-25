# FIFA 2026 Slack Bot - Setup Guide

## Overview
This bot adds an interactive button to your Slack channel. Click it to see:
- ⚽ Next 10 scheduled matches (date, time, venue)
- 📊 Group standings with points and games played
- 🏆 Real-time tournament data

---

## Prerequisites
- **Node.js** v14+ installed
- **Slack Workspace** (admin access)
- **RapidAPI Account** (free tier available)

---

## Step 1: Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"** → **"From scratch"**
3. Name it: `FIFA World Cup 2026`
4. Select your workspace

---

## Step 2: Configure OAuth Scopes

1. Go to **OAuth & Permissions** (left menu)
2. Scroll to **Scopes** → **Bot Token Scopes**
3. Add these permissions:
   ```
   chat:write
   commands
   views:open
   views:update
   ```
4. At the top, click **Install to Workspace**
5. Copy your **Bot User OAuth Token** (starts with `xoxb-`)

---

## Step 3: Get Signing Secret

1. Go to **Basic Information** (left menu)
2. Scroll to **App Credentials**
3. Copy your **Signing Secret**

---

## Step 4: Create Slash Command

1. Go to **Slash Commands** (left menu)
2. Click **Create New Command**
3. Fill in:
   - **Command:** `/fifa-setup`
   - **Request URL:** `https://your-domain.com/slack/events` (or ngrok URL during dev)
   - **Short Description:** Setup FIFA World Cup updates
   - Click **Save**

---

## Step 5: Enable Events

1. Go to **Event Subscriptions** (left menu)
2. Toggle **Enable Events** ON
3. Set **Request URL:** `https://your-domain.com/slack/events` (same as above)
4. Under **Subscribe to bot events**, add:
   - `app_mention`
   - `message.channels`
5. Click **Save Changes**

---

## Step 6: Get RapidAPI Key

1. Go to [rapidapi.com](https://rapidapi.com)
2. Sign up (free tier works)
3. Search for **"api-football"** (by API-Sports)
4. Subscribe to the free plan
5. Copy your **API Key** from the dashboard

---

## Step 7: Deploy & Run

### Local Development (Testing)

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your tokens
nano .env
# Add:
# SLACK_BOT_TOKEN=xoxb-...
# SLACK_SIGNING_SECRET=your-signing-secret
# RAPIDAPI_KEY=your-api-key

# For local testing, use ngrok
npm install -g ngrok
ngrok http 3000

# In another terminal, update your Slack app request URL with ngrok URL
# Then start the bot:
npm start
```

### Production Deployment

**Option A: Heroku**
```bash
heroku create your-fifa-bot
heroku config:set SLACK_BOT_TOKEN=xoxb-...
heroku config:set SLACK_SIGNING_SECRET=...
heroku config:set RAPIDAPI_KEY=...
git push heroku main
```

**Option B: AWS Lambda + API Gateway**
- Wrap the bot with `serverless-slack-bolt` adapter
- Deploy to Lambda

**Option C: Your own server**
- SSH into server
- Clone repo, `npm install`
- Set env vars
- Run with PM2 or systemd

---

## Step 8: Test in Slack

1. Go to your Slack channel
2. Type: `/fifa-setup`
3. A button will appear
4. Click **📊 View Schedule & Standings**
5. Modal opens with FIFA data!

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Url verification failed" | Make sure request URL matches both Slash Command & Event Subscriptions |
| "Invalid token" | Check SLACK_BOT_TOKEN format (should start with `xoxb-`) |
| "API key invalid" | Verify RAPIDAPI_KEY from your RapidAPI dashboard |
| "No data returned" | FIFA 2026 data may not be live yet; check API-Sports documentation |

---

## What the Bot Does

**User Flow:**
```
User types /fifa-setup
    ↓
Bot posts message with button
    ↓
User clicks button
    ↓
Modal opens (fetches live data)
    ↓
Shows next matches + standings
```

**Data Refreshed:** Every time button is clicked (always latest)

---

## Customization

### Change button text
Edit `fifa-slack-bot.js` line ~120:
```javascript
text: {
  type: 'plain_text',
  text: '🏆 Get World Cup Info' // Change here
}
```

### Add more stats
In `formatFixtures()` or `formatStandings()`, add more fields:
```javascript
fixturesText += `⚠️ Status: ${match.fixture.status.short}\n`;
```

### Scheduled Posts
Add a cron job to post standings daily:
```javascript
const cron = require('node-cron');
cron.schedule('0 9 * * *', async () => {
  // Post to channel at 9 AM
});
```

---

## Support

Check logs:
```bash
npm start | grep -i error
```

Need help? Check [Slack Bolt docs](https://slack.dev/bolt-js/) or [API-Sports FIFA docs](https://www.api-football.com/)
