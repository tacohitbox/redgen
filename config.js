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
    }
  }
}, function(err, res) {
  if (err) {
    console.log(`An error occurred.\n\n${(err.stack || err.message || err)}`);
  } else {
    base["2c-key"] = res.key;
    fs.writeFileSync(`${__dirname}/config.json`, JSON.stringify(base, null, 2));
    console.log(`\nSaved. Thank you.\n`);
  }
});