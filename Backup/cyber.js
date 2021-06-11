const { Discord, Client, MessageEmbed } = require('discord.js');
const client = global.client = new Client({fetchAllMembers: true});
const fs = require('fs');
const moment = require("moment");
const mongoose = require('mongoose');
mongoose.connect('MongoDbUrl', {useNewUrlParser: true, useUnifiedTopology: true});
const Database = require("./models/role.js");


let aylartoplam = {

  "01": "Ocak",
  "02": "Şubat",
  "03": "Mart",
  "04": "Nisan",
  "05": "Mayıs",
  "06": "Haziran",
  "07": "Temmuz",
  "08": "Ağustos",
  "09": "Eylül",
  "10": "Ekim",
  "11": "Kasım",
  "12": "Aralık"
};
let aylar = aylartoplam;

let Options = {
  "rolyedek": "yedek-log", //yedek log 
  "token": "", //bot token
  "seskanalismi": "Râte" //ses kanal ismi
}

let kurucu = {
  "botOwner": "", //owner id
  "guildID": "", //sunucu id
  "botPrefix": "!" //prefix
}

client.on("ready", async () => {
    client.user.setPresence({activity: {name: '🖤 Cyber'}, status: 'idle'});
    let botVoiceChannel = client.channels.cache.find(channel => channel.name === Options.seskanalismi);
    if (botVoiceChannel) botVoiceChannel.join().catch(err => console.error("Bot ses kanalına bağlanamadı!"));
  setInterval(() => {
    setRoleBackup();
  }, 1000*60*60*1);
});



client.on("message", async message => {
  if (message.author.bot || !message.guild || !message.content.toLowerCase().startsWith(kurucu.botPrefix)) return;
  if (message.author.id !== kurucu.botOwner && message.author.id !== message.guild.owner.id) return;
  let args = message.content.split(' ').slice(1);
  let command = message.content.split(' ')[0].slice(kurucu.botPrefix.length);
  let embed = new MessageEmbed().setColor("#6d1d76").setAuthor(message.member.displayName, message.author.avatarURL({ dynamic: true, })).setFooter(`Cyber ❤️`).setTimestamp();
  
  if (command === "eval" && message.author.id === kurucu.botOwner) {
    if (!args[0]) return message.channel.send(`Kod belirtilmedi`);
      let code = args.join(' ');
      function clean(text) {
      if (typeof text !== 'string') text = require('util').inspect(text, { depth: 0 })
      text = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203))
      return text;
    };
    try { 
      var evaled = clean(await eval(code));
      if(evaled.match(new RegExp(`${client.token}`, 'g'))) evaled.replace(client.token, "Yasaklı komut");
      message.channel.send(`${evaled.replace(client.token, "Yasaklı komut")}`, {code: "js", split: true});
    } catch(err) { message.channel.send(err, {code: "js", split: true}) };
  };

  if (command === "Cyber" || command === "yedekal") {
    setRoleBackup();
    message.channel.send(` Başarılı bir şekilde yedek alındı.`)
  };

  if (command === "kur" || command === "kurulum" || command === "setup") {
    if (!args[0] || isNaN(args[0])) return message.channel.send(embed.setDescription("Geçerli bir rol ID'si belirtmelisin!"));

    Database.findOne({guildID: kurucu.guildID, roleID: args[0]}, async (err, roleData) => {
      if (!roleData) return message.channel.send(embed.setDescription("Belirtilen rol ID'sine ait veri bulunamadı!"));
      message.react("✅");
      let yeniRol = await message.guild.roles.create({
        data: {
          name: roleData.name,
          color: roleData.color,
          hoist: roleData.hoist,
          permissions: roleData.permissions,
          position: roleData.position,
          mentionable: roleData.mentionable
        },
        reason: "Rol Silindiği İçin Tekrar Oluşturuldu!"
      });

      setTimeout(() => {
        let kanalPermVeri = roleData.channelOverwrites;
        if (kanalPermVeri) kanalPermVeri.forEach((perm, index) => {
          let kanal = message.guild.channels.cache.get(perm.id);
          if (!kanal) return;
          setTimeout(() => {
            let yeniKanalPermVeri = {};
            perm.allow.forEach(p => {
              yeniKanalPermVeri[p] = true;
            });
            perm.deny.forEach(p => {
              yeniKanalPermVeri[p] = false;
            });
            kanal.createOverwrite(yeniRol, yeniKanalPermVeri).catch(console.error);
          }, index*5000);
        });
      }, 5000);

      let roleMembers = roleData.members;
      roleMembers.forEach((member, index) => {
        let uye = message.guild.members.cache.get(member);
        if (!uye || uye.roles.cache.has(yeniRol.id)) return;
        setTimeout(() => {
          uye.roles.add(yeniRol.id).catch(console.error);
        }, index*3000);
      });

      let yedekalıomknk = client.channels.cache.find(channel => channel.name === Options.rolyedek);
      if (yedekalıomknk) { yedekalıomknk.send(
        new MessageEmbed()
        .setColor('2f3136')
        .setDescription(`\`Rol Yedeği Kuruldu\`!\n **Yedeği Kuran** : ${message.author} - (\`${message.author.id}\`)\n **Kurulan Rol** : \`${roleData.name}\` - (\`${roleData.roleID}\`)`)
   );
};
    });
  };
});

function setRoleBackup() {
  let guild = client.guilds.cache.get(kurucu.guildID);
  if (guild) {
    guild.roles.cache.filter(r => r.name !== "@everyone" && !r.managed).forEach(role => {
      let roleChannelOverwrites = [];
      guild.channels.cache.filter(c => c.permissionOverwrites.has(role.id)).forEach(c => {
        let channelPerm = c.permissionOverwrites.get(role.id);
        let pushlanacak = { id: c.id, allow: channelPerm.allow.toArray(), deny: channelPerm.deny.toArray() };
        roleChannelOverwrites.push(pushlanacak);
      });

      Database.findOne({guildID: kurucu.guildID, roleID: role.id}, async (err, savedRole) => {
        if (!savedRole) {
          let newRoleSchema = new Database({
            _id: new mongoose.Types.ObjectId(),
            guildID: kurucu.guildID,
            roleID: role.id,
            name: role.name,
            color: role.hexColor,
            hoist: role.hoist,
            position: role.position,
            permissions: role.permissions,
            mentionable: role.mentionable,
            time: Date.now(),
            members: role.members.map(m => m.id),
            channelOverwrites: roleChannelOverwrites
          });
          newRoleSchema.save();
        } else {
          savedRole.name = role.name;
          savedRole.color = role.hexColor;
          savedRole.hoist = role.hoist;
          savedRole.position = role.position;
          savedRole.permissions = role.permissions;
          savedRole.mentionable = role.mentionable;
          savedRole.time = Date.now();
          savedRole.members = role.members.map(m => m.id);
          savedRole.channelOverwrites = roleChannelOverwrites;
          savedRole.save();
        };
      });
    });

    Database.find({guildID: kurucu.guildID}).sort().exec((err, roles) => {
      roles.filter(r => !guild.roles.cache.has(r.roleID) && Date.now()-r.time > 1000*60*60*24*3).forEach(r => {
        Database.findOneAndDelete({roleID: r.roleID});
      });
    });

    let yedekalıomknk = client.channels.cache.find(channel => channel.name === Options.rolyedek);
    yedekalıomknk.send(`📘 \`Sunucunun Yedeği Başarılı Bir Şekilde Güncellendi.\` \`\`\`${moment(Date.now()).format("DD")} ${aylar[moment(Date.now()).format("MM")]} ${moment(Date.now()).format("YYYY HH:mm:ss")}\`\`\` `);
  };
};

client.login(Options.token).then(c => console.log(`${client.user.tag} olarak giriş yapıldı!`)).catch(err => console.error("Bota giriş yapılırken başarısız olundu!"));