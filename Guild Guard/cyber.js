﻿const { Discord, Client, MessageEmbed } = require('discord.js');
const client = global.client = new Client({fetchAllMembers: true});
const wh = require('./whitelist.json');
const güvenlik = require('./güvenlik.json');
const fs = require('fs');

let Options = {
  "sunuculog": "sunucu-log", //Sunucu log kanal ismi
  "token": "", //Bot tokeni
  "seskanalismi": "Râtw" //ses kanal ismi
}

let kurucu = {
  "botOwner": "", //bot owner id
  "guildID": "", //sunucu id
  "botPrefix": "!" //prefix
}

client.on("ready", async () => {
  client.user.setPresence({activity: {name: '🖤 Cyber'}, status: 'idle'}); //Bot durum, oynuyor //idle: boşta, online: çevrimiçi, dnd: rahatsız etmeyin, invisible: görünmez \\ 
  let botVoiceChannel = client.channels.cache.find(channel => channel.name === Options.seskanalismi);
  if (botVoiceChannel) botVoiceChannel.join().catch(err => console.error("Bot ses kanalına bağlanamadı!"));
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
  if(command === "güvenli") {
    let hedef;
    let rol = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]) || message.guild.roles.cache.find(r => r.name === args.join(" "));
    let uye = message.mentions.users.first() || message.guild.members.cache.get(args[0]);
    if (rol) hedef = rol;
    if (uye) hedef = uye;
    let guvenliler = wh.whitelist || [];
    if (!hedef) return message.channel.send(embed.setDescription(` Güvenli Listede Bulunan Üyeler Aşşağıda Verilmiştir.`).addField("\`\`Güvenli Liste\`\`", guvenliler.length > 0 ? guvenliler.map(g => (message.guild.roles.cache.has(g.slice(1)) || message.guild.members.cache.has(g.slice(1))) ? (message.guild.roles.cache.get(g.slice(1)) || message.guild.members.cache.get(g.slice(1))) : g).join('\n') : "**Güvenli Listede Hiçbir Kullanıcı Bulunmamkta.!**"));
    if (guvenliler.some(g => g.includes(hedef.id))) {
      guvenliler = guvenliler.filter(g => !g.includes(hedef.id));
      wh.whitelist = guvenliler;
      fs.writeFile("./whitelist.json", JSON.stringify(wh), (err) => {
        if (err) console.log(err);
      });
      message.channel.send(embed.setDescription(` ${hedef} kullanıcısı başarılı bir şekilde güvenli listeden çıkarıldı!`));
    } else {
      wh.whitelist.push(`y${hedef.id}`);
      fs.writeFile("./whitelist.json", JSON.stringify(wh), (err) => {
        if (err) console.log(err);
      });
      message.channel.send(embed.setDescription(` ${hedef} Kullanıcısı başarılı bir şekilde güvenli listeye eklendi!`));
    };
  };

    if(command === "koruma")  {
    let korumalar = Object.keys(güvenlik).filter(k => k.includes('Guard'));
    if (!args[0] || !korumalar.some(k => k.includes(args[0]))) return message.channel.send(embed.setDescription(`Sunucudaki aktif korumalar: ${korumalar.filter(k => güvenlik[k]).map(k => `\`${k}\``).join(', ')}\n\n † Sunucuda Bulunan Tüm Korumalar: ${korumalar.map(k => `\`${k}\``).join(' | ')}`));
    let koruma = korumalar.find(k => k.includes(args[0]));
    güvenlik[koruma] = !güvenlik[koruma];
    fs.writeFile("./güvenlik.json", JSON.stringify(güvenlik), (err) => {
      if (err) console.log(err);
    });
    message.channel.send(embed.setDescription(`\`\`${koruma}\`\` koruması, ${message.author} - (\`${message.author.id}\`) tarafından ${güvenlik[koruma] ? "aktif edildi ✅" : "devre dışı bırakıldı ❎"}!`));
  };
});

function guvenli(kisiID) {
  let uye = client.guilds.cache.get(kurucu.guildID).members.cache.get(kisiID);
  let guvenliler = wh.whitelist || [];
  if (!uye || uye.id === client.user.id || uye.id === kurucu.botOwner || uye.id === uye.guild.owner.id || guvenliler.some(g => uye.id === g.slice(1) || uye.roles.cache.has(g.slice(1)))) return true
  else return false;
};

function cezalandir(kisiID, tur) {
  let uye = client.guilds.cache.get(kurucu.guildID).members.cache.get(kisiID);
  if (!uye) return;
  if (tur == "ban") return uye.ban({ reason: "GUARD SİSTEMİNE YAKALANDIN!" }).catch();
};

let urlguard = {
  "Vanity_URL": "rate",
}

client.on('guildUpdate', async (oldGuild, newGuild) => {
if (oldGuild.vanityURLCode != newGuild.vanityURLCode) {
let entry = await newGuild.fetchAuditLogs({type: 'GUILD_UPDATE'}).then(audit => audit.entries.first());
if (!entry.executor || entry.executor.id === client.user.id) return;
let channel = client.channels.cache.find(channel => channel.name === Options.sunuculog)
if (channel) channel.send(`${entry.executor} adlı kişi url'yi çalmaya çalıştığı için banlandı ve url eski haline getirildi.`)
if (!channel) newGuild.owner.send(`${entry.executor} adlı kişi url'yi çalmaya çalıştığı için banlandı ve url eski haline getirildi. Kralın burada oruspu cocugu.`)
cezalandir(entry.executor.id, "ban");
ytKapat("798999362176155718");
const settings = {
url: `https://discord.com/api/v6/guilds/${newGuild.id}/vanity-url`,
body: {
  code: urlguard.Vanity_URL
},
json: true,
method: 'PATCH',
headers: {
  "Authorization": `Bot ${Options.token}`
}
};

request(settings, (err, res, body) => {
if (err) {
  return console.log(err);
}
});
}});

client.on("guildMemberAdd", async member => {
  let entry = await member.guild.fetchAuditLogs({type: 'BOT_ADD'}).then(audit => audit.entries.first());
  if (!member.user.bot || !entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !güvenlik.botGuard) return;
  cezalandir(entry.executor.id, "ban");
  cezalandir(member.id, "ban");
  let logKanali = client.channels.cache.find(channel => channel.name === Options.sunuculog)
  if (logKanali) { logKanali.send(
    new MessageEmbed()
    .setColor("2f3136")
    .setDescription(`📕 \`Sunucuya Bot Eklendi\`! ${member} - (\`${member.id}\`) botu, ${entry.executor} - (\`${entry.executor.id}\`) tarafından sunucuya eklendi!`)
    );
    ytKapat("798999362176155718");
   }
});


client.on("guildUpdate", async (oldGuild, newGuild) => {
  let entry = await newGuild.fetchAuditLogs({type: 'GUILD_UPDATE'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !güvenlik.serverGuard) return;
  cezalandir(entry.executor.id, "ban");
  if (newGuild.name !== oldGuild.name) newGuild.setName(oldGuild.name);
  if (newGuild.region !== oldGuild.region) newGuild.setRegion(oldGuild.region);
  if (newGuild.iconURL({dynamic: true, size: 2048}) !== oldGuild.iconURL({dynamic: true, size: 2048})) newGuild.setIcon(oldGuild.iconURL({dynamic: true, size: 2048}));
  let sunucuyusal = client.channels.cache.find(channel => channel.name === Options.sunuculog)
  if (sunucuyusal) { sunucuyusal.send(new MessageEmbed()
    .setColor("2f3136")
    .setDescription(`📕 \`Sunucu Güncellendi\` ${entry.executor} - (\`${entry.executor.id}\`) tarafından sunucu güncellendi!`)
    );
    ytKapat("798999362176155718"); 
  };
});

function ytKapat(guildID) {
  let sunucu = client.guilds.cache.get(guildID);
  if (!sunucu) return;
  sunucu.roles.cache.filter(r => r.editable && (r.permissions.has("ADMINISTRATOR") || r.permissions.has("MANAGE_GUILD") || r.permissions.has("MANAGE_ROLES") || r.permissions.has("MANAGE_WEBHOOKS"))).forEach(async r => {
    await r.setPermissions(0);
  });

  let logKanali = client.channels.cache.find(channel => channel.name === Options.sunuculog)
  if (logKanali) { logKanali.send(
    new MessageEmbed()
    .setColor("2f3136")
    .setDescription(`Rol Yetkilerini Kapattım!`)
    )
};
};


client.login(Options.token).then(c => console.log(`${client.user.tag} olarak giriş yapıldı!`)).catch(err => console.error("Bota giriş yapılırken başarısız olundu!"));