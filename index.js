require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Initialize the player instance
const player = new Player(client);

// Listen to player events
player.events.on('playerStart', (queue, track) => {
    queue.metadata.channel.send(`🎶 Now playing: **${track.title}**`);
});

const PREFIX = '!';

client.on('ready', async () => {
    console.log(`${client.user.tag} is online and ready!`);
    
    // Safely load music extractors on startup using the V7 method
    try {
        await player.extractors.loadMulti(DefaultExtractors);
        console.log('Music extractors loaded successfully!');
    } catch (error) {
        console.error('Error loading extractors:', error);
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // ============================
    //         GIF COMMAND
    // ============================
    if (command === 'gif') {
        if (!args.length) return message.reply('Please provide a search term! (e.g., !gif cat)');
        
        const searchTerm = args.join(' ');
        const GIPHY_API_KEY = '8hpqCAh19IOYo4NbHfTJ14joC6D5pq3A';
        
        try {
            const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${searchTerm}&limit=1`;
            const response = await axios.get(url);
            
            if (response.data.data.length > 0) {
                message.channel.send(response.data.data[0].url); 
            } else {
                message.reply('No GIFs found for that search.');
            }
        } catch (error) {
            console.error(error.response ? error.response.data : error);
            message.reply('There was an error fetching the GIF from Giphy.');
        }
    }

    // ============================
    //         PLAY COMMAND
    // ============================
    if (command === 'play') {
        if (!args.length) return message.reply('Please provide a song name or link!');
        
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('You need to be in a voice channel to play music!');

        const query = args.join(' ');
        
        try {
            message.react('🔍');
            await player.play(voiceChannel, query, {
                nodeOptions: {
                    metadata: {
                        channel: message.channel
                    }
                }
            });
        } catch (error) {
            console.error(error);
            message.reply('Something went wrong playing that song.');
        }
    }

    // ============================
    //         STOP COMMAND
    // ============================
    if (command === 'stop') {
        const queue = player.nodes.get(message.guild);
        
        if (!queue || !queue.isPlaying()) {
            return message.reply('No music is currently playing!');
        }
        
        queue.delete();
        message.reply('🛑 Music stopped and the bot left the channel.');
    }
});

client.login(process.env.DISCORD_TOKEN);