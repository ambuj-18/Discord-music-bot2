import { Client, GatewayIntentBits, SlashCommandBuilder } from "discord.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from "@discordjs/voice";
import play from "play-dl";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const player = createAudioPlayer();

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const playCmd = new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play music from YouTube")
    .addStringOption(opt =>
      opt.setName("query")
        .setDescription("YouTube URL or song name")
        .setRequired(true)
    );

  await client.application.commands.set([playCmd]);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "play") {
    const query = interaction.options.getString("query");
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel)
      return interaction.reply("❌ Pehle voice channel join karo");

    await interaction.deferReply();

    const stream = await play.stream(query);
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type
    });

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator
    });

    connection.subscribe(player);
    player.play(resource);

    player.once(AudioPlayerStatus.Playing, () => {
      interaction.editReply(`🎶 Now Playing: **${query}**`);
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
