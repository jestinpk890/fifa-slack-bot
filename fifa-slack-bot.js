const { App } = require('@slack/bolt');
const fetch = require('node-fetch');
require('dotenv').config();

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

// Fetch FIFA 2026 data from API
async function getFIFAData() {
  try {
    // Using api-football.com (rapidapi) for FIFA 2026 data
    const leagueId = 1; // FIFA World Cup league ID
    const season = 2026;
    
    // Fetch standings
    const standingsRes = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/standings?league=${leagueId}&season=${season}`,
      {
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
        }
      }
    );
    const standingsData = await standingsRes.json();
    
    // Fetch fixtures (next matches)
    const fixturesRes = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${leagueId}&season=${season}&next=10`,
      {
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
        }
      }
    );
    const fixturesData = await fixturesRes.json();
    
    return { standings: standingsData, fixtures: fixturesData };
  } catch (error) {
    console.error('Error fetching FIFA data:', error);
    return null;
  }
}

// Format standings as Slack blocks
function formatStandings(standingsData) {
  if (!standingsData?.response || standingsData.response.length === 0) {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '📊 *Group Standings* - Data unavailable'
      }
    };
  }

  const groups = standingsData.response[0].league.standings;
  let standingsText = '📊 *FIFA 2026 Group Standings*\n\n';
  
  groups.forEach((group, idx) => {
    standingsText += `*Group ${String.fromCharCode(65 + idx)}*\n`;
    group.forEach(team => {
      standingsText += `${team.rank}. ${team.team.name} - ${team.points}pts (${team.all.played}P)\n`;
    });
    standingsText += '\n';
  });

  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: standingsText
    }
  };
}

// Format next matches as Slack blocks
function formatFixtures(fixturesData) {
  if (!fixturesData?.response || fixturesData.response.length === 0) {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '⚽ *Upcoming Matches* - No data available'
      }
    };
  }

  let fixturesText = '⚽ *Next 10 Matches*\n\n';
  
  fixturesData.response.slice(0, 10).forEach(match => {
    const date = new Date(match.fixture.date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    fixturesText += `${match.teams.home.name} vs ${match.teams.away.name}\n`;
    fixturesText += `📅 ${date}\n`;
    fixturesText += `Venue: ${match.fixture.venue.name}\n\n`;
  });

  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: fixturesText
    }
  };
}

// Post button to channel or DM
app.command('/fifa-setup', async ({ ack, respond }) => {
  ack();

  try {
    await respond({
      text: 'FIFA World Cup 2026 Updates',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '🏆 *FIFA World Cup 2026 Updates*\n\nClick the button below to see the latest schedules, standings, and tournament info.'
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📊 View Schedule & Standings'
              },
              action_id: 'fifa_info_button',
              style: 'primary'
            }
          ]
        }
      ]
    });
  } catch (error) {
    console.error('Error responding to slash command:', error);
    await respond({ text: '❌ Error: Could not load FIFA data. Try again later.' });
  }
});

// Handle button click
app.action('fifa_info_button', async ({ ack, body, client }) => {
  ack();

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'fifa_info_modal',
      title: {
        type: 'plain_text',
        text: 'FIFA 2026 Info'
      },
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '⏳ *Loading FIFA World Cup 2026 data...*'
          }
        }
      ]
    }
  });

  // Fetch and update modal with real data
  const data = await getFIFAData();
  
  if (data) {
    const blocks = [
      formatFixtures(data.fixtures),
      {
        type: 'divider'
      },
      formatStandings(data.standings),
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '🔄 Last updated: ' + new Date().toLocaleString()
          }
        ]
      }
    ];

    await client.views.update({
      view_id: body.view.id,
      view: {
        type: 'modal',
        callback_id: 'fifa_info_modal',
        title: {
          type: 'plain_text',
          text: 'FIFA 2026 Info'
        },
        blocks: blocks
      }
    });
  }
});

// Start app
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚽ FIFA Slack Bot is running...');
})();
