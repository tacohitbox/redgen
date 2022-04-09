# redgen

Tool to automate making Reddit accounts, written in Node.

## features 

- Generate Reddit accounts in under a minute.
- Proxy support (Reddit only, currently [see here](#known-issues).)

## installation & configuration

**NOTE**: This program requires that you have a [2Captcha](https://2captcha.com) account *with* credits.

You also need Git and Node.JS installed.

```sh
git clone https://github.com/tacohitbox/redgen
cd redgen
npm i
npm link # linux & mac users: "sudo npm link"
redgen-config # put in your 2captcha key here!
```

Then, whenever you want, you can generate Reddit accounts with `redgen`.

## known issues

- Rate limiting by IP on a per 8-minute basis. Possibly longer depending on how much you push it. Kinda annoying but proxies are (I think) the only way to get around them.
- Proxy only goes through on Puppeteer instance, not on Mail.tm or CAPTCHA.