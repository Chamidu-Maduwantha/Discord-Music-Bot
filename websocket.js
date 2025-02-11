const WebSocket = require('ws');
const { EventEmitter } = require('events');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { networkInterfaces } = require('os');

class WebSocketServer extends EventEmitter {
  constructor() {
    super();
    this.wss = null;
    this.client = null;
  }

  // Helper function to get server IP
  getServerIp() {
    const nets = networkInterfaces();
    const results = [];

    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // Skip internal and non-IPv4 addresses
        if (net.family === 'IPv4' && !net.internal) {
          results.push(net.address);
        }
      }
    }
    return results[0]; // Return the first non-internal IPv4 address
  }

  initialize(port = 8080, discordClient) {
    this.client = discordClient;

    // You can set this as an environment variable or hardcode it
    const PUBLIC_IP = '54.241.82.154';
    const PUBLIC_DNS = 'ec2-54-241-82-154.us-west-1.compute.amazonaws.com';

    try {
      // Log the current directory and certificate paths
      console.log('Current directory:', process.cwd());
      const certPath = '/home/ec2-user/certs/cert.pem';
      const keyPath = '/home/ec2-user/certs/key.pem';
      
      console.log('Looking for certificates at:');
      console.log('Cert path:', certPath);
      console.log('Key path:', keyPath);

      // Check if certificate files exist
      if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
        throw new Error(`Certificate files not found. Please ensure they exist at:\nCert: ${certPath}\nKey: ${keyPath}`);
      }

      // Create HTTPS server with certificates
      const server = https.createServer({
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
        // Allow self-signed certificates
        rejectUnauthorized: false
      });

      // Create WebSocket server
      this.wss = new WebSocket.Server({ 
        server,
        // Add error handling for connection failures
        clientTracking: true
      });
      
      // Start the server - bind to all interfaces
      server.listen(port, '0.0.0.0', () => {
        console.log(`Secure WebSocket server started on port ${port}`);
        console.log(`Public IP WebSocket URL: wss://${PUBLIC_IP}:${port}`);
        console.log(`Public DNS WebSocket URL: wss://${PUBLIC_DNS}:${port}`);
      });

      // Add server error handling
      server.on('error', (error) => {
        console.error('HTTPS Server error:', error);
      });

      this.wss.on('connection', (ws, req) => {
        const clientIp = req.socket.remoteAddress;
        console.log(`New client connected from: ${clientIp}`);
        console.log('Connection headers:', req.headers);
        
        this.sendInitialData(ws);

        ws.on('message', async (message) => {
          try {
            const data = JSON.parse(message);
            console.log('Received message:', data);
            
            if (data.type === 'adminCommand') {
              const result = await this.handleAdminCommand(data.command, data.data);
              ws.send(JSON.stringify({
                type: 'adminCommandResponse',
                data: result
              }));
            }
          } catch (error) {
            console.error('Error handling WebSocket message:', error);
          }
        });

        ws.on('error', (error) => {
          console.error('WebSocket client error:', error);
        });
        
        ws.on('close', (code, reason) => {
          console.log('Client disconnected. Code:', code, 'Reason:', reason);
        });
      });

      // Add error handling for the WebSocket server
      this.wss.on('error', (error) => {
        console.error('WebSocket Server error:', error);
      });

    } catch (error) {
      console.error('Error setting up secure WebSocket server:', error);
      console.error('Stack trace:', error.stack);
      
      console.log('Attempting to start non-secure WebSocket server...');
      
      // Fallback to non-secure WebSocket server - bind to all interfaces
      this.wss = new WebSocket.Server({ 
        port,
        host: '0.0.0.0'
      });
      
      console.log(`Non-secure WebSocket server started on port ${port}`);
      console.log(`Public IP WebSocket URL: ws://${PUBLIC_IP}:${port}`);
      console.log(`Public DNS WebSocket URL: ws://${PUBLIC_DNS}:${port}`);

      this.wss.on('connection', (ws, req) => {
        const clientIp = req.socket.remoteAddress;
        console.log(`New client connected from: ${clientIp}`);
        console.log('Connection headers:', req.headers);
        
        this.sendInitialData(ws);

        ws.on('message', async (message) => {
          try {
            const data = JSON.parse(message);
            console.log('Received message:', data);
            
            if (data.type === 'adminCommand') {
              const result = await this.handleAdminCommand(data.command, data.data);
              ws.send(JSON.stringify({
                type: 'adminCommandResponse',
                data: result
              }));
            }
          } catch (error) {
            console.error('Error handling WebSocket message:', error);
          }
        });

        ws.on('error', (error) => {
          console.error('WebSocket client error:', error);
        });
      });
    }
  }

  sendInitialData(ws) {
    if (!this.client || ws.readyState !== WebSocket.OPEN) return;

    // Send stats
    ws.send(JSON.stringify({
      type: 'stats',
      data: {
        servers: this.client.guilds.cache.size,
        activePlayers: this.client.manager.players.size,
        totalListeners: this.getTotalListeners(),
        songsPlayed: 0
      }
    }));

    // Send server and player data
    this.broadcastServers();
    this.broadcastPlayers();
  }

  broadcastPlayers() {
    if (!this.wss || !this.client) return;

    try {
      const playerData = Array.from(this.client.manager.players.values()).map(player => {
        const guild = this.client.guilds.cache.get(player.guild);
        const serverName = guild ? guild.name : 'Unknown Server';
        
        return {
          id: player.guild,
          serverName: serverName,
          track: player.queue.current ? {
            title: player.queue.current.title,
            duration: player.queue.current.duration,
            position: player.position,
            thumbnail: player.queue.current.thumbnail,
            uri: player.queue.current.uri,
            author: player.queue.current.author
          } : null,
          playing: player.playing,
          paused: player.paused,
          volume: player.volume,
          queueLength: player.queue.length,
          listeners: (() => {
            if (!guild || !player.voiceChannel) return 0;
            const voiceChannel = guild.channels.cache.get(player.voiceChannel);
            return voiceChannel ? voiceChannel.members.filter(m => !m.user.bot).size : 0;
          })()
        };
      });

      this.broadcast({ type: 'players', data: playerData });
    } catch (error) {
      console.error('Error broadcasting players:', error);
    }
  }

  getTotalListeners() {
    let total = 0;
    this.client.manager.players.forEach(player => {
      if (player.voiceChannel) {
        const channel = this.client.channels.cache.get(player.voiceChannel);
        if (channel) {
          total += channel.members.filter(member => !member.user.bot).size;
        }
      }
    });
    return total;
  }

  broadcastStats() {
    if (!this.wss || !this.client) return;
    
    const data = {
      type: 'stats',
      data: {
        servers: this.client.guilds.cache.size,
        activePlayers: this.client.manager.players.size,
        totalListeners: this.getTotalListeners(),
        songsPlayed: 0
      }
    };

    this.broadcast(data);
  }

  async broadcastServers() {
    if (!this.wss || !this.client) return;

    try {
      const guilds = Array.from(this.client.guilds.cache.values());
      await Promise.all(guilds.map(async (guild) => {
        if (!guild.members.cache.has(guild.ownerId)) {
          try {
            await guild.members.fetch(guild.ownerId);
          } catch (error) {
            console.error(`Failed to fetch owner for guild ${guild.name}:`, error);
          }
        }
      }));

      const serverData = guilds.map(guild => {
        const owner = guild.members.cache.get(guild.ownerId);
        return {
          id: guild.id,
          name: guild.name,
          memberCount: guild.memberCount,
          icon: guild.iconURL({ dynamic: true }),
          owner: {
            id: guild.ownerId,
            tag: owner?.user.tag || 'Unknown',
            avatar: owner?.user.displayAvatarURL({ dynamic: true }) || null
          },
          joinedAt: guild.joinedTimestamp,
          region: guild.preferredLocale,
          isPlaying: this.client.manager.players.has(guild.id),
          listeners: (() => {
            const player = this.client.manager.players.get(guild.id);
            if (!player || !player.voiceChannel) return 0;
            const voiceChannel = guild.channels.cache.get(player.voiceChannel);
            return voiceChannel ? voiceChannel.members.filter(m => !m.user.bot).size : 0;
          })()
        };
      });

      this.broadcast({ type: 'servers', data: serverData });
    } catch (error) {
      console.error('Error broadcasting servers:', error);
    }
  }

  broadcastPlayerUpdate(player) {
    if (!this.wss || !this.client) return;

    try {
      const guild = this.client.guilds.cache.get(player.guild);
      const serverName = guild ? guild.name : 'Unknown Server';
      
      const playerData = {
        id: player.guild,
        serverName: serverName,
        track: player.queue.current ? {
          title: player.queue.current.title,
          duration: player.queue.current.duration,
          position: player.position,
          thumbnail: player.queue.current.thumbnail,
          uri: player.queue.current.uri,
          author: player.queue.current.author
        } : null,
        playing: player.playing,
        paused: player.paused,
        volume: player.volume,
        queueLength: player.queue.length,
        listeners: (() => {
          if (!guild || !player.voiceChannel) return 0;
          const voiceChannel = guild.channels.cache.get(player.voiceChannel);
          return voiceChannel ? voiceChannel.members.filter(m => !m.user.bot).size : 0;
        })()
      };

      this.broadcast({ type: 'playerUpdate', data: playerData });
    } catch (error) {
      console.error('Error broadcasting player update:', error);
    }
  }

  broadcast(data) {
    if (!this.wss) return;
    
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  handleAdminCommand(command, data) {
    if (!this.client) return { success: false, message: 'Bot client not available' };

    switch (command) {
      case 'toggleDevMode':
        return this.toggleDevMode(data.enabled);
      case 'restartBot':
        return this.restartBot();
      case 'restartPM2':
        return this.restartPM2();
      case 'updatePresence':
        return this.updateBotPresence(data);
      case 'broadcastMessage':
        return this.broadcastToServers(data.message);
      default:
        return { success: false, message: 'Unknown command' };
    }
  }

  toggleDevMode(enabled) {
    try {
      this.client.devMode = enabled;
      return {
        success: true,
        message: `Developer mode ${enabled ? 'enabled' : 'disabled'}`
      };
    } catch (error) {
      console.error('Error toggling dev mode:', error);
      return { success: false, message: 'Failed to toggle developer mode' };
    }
  }

  restartBot() {
    try {
      console.log('Initiating bot restart...');
      this.broadcast({
        type: 'adminAction',
        data: {
          action: 'botRestart',
          message: 'Bot is restarting...'
        }
      });
      
      setTimeout(() => {
        process.exit(1);
      }, 1000);

      return { success: true, message: 'Bot restart initiated' };
    } catch (error) {
      console.error('Error restarting bot:', error);
      return { success: false, message: 'Failed to restart bot' };
    }
  }

  restartPM2() {
    try {
      const pm2 = require('pm2');
      
      pm2.connect((err) => {
        if (err) {
          console.error('Error connecting to PM2:', err);
          return;
        }

        pm2.restart('all', (err) => {
          if (err) {
            console.error('Error restarting PM2:', err);
          }
          pm2.disconnect();
        });
      });

      return { success: true, message: 'PM2 restart initiated' };
    } catch (error) {
      console.error('Error restarting PM2:', error);
      return { success: false, message: 'Failed to restart PM2' };
    }
  }

  updateBotPresence(data) {
    try {
      const { type, name } = data;
      this.client.user.setActivity(name, { type });
      return { success: true, message: 'Bot presence updated' };
    } catch (error) {
      console.error('Error updating bot presence:', error);
      return { success: false, message: 'Failed to update bot presence' };
    }
  }

  broadcastToServers(message) {
    try {
      this.client.guilds.cache.forEach(guild => {
        const systemChannel = guild.systemChannel;
        if (systemChannel) {
          systemChannel.send(message).catch(console.error);
        }
      });
      return { success: true, message: 'Broadcast message sent' };
    } catch (error) {
      console.error('Error broadcasting message:', error);
      return { success: false, message: 'Failed to broadcast message' };
    }
  }
}

// Create and export a single instance
const wsServer = new WebSocketServer();
module.exports = wsServer;

