var express = require('express');
var router = express.Router();
const Instagram = require('./instx.js');
var request = require("request");
const FileCookieStore = require('tough-cookie-filestore2');
const Telegraf = require('telegraf');
var fs = require("fs");

//Cookies File
var cookieStore = new FileCookieStore('./user/cookies.json');

//Config
// var username = "sam.roro.2",
//     password = "roro.sam1";
var config = JSON.parse(fs.readFileSync("./user/data.json"));

//Set Process False
config.Start = false;

config.info = {
  view: 0,
}

var client = new Instagram({ cookieStore });
// (async function () {
// //await client.logout();
// await client.login();
// var ss = await client.getNewStroies();
// console.log(ss);
// for (var i in ss) {
//   var res = await client.SeeStory(ss[i]);
//   console.log(i + ": " + res);
// }
// })();

var timeout = null;
function onerr(err) {
    var ctx = tel;
      ctx.reply(`Error Code: ${err}`);
      stop();
      ctx.reply("تم ايقاف العمليات");
      ctx.reply("اعادة تشغيل العمليات بعد 5 دقائق");
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {if (!config.Start) 
      start(onerr);
      ctx.reply("تمت اعادة التشغيل");
      },5 * 60 * 1000);
    }


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

async function start(onError) {
console.log("Checking Stories ...");
//Get Only New Sotries
var list = await client.getNewStories(); //Result list of users has new Story (userid and storyid)
console.log(list);
if (list.error) {
  if (onError) onError(list.error);
  
  return;
}

for (var i in list) {
  var s = await client.SeeStory(list[i]); //Mark Story seen by userid and storyid
  //console.log(s);
  if (s.error) {
    console.log("error 3");
    await sleep(60000);
    i--;
    continue;
  }
  config.info.view++;
  console.log("View: " + i);
  if (i > 0)
  await sleep(1000);
}
if (config.Start) { //process is true
  await sleep(4000);
  start(onerr);
}
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stop() {
  //Stop process
  config.Start = false;
}

//************** Telegram BOT ***************** *//
const bot = new Telegraf(config.token);
bot.start((ctx) => {
  var username = ctx.update.message.chat.username;
  if (config.username !== username) {
    ctx.reply("تم رفض الوصول");
    return;
  }
  if (! client.isLogin()) return ctx.reply("Please Login !!");
  if (!config.Start) {
    config.Start = !config.Start;
    start(onerr);
    ctx.reply("تم تفعيل الخدمة بنجاح");
  }
  else {
    ctx.reply("الخدمة مفعلة مسبقاً");
  }
  
  
});

bot.use((ctx, next) => {
  var username = ctx.update.message.chat.username;
  if (username == config.admin) {
    var text = ctx.update.message.text;
    var sp = text.split(" ");
    var cmd = sp[0];
    var v = sp[1];
    if (cmd == "/setuser") {
      if (!v) return ctx.reply("user not valid");
      config.username = v;
      fs.writeFileSync("./user/data.json", JSON.stringify(config,null,4));
      ctx.reply("Success!");
    }
    else next();
  } else next();
  
});

bot.use((ctx, next) => {
  var username = ctx.update.message.chat.username;
  if (config.username !== username) {
    ctx.reply("تم رفض الوصول");
    return;
  }
  return next()
});

bot.use((ctx, next) => {
  tel = ctx;
  return next()
})
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'));

bot.command("login", async (ctx) => {
  var text = ctx.update.message.text;
  tel = ctx;
  var ob = text.split(" ");
  var username = ob[1];
  var password = ob[2];
  if ( !(username && password) )  {
    return ctx.reply(`Use:\n/login [YourUsername] [YourPassword]`);
  }
  await client.login({username, password});
  if (client.isLogin()) {
    ctx.reply('تم تسجيل الدخول بنجاح');
  }
  else {
    ctx.reply("فشلت المصادقة");
  }
  
});
bot.command("stop", ctx => {
  if (config.Start) {
    stop();
    ctx.reply("تم ايقاف الخدمة");
  }
  else {
    ctx.reply("الخدمة متوقفة");
  }
});

bot.command("getstatus", ctx => {
  var text = "الخدمة: " + (config.Start? "تعمل" : "متوقفه");
  text += "\n" + "تمت المشاهدة: " + config.info.view;
  ctx.reply(text);
});

bot.hears("/logout", async ctx => {
  if (config.Start) {
    return ctx.reply("يجب ايقاف العمليات قبل هذا الاجراء");
  }
  fs.writeFileSync("./user/cookies.json", "{}", "UTF-8");
   cookieStore = new FileCookieStore('./user/cookies.json');
  client = new Instagram({ cookieStore });
  ctx.reply("تمت العملية بنجاح");
})

bot.launch();
//********************************************************************** */


module.exports = router;
