
const request = require('../Connection');
const Snowflake = require('../util/Snowflake');
const DMChannel = require('./DMChannel');

/**
 * This class represents a User Object
 */

class User {
  constructor(raw, client) {

    /**
     * The client object 
     * @type {Client}
     */

    this.client = client;

    /**
     * The ID of the user
     * @type {String}
     */

    this.id = raw.id;


    /**
     * The username of the user
     * @type {String}
     */

    this.username = raw.username;

    /**
     * The four lettered discriminator of the user
     * @type {String}
     */

    this.discriminator = raw.discriminator;

    /**
     * The username+discriminator eg. Youssef#0001
     * @type {String}
     */

    this.tag =`${this.username}#${this.discriminator}`;

    /**
     * The avatar hash of the user
     * @type {String}
     */

    this.avatar = raw.avatar;

    /**
     * The avatarURL of a a user, defaulted at png
     * @type {String}
     */

    this.avatarURL = `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}.png`;

    /**
     * The presence of the user
     * @type {Presence}
     */

    this.presence = this.client.presences.get(this.id) ||	null;

    /**
     * Whether the use is a bot or not
     * @type {Boolean}
     */

    this.bot = raw.bot ||	false;

    /**
     * The timestamp the user was created at
     * @type {Date}
     */
      
    this.createdTimestamp = Snowflake.deconstruct(this.id).timestamp;

    /**
     * The date the user was created at
     * @type {Date}
     */

    this.createdAt = new Date(this.createdTimestamp);
  }

  /**
   * @description Returns the avatar's url of a user
   * @param {Object} [options = {}] The options, format eg. "png" and size, eg. 256
   * @returns {String} The user's avatar as a URL
   */

  avatarURL(options) {
    if (options) {
      return `https://cdn.discordapp.com/avatars/${raw.id}/${raw.avatar}.${options.format || 'png'}${options.size ? `?size=${options.size}` : ''}`;
    } else {
      return `https://cdn.discordapp.com/avatars/${raw.id}/${raw.avatar}.png`;
    }
  }

  /**
   * @description This method will send a message to the channel specified
   * @param {String|Object} content The string if it's a normal message or object if it's a richembed
   * @param {Object} [opt = {}] The options, nonce and tts
   * @returns {Promise<Message>} Returns a promise and discord message
   * @example
   * // Sending an embed
   * User.send({title: "Ping!", description: "This User Was Pinged!", color: 0x00AE86});
   * @example
   * // Sending a tts message
   * User.send("Hi!", {tts: true});
   */

  send(content, opt = {}) {
    if (!content) throw new this.client.MissingParameter('You are missing the parameter \'content\'!');
    let embed;
    if (typeof content === 'object') {
      embed = {
        title: (content && content.title) || null,
        description: (content && content.description) || null,
        url: (content && content.url) || null,
        timestamp: (content && content.timestamp) || null,
        color: (content && content.color) || null,
        footer: (content && content.footer) || null,
        author: (content && content.author) || null,
        fields: (content && content.fields) || null
      };
    }
    return new Promise((res) => {
      if (embed) {
        request.req('POST', '/users/@me/channels', {
          recipient_id: this.id
        }, this.client.token).then(c => {
          request.req('POST', `/channels/${c.id}/messages`, {
            embed: embed
          }, this.client.token)
            .then(m => {
              const Message = require('./Message');
              setTimeout(res, 100, res(new Message(m, this.client)));
            }).catch(error => {
              if (error.status === 403) throw new this.client.MissingPermissions('I don\'t have permissions to perform this action!');
            });  
        });
      } else {
        request.req('POST', '/users/@me/channels', {
          recipient_id: this.id
        }, this.client.token).then(c => {
          request.req('POST', `/channels/${c.id}/messages`, {
            nonce: (opt && opt.nonce) || false,
            tts: (opt && opt.tts) || false,
            content: content || null
          }, this.client.token)
            .then(m => {
              const Message = require('./Message');
              setTimeout(res, 100, res(new Message(m, this.client)));          
            }).catch(error => {
              if (error.status === 403) throw new this.client.MissingPermissions('I don\'t have permissions to perform this action!');
            }); 
        });
      }     
    });
  }

  /**
   * @description This method will mention a user
   * @returns {String} The mention as a string: <@id>
   */

  toString() {
    return `<@${this.id}>`;
  }

  /**
   * @description This method will create a dm with a user
   * @returns {Promise<DMChannel>} The channel created
   */

  createDM() {
    return new Promise((res, rej) => {
      request.req('POST', '/users/@me/channels', {
        recipient_id: this.id
      }, this.client.token).then(c => {
        const channel = new DMChannel(c, this.client);
        this.client.channels.set(channel.id, channel);
        setTimeout(res, 100, channel);
      });
    });
  }

}

module.exports = User;

/**
 * @typedef {Object} UserResolvable
 * @property {String} Snowflake This could be the ID of the user
 * @property {User} User This could be an actual user class
 */