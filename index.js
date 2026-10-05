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
        GatewayIntentBits.GuildVoiceStates // Needed for music
    ]
});

// Create the player instance


// This event sends a message when a new song starts playing
player.events.on('playerStart', (queue, track) => {
    queue.metadata.channel.send(`🎶 Now playing: **${track.title}**`);
});

const PREFIX = '!';

client.on('ready', async () => {
    console.log(`${client.user.tag} is online and ready!`);
    
    // This securely loads YouTube, Spotify, and SoundCloud extractors
    await player.extractors.loadDefault();
    console.log('Music extractors loaded successfully!');
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
        
        // Your Giphy API key
        const GIPHY_API_KEY = '8hpqCAh19IOYo4NbHfTJ14joC6D5pq3A';
        
        try {
            // Giphy's search endpoint requires the API key and query
            const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${searchTerm}&limit=1`;
            const response = await axios.get(url);
            
            // Giphy stores the results in an array inside response.data.data
            if (response.data.data.length > 0) {
                // Sends the URL of the first GIF found
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
        
        // Check if user is in a voice channel
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('You need to be in a voice channel to play music!');

        const query = args.join(' ');
        
        try {
            message.react('🔍'); // Reacts with a magnifying glass while searching
            await player.play(voiceChannel, query, {
                nodeOptions: {
                    metadata: {
                        channel: message.channel // Tells the playerStart event where to send the "Now playing" message
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
        // Find the active music queue for this specific server
        const queue = player.nodes.get(message.guild);
        
        if (!queue || !queue.isPlaying()) {
            return message.reply('No music is currently playing!');
        }
        
        queue.delete(); // Stops the music, clears the queue, and leaves the channel
        message.reply('🛑 Music stopped and the bot left the channel.');
    }
});

client.login(process.env.DISCORD_TOKEN);