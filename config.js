#!/usr/bin/env node

const prompt = require("prompt");
const fs = require("fs");

const base = JSON.parse(fs.readFileSync(`${__dirname}/config.example.json`));

console.log("\nWelcome to the easy config system for REDGEN.\n");

prompt.get({
  properties: {
    key: {
      message: "Please enter your 2Captcha key. If you are confused, read the docs.",
      required: true
    },
    enableProxy: {
      message: "Please respond (yes/no | true/false) if you want to enable proxies",
      required: true
    }
  }
}, function(err, res) {
  if (err) {
    console.log(`An error occurred.\n\n${(err.stack || err.message || err)}`);
    process.exit(1);
  } else {
    base["2c-key"] = res.key;
    base["enable-proxies"] = toTF(res.enableProxy);
    if (base["enable-proxies"] == true) {
      prompt.get({
        properties: {
          getProxy: {
            message: "Please respond (yes/no | true/false) if you want the bot to get proxies for you.",
            required: true
          },
          saveProxies: {
            message: "Please respond where you want the bot to save/read the file. Begin your response with '.' if you want to save/read the proxies file in the root of the REDGEN folder.",
            required: true
          }
        }
      }, function(err, res) {
        if (err) {
          console.log(`An error occurred.\n\n${(err.stack || err.message || err)}`);
          process.exit(1);
        } else {
          base["retrieve-proxies"] = toTF(res.getProxy);
          base["proxy-file"] = res.saveProxies;
          fs.writeFileSync(`${__dirname}/config.json`, JSON.stringify(base, null, 2));
          console.log(`\nSaved. Thank you.\n`);
        }
      })
    } else {
      if (base["enable-proxies"] == null) {
        console.log(`An error occurred.\n\nGave invalid response during "enableProxy" phase.`);
        process.exit(1);
      }
      fs.writeFileSync(`${__dirname}/config.json`, JSON.stringify(base, null, 2));
      console.log(`\nSaved. Thank you.\n`);
    }
  }
});

function toTF(yn) {
  console.log(yn.toLowerCase())
  switch (yn.toLowerCase()) {
    case "y":
    case "yes":
    case "ye":
    case "t":
    case "tr":
    case "tru":
    case "true":
      return true;
    case "n":
    case "no":
    case "f":
    case "fa":
    case "fal":
    case "fals":
    case "false":
      return false;
    default:
      return null;
  }
}