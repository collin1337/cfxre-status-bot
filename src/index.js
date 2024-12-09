import 'dotenv/config';

import { ActionRowBuilder, ActivityType, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, Events, GatewayIntentBits } from 'discord.js';

const client = new Client({
  presence: {
    activities: [
      {
        name: 'Cfx.re Status',
        type: ActivityType.Watching
      }
    ],

    status: 'dnd'
  },

  intents: [GatewayIntentBits.Guilds]
});

async function updateStatus() {
  const { GUILD_ID, CHANNEL_ID } = process.env;

  const Status = {
    Colors: {
      none: 0x00FF00,
      minor: 0xf5d742,
      major: 0xfc7f19,
      critical: 0xfc1d19
    },

    Emojis: {
      operational: '🟢',
      degraded_performance: '🟡',
      partial_outage: '🟠',
      major_outage: '🔴'
    }
  };

  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) return console.log('[\x1b[31mX\x1b[0m] \x1b[31mupdateStatus\x1b[0m: Cannot find Guild');

  const channel = guild.channels.cache.get(CHANNEL_ID);
  if (!channel) return console.log('[\x1b[31mX\x1b[0m] \x1b[31mupdateStatus\x1b[0m: Cannot find Channel');

  try {
    const [statusResponse, componentsResponse] = await Promise.all([
      fetch('https://status.cfx.re/api/v2/status.json'),
      fetch('https://status.cfx.re/api/v2/components.json')
    ]);

    const statusData = await statusResponse.json();
    const componentsData = await componentsResponse.json();

    const embedColor = Status.Colors[statusData.status.indicator];
    const embedDescription = componentsData.components.map(component => `${Status.Emojis[component.status]}︳**${component.name}** ${component.description ? `(${component.description})` : ''}: __${component.status}__`).join('\n').replace(/"/g, '');

    const statusEmbed = new EmbedBuilder()
    .setAuthor({ name: 'Cfx.re Status', url: 'https://github.com/collin1337/cfxre-status-bot', iconURL: 'https://avatars.githubusercontent.com/u/25160833?s=128&v=4' })
    .setColor(embedColor)
    .setTitle('Cfx.re Systemstatus')
    .setDescription(`### [${statusData.status.description}](https://status.cfx.re)\n${embedDescription}}\n\n**🕒 - Last Updated:** <t:${Math.floor(Date.now() / 1000)}:R>`)
    .setTimestamp()
    .setFooter({ text: 'Cfx.re Status', iconURL: 'https://avatars.githubusercontent.com/u/25160833?s=128&v=4' });

    const actionRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
      .setLabel('Cfx.re Status')
      .setStyle(ButtonStyle.Link)
      .setURL('https://status.cfx.re')
    );

    const channelMessages = await channel.messages.fetch({ limit: 5 });
    const statusEmbedMessage = await channelMessages.find(message => message.embeds?.[0]?.author.name === statusEmbed.data.author.name);

    if (statusEmbedMessage ? await statusEmbedMessage.edit({ embeds: [statusEmbed], components: [actionRow] }) : await channel.send({ embeds: [statusEmbed], components: [actionRow] }));
  } catch (err) {
    console.log(`[\x1b[31mX\x1b[0m] \x1b[31mupdateStatus\x1b[0m: ${err.message}\n${err.stack}`);
  }
};

client.login(process.env.CLIENT_TOKEN);

client.once(Events.ClientReady, async () => {
  console.clear();
  console.log(`[\x1b[32m✓\x1b[0m] \x1b[32mupdateStatus\x1b[0m: Application \x1b[32mSuccessfully Logged\x1b[0m in as \x1b[33m${client.user.username}\x1b[0m`);

  await updateStatus();

  setInterval(async () => {
    await updateStatus();
  }, 15 * 60 * 1000);
});
