#!/usr/bin/env node

const puppeteer = require("puppeteer-extra");
const recaptcha = require("puppeteer-extra-plugin-recaptcha");
const MailClient = require("mail.tm");
const mail = new MailClient();
const {randomPassword} = require("custom-password-generator"); 
const fs = require("fs");
const axios = require("axios");
const pb = require("cli-progress");

if (!fs.existsSync(`${__dirname}/config.json`)) fs.copyFileSync(`${__dirname}/config.example.json`, `${__dirname}/config.json`);


console.log(`\nREDGEN - Generate Reddit accounts super quickly because why not?\n`);

const bar = new pb.SingleBar({format: `{bar} [{percentage}%] - {task}`}, pb.Presets.shades_classic)
const config = require(`${__dirname}/config.json`);

(async function() {
  let proxy;
  if (config["enable-proxies"] == true) {
    console.log("Configuring proxies...");
    let pf = config["proxy-file"]
    if (pf.startsWith(".")) pf = `${__dirname}/${pf}`;
    if (config["retrieve-proxies"]) {
      let pr = (await axios.get("https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt")).data;
      fs.writeFileSync(pf, pr);
      let pl = pr.split("\n");
      proxy = pl[Math.floor(Math.random() * pl.length)];
    } else {
      let pl = fs.readFileSync(pf).toString().split("\n");
      proxy = pl[Math.floor(Math.random() * pl.length)];
    }
  }
  
  let a = setInterval(async function() {
    if (config["enable-proxies"] !== true || proxy !== undefined && config["enable-proxies"] == true) {
      clearInterval(a);
      let opt = {};
      if (proxy) {
        console.log(`This instance is using a proxy (${proxy}).`);
        opt["args"] = [`--proxy-server=${proxy}`];
        // opt["headless"] = false;
        // line above is for debug.
        console.log("- Configured.\n");
      }

      bar.start(9, 0, {
        task: "Generating credentials..."
      });

      puppeteer.use(recaptcha({
        provider: {
          id: "2captcha",
          token: config["2c-key"]
        }
      }));

      puppeteer.launch(opt).then(async function(browser) {
        let page = await browser.newPage();
        let email = await mail.generateAccount();
        let eu = email.data.username;
        let ep = email.data.password;
        bar.increment(1, {
          task: "Navigating to Reddit..."
        });
        await page.goto("https://old.reddit.com/", {timeout: 20000});
        bar.increment(1, {
          task: "Opening signup page..."
        });
        await page.click(".user a.login-required:not(.login-link)");
        await page.waitForSelector(".sign-up-form [name='email']");
        await page.focus(".sign-up-form [name='email']");
        await page.type(".sign-up-form [name='email']", eu);
        await page.waitForSelector(".sign-up-form button[type='submit']");
        await page.focus(".sign-up-form button[type='submit']");
        let pw = randomPassword({length: 15});
        bar.increment(1, {
          task: "Generating password..."
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.click(".sign-up-form button[type='submit']");
        if (await page.$(".c-username-picker-shown .desktop-onboarding-username-form")) {
          await page.waitForSelector(".username-generator__suggestions li a:nth-child(1)");
          await page.click(".username-generator__suggestions li a:nth-child(1)");
          let user = await page.evaluate("document.querySelector('.username-generator__suggestions li a:nth-child(1)').getAttribute('data-username')");
          await page.type("#passwd_reg", pw);
          bar.increment(1, {
            task: "Looking for a CAPTCHA..."
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (await page.$("iframe[title='reCAPTCHA']")) {
            bar.increment(0, {task: "Solving CAPTCHA..."})
            await page.solveRecaptchas();
          } 
          bar.increment(1, {
            task: "Skipping subreddit recommendations..."
          });
          await page.click(".c-username-picker-shown .desktop-onboarding__next-button");
          await new Promise(resolve => setTimeout(resolve, 1000));
          await page.waitForSelector("#desktop-onboarding-browse footer .desktop-onboarding__next-button");
          await page.focus("#desktop-onboarding-browse footer .desktop-onboarding__next-button");
          await new Promise(resolve => setTimeout(resolve, 1000));
          await page.click("#desktop-onboarding-browse footer .desktop-onboarding__next-button");
          bar.increment(1, {
            task: "Waiting for a refresh..."
          });
          await page.waitForNavigation();
          bar.increment(1, {
            task: "Retrieving email confirmation code..."
          });
          let l = await getConfirmLink(eu, ep);
          bar.increment(1, {
            task: "Verifying email..."
          });
          await page.goto(l);
          if (await page.url().includes("?verified=true")) {
            end(user, pw, eu, ep, browser);
          } else {
            bar.stop();
            console.log("\nScraper is out of date, please make an issue on the Github repo.");
            process.exit(1);
          }
        } else if (await page.$("#desktop-onboarding-browse footer .desktop-onboarding__next-button")) {
          bar.increment(1, {
            task: "Skipping subreddit recommendations..."
          });
          await page.focus("#desktop-onboarding-browse footer .desktop-onboarding__next-button");
          await new Promise(resolve => setTimeout(resolve, 1000));
          await page.click("#desktop-onboarding-browse footer .desktop-onboarding__next-button");
          await page.waitForSelector(".username-generator__suggestions li a:nth-child(1)");
          let user = await page.evaluate("document.querySelector('.username-generator__suggestions li a:nth-child(1)').getAttribute('data-username')");
          await page.click(".username-generator__suggestions li a:nth-child(1)");
          await page.type("#passwd_reg", pw);
          bar.increment(1, {
            task: "Looking for a CAPTCHA..."
          });
          await new Promise(resolve => setTimeout(resolve, 5000));
          if (await page.$("iframe[title='reCAPTCHA']")) {
            bar.increment(0, {
              task: "Solving CAPTCHA..."
            });
            await page.solveRecaptchas();
          }
          await page.click(".c-username-picker-shown .desktop-onboarding__next-button");
          bar.increment(1, {
            task: "Waiting for a refresh..."
          });
          await page.waitForNavigation();
          bar.increment(1, {
            task: "Retrieving email confirmation code..."
          });
          let l = await getConfirmLink(eu, ep);
          bar.increment(1, {
            task: "Verifying..."
          });
          await page.goto(l);
          if (await page.url().includes("?verified=true")) {
            end(user, pw, eu, ep, browser);
          } else {
            bar.stop();
            console.log("\n\nScraper is out of date, please make an issue on the Github repo.");
            process.exit(1);
          } 
        }
      }).catch(function(err) {
        bar.stop();
        console.log(`\n\nAn error occured.`)
        if (err.message !== "Navigation timeout of 30000 ms exceeded") {
          console.log((err.stack || err.message || err.code || err));
        } else {
          console.log("Please wait 8 minutes in between each generation. If you believe this is in error and it *has* been 8 minutes, report it as an issue in the Github repo.\n");
          console.log(err.stack);
        }
        process.exit(1);
      });
    }
  }, 100);
})();


async function getConfirmLink(eu, ep) {
  await mail.login(eu, ep);
  await new Promise(resolve => setTimeout(resolve, 5000));
  let con = await mail.fetchMessages();
  let txt = (await (await (mail.fetchMessage(con.data[0].id))).data).text;
  let link = txt.split("Verify Email Address\n[")[1].split("]")[0];
  return link;
}

async function end(user, pass, eu, ep, b) {
  await b.close();
  bar.increment(1, {task: "Done!"});
  bar.stop();
  if (!fs.existsSync(`accounts/`)) fs.mkdirSync(`accounts/`);
  if (!fs.existsSync(`accounts/${user}.json`)) fs.writeFileSync(`accounts/${user}.json`, JSON.stringify({
    username: user,
    password: pass,
    email: {
      login: eu,
      password: ep
    }
  }, null, 2));
  console.log(`\nSuccessfully generated account. Please wait 8 minutes before generating a new one, or use a different IP.\nUsername: ${user}\nPassword: ${pass}\n\nAdditional information is available at "./accounts/${user}.json".\n`);
}