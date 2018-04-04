const WebSocket = require('ws');
const event_list = require('./Events');
const Message = require('./Classes/Message');
const Guild = require('./Classes/Guild');
const Collection = require('./Classes/Collection');
const GuildChannel = require('./Classes/GuildChannel');
const TextChannel = require('./Classes/TextChannel');
const VoiceChannel = require('./Classes/VoiceChannel');

module.exports = function(TOKEN) {
  const _this = this;

  function _(t, s) {
    if (_this._events[event_list[t]] != undefined) {
      _this._events[event_list[t]](s);
    }
  }

  _this.token || (_this.token = TOKEN);

  const wss = new WebSocket('wss://gateway.discord.gg/?v=6&encoding=json');

  wss.on('message', m => {
    const message = JSON.parse(m);

    if (message.op == 10) {
      _this.heartbeat_int = message.d.heartbeat_interval;


      setInterval(function beginHeartbeat() {
        wss.send(JSON.stringify({
          op: 1,
          d: null
        }));
      }, _this.heartbeat_int);

      wss.send(JSON.stringify({
        op: 2,
        d: {
          token: _this.token,
          properties: {
            '$os': 'windows',
            '$browser': 'dungeon.js',
            '$device': 'dungeon.js'
          },
          compress: false,
          large_threshold: 250,
          shard: [0, 1],
          presence: {}
        }
      }));
    }
    if (message.op == 1) {
      wss.send(JSON.stringify({
        op: 1,
        d: null
      }));
    }
    if (message.op == 0) {
      const t = message.t;

      if (t == 'READY') {
        _this.amOfGuilds = message.d.guilds.length;
        _this.guilds = new Collection();
        _this.channels = new Collection();
        _this.messages = new Collection();
        _this.presences = new Collection();
        _this.message_methods = require('./Methods/Messages');
        _this.guild_methods = require('./Methods/Guilds');
        _this.permission_methods = require('./Methods/Permissions');
        _this.role_methods = require('./Methods/Roles');
        _this.emoji_methods = require('./Methods/Emojis');
        _this.cat_methods = require('./Methods/Category');
        _this.gu_methods = require('./Methods/Members');
        _this.invite_methods = require('./Methods/Invites');
        _this.user_methods = require('./Methods/Users');
        _this.user = _this.gu_methods().fromRaw(message.d.user);
        _this.ban_methods = require('./Methods/Bans');
        _this.token = _this.token;
      }

      if (t == 'GUILD_CREATE') {
        let chn;
        const guildData = _this.guild_methods().fromRaw(message.d);
        const guild = new Guild(guildData, _this);
        _this.guilds.set(guild.id, guild);

        for (let i = 0; i < Array.from(guild.channels.keys()).length; i++) {
          const item = guild.channels.get(Array.from(guild.channels.keys())[i]);
          if (item.type === 0) chn = new TextChannel(item, guild, _this);
          if (item.type === 2) chn = new VoiceChannel(item, guild, _this);
          if (chn) _this.channels.set(chn.id, chn);
        }

        if (Array.from(_this.guilds.keys()).length == _this.amOfGuilds) {
          _('READY', '');
        }
        if (Array.from(_this.guilds.keys()).length > _this.amOfGuilds) {
          _(t, guild);
        }
      }

      if (t == 'CHANNEL_CREATE') {
        let chn;
        if (message.d.type === 0) chn = new TextChannel(message.d, _this);
        if (message.d.type === 2) chn = new VoiceChannel(message.d, _this);
        _this.channels.set(chn.id, chn);
        _(t, chn);
      }

      if (t == 'CHANNEL_DELETE') {
        let chn;
        if (message.d.type === 0) chn = new TextChannel(message.d, _this);
        if (message.d.type === 2) chn = new VoiceChannel(message.d, _this);
        _this.channels.delete(chn.id);
        _(t, chn);
      }

      if (t == 'MESSAGE_CREATE') {
        const mesData = _this.message_methods().fromRaw(message.d);
        const msg = new Message(mesData, _this);
        _this.messages.set(msg.id, msg);
        _(t, msg);
      }
    }
  });
};
