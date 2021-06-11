const { Discord, Client, MessageEmbed, Webhook } = require('discord.js');
const client = global.client = new Client({fetchAllMembers: true});
const wh = require('./whitelist.json');
const güvenlik = require('./güvenlik.json');
const fs = require('fs');

let Options = {
  "KanalK": "kanal-log", //kanal log ismi
  "webhookkoruma": "kanal-log", //webhook log ismi
  "token": "", //bot token
  "seskanalismi": "Râte" //ses kanal ismi
}

let kurucu = {
  "botOwner": "", //owner id
  "guildID": "", //sunucu id
  "botPrefix": "!" //prefix
}

process.on('uncaughtException', function(err) { 
  console.log(err) 
});

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
  let guvenliler = wh.whitelist1 || [];
  if (!uye || uye.id === client.user.id || uye.id === kurucu.botOwner || uye.id === uye.guild.owner.id || guvenliler.some(g => uye.id === g.slice(1) || uye.roles.cache.has(g.slice(1)))) return true
  else return false;
};

const yetkiPermleri = ["ADMINISTRATOR", "MANAGE_ROLES", "MANAGE_CHANNELS", "MANAGE_GUILD", "BAN_MEMBERS", "KICK_MEMBERS", "MANAGE_NICKNAMES", "MANAGE_EMOJIS", "MANAGE_WEBHOOKS"];
function cezalandir(kisiID, tur) {
  let uye = client.guilds.cache.get(kurucu.guildID).members.cache.get(kisiID);
  if (!uye) return;
  if (tur == "ban") return uye.ban({days: 7, reason: "Kanal Guard" }).catch();
};

client.on("channelCreate", async channel => {
  let entry = await channel.guild.fetchAuditLogs({type: 'CHANNEL_CREATE'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !güvenlik.channelGuard) return;
  channel.delete({reason: " Kanal Guard"});
  cezalandir(entry.executor.id, "ban");
  let kanallaraelleme = client.channels.cache.find(channel => channel.name === Options.KanalK);
  if (kanallaraelleme) { kanallaraelleme.send(
    new MessageEmbed()
    .setColor("2f3136")
    .setDescription(`📗 \`Sunucuda Bir Kanal Açıldı\`! ${entry.executor} - (\`${entry.executor.id}\`) tarafından kanal oluşturuldu!`)
  );
  ytKapat("798999362176155718"); /// Sunucu İD
};
});

client.on("webhookUpdate", async channel => {
  let entry = await channel.guild.fetchAuditLogs({type: 'WEBHOOK_CREATE'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !güvenlik.WebHookGuard) return;
  cezalandir(entry.executor.id, "ban");
  let webhookgoruma = client.channels.cache.find(channel => channel.name === Options.webhookkoruma);
  if (webhookgoruma) {webhookgoruma.send(
    new MessageEmbed()
    .setColor("2f3136")
    .setDescription(`Bir Kullanıcı Webhook Oluşturdu! Oluşturan kullanıcı: ${entry.executor} - (\`${entry.executor.id}\`) oluşturan kişiyi yasakladım!`)
 );
 ytKapat("798999362176155718"); /// Sunucu İD
}
});


client.on("channelUpdate", async (oldChannel, newChannel) => {
  let entry = await newChannel.guild.fetchAuditLogs({type: 'CHANNEL_UPDATE'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || !newChannel.guild.channels.cache.has(newChannel.id) || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !koruma.koruma) return;
  cezalandir(entry.executor.id, "ban");
  if (newChannel.type !== "category" && newChannel.parentID !== oldChannel.parentID) newChannel.setParent(oldChannel.parentID);
  if (newChannel.type === "category") {
    newChannel.edit({
      name: oldChannel.name,
    });
  } else if (newChannel.type === "text") {
    newChannel.edit({
      name: oldChannel.name,
      topic: oldChannel.topic,
      nsfw: oldChannel.nsfw,
      rateLimitPerUser: oldChannel.rateLimitPerUser
    });
  } else if (newChannel.type === "voice") {
    newChannel.edit({
      name: oldChannel.name,
      bitrate: oldChannel.bitrate,
      userLimit: oldChannel.userLimit,
    });
  };
  oldChannel.permissionOverwrites.forEach(perm => {
    let thisPermOverwrites = {};
    perm.allow.toArray().forEach(p => {
      thisPermOverwrites[p] = true;
    });
    perm.deny.toArray().forEach(p => {
      thisPermOverwrites[p] = false;
    });
    newChannel.createOverwrite(perm.id, thisPermOverwrites);
  });
  let kanallaraelleme = client.channels.cache.find(channel => channel.name === Options.KanalK);
  if (kanallaraelleme) { kanallaraelleme.send(
    new MessageEmbed()
    .setColor("2f3136")
    .setDescription(`📒 \`Sunucudaki Bir Kanal/Katagori Güncellendi\`! ${entry.executor} - (\`${entry.executor.id}\`) tarafından **${oldChannel.name}** kanalı güncellendi!`)
  );
};
  ytKapat("798999362176155718"); /// Sunucu İD
});

client.on("channelDelete", async channel => {
  let entry = await channel.guild.fetchAuditLogs({type: 'CHANNEL_DELETE'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !güvenlik.channelGuard) return;
  cezalandir(entry.executor.id, "ban");
  await channel.clone({ reason: " Kanal Guard" }).then(async kanal => {
    if (channel.parentID != null) await kanal.setParent(channel.parentID);
    await kanal.setPosition(channel.position);
    if (channel.type == "category") await channel.guild.channels.cache.filter(k => k.parentID == channel.id).forEach(x => x.setParent(kanal.id));
  });
  let kanallaraelleme = client.channels.cache.find(channel => channel.name === Options.KanalK);
  if (kanallaraelleme) { kanallaraelleme.send(
    new MessageEmbed()
    .setColor("2f3136")
    .setDescription(`📕 \`Sunucuda Kanal Silindi\`! ${entry.executor} - (\`${entry.executor.id}\`) tarafından **${channel.name}** kanalı silindi!`)
  ); 
  ytKapat("798999362176155718"); /// Sunucu İD
};
});


function ytKapat(guildID) {
  let sunucu = client.guilds.cache.get(guildID);
  if (!sunucu) return;
  sunucu.roles.cache.filter(r => r.editable && (r.permissions.has("ADMINISTRATOR") || r.permissions.has("MANAGE_GUILD") || r.permissions.has("MANAGE_ROLES") || r.permissions.has("MANAGE_WEBHOOKS"))).forEach(async r => {
    await r.setPermissions(0); // Rollerin Yt Sıfırlıyor
  });

  let logKanali = client.channels.cache.find(channel => channel.name === Options.KanalK)
  if (logKanali) { logKanali.send(
    new MessageEmbed()
    .setColor("2f3136")
    .setDescription(`Rol Yetkilerini Kapattım!`)
    )
};
};



client.login(Options.token).then(c => console.log(`${client.user.tag} olarak giriş yapıldı!`)).catch(err => console.error("Bota giriş yapılırken başarısız olundu!"));