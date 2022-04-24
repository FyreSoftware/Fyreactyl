/* eslint-disable no-constant-condition */
/* eslint-disable camelcase */
const fetch = require('node-fetch');
const functions = require('../../functions.js');
const suspendCheck = require('../servers/suspension_system.js');
const express = require('express');
module.exports.load = async function (app, ifValidAPI, ejs) {
  app.get('/accounts/discord/signup', async (req, res) => {
    res.redirect(
      `https://discord.com/api/oauth2/authorize?client_id=${
        process.env.discord.id
      }&redirect_uri=${encodeURIComponent(
        process.env.discord.signup_callback
      )}&response_type=code&scope=identify%20email%20guilds%20guilds.join`
    );
  });
  app.get('/accounts/discord/login', async (req, res) => {
    res.redirect(
      `https://discord.com/api/oauth2/authorize?client_id=${
        process.env.discord.id
      }&redirect_uri=${encodeURIComponent(
        process.env.discord.login_callback
      )}&response_type=code&scope=identify%20email%20guilds%20guilds.join`
    );
  });
  app.get('/accounts/discord/link', async (req, res) => {
    res.redirect(
      `https://discord.com/api/oauth2/authorize?client_id=${
        process.env.discord.id
      }&redirect_uri=${encodeURIComponent(
        process.env.discord.link_callback
      )}&response_type=code&scope=identify%20email%20guilds%20guilds.join`
    );
  });
  app.get(
    '/accounts/discord/link/callback',
    process.rateLimit({
      windowMs: 1000,
      max: 1,
      message:
        "You've been requesting this endpoint to fast. Please try again later.",
    }),
    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     * @returns
     */
    async (req, res) => {
      if (!req.session.data) {
        return res.redirect('/login');
      }
      const redirects = process.pagesettings.redirectactions.oauth2;

      if (req.query.error && req.query.error_description) {
        if (
          req.query.error === 'access_denied' &&
          req.query.error_description ===
            'The resource owner or authorization server denied the request'
        ) {
          return functions.doRedirect(req, res, redirects.cancelledloginaction);
        }
      }

      if (!req.query.code)
        return functions.doRedirect(req, res, redirects.missingcode);

      const account = await process.db.fetchAccountByEmail(
        req.session.data.dbinfo.email
      );
      if (!account) {
        return res.redirect('/');
      }
      if (account.discord_id) {
        return res.redirect('/dashboard');
      }

      const oauth2Token = await fetch('https://discord.com/api/oauth2/token', {
        method: 'post',
        body: `client_id=${process.env.discord.id}&client_secret=${
          process.env.discord.secret
        }&grant_type=authorization_code&code=${encodeURIComponent(
          req.query.code
        )}&redirect_uri=${encodeURIComponent(
          process.env.discord.link_callback
        )}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (!oauth2Token.ok)
        return functions.doRedirect(req, res, redirects.invalidcode);
      const tokenInfo = JSON.parse(await oauth2Token.text());
      const scopes = tokenInfo.scope;
      if (
        !scopes.includes('identify') ||
        !scopes.includes('guilds.join') ||
        !scopes.includes('email') ||
        !scopes.includes('guilds')
      )
        return functions.doRedirect(req, res, redirects.badscopes);
      const userinfo_raw = await fetch('https://discord.com/api/users/@me', {
        method: 'get',
        headers: {
          Authorization: `Bearer ${tokenInfo.access_token}`,
        },
      });

      const userinfo = JSON.parse(await userinfo_raw.text());

      if (!userinfo.verified)
        return functions.doRedirect(req, res, redirects.unverified);

      const guildinfo_raw = await fetch(
        'https://discord.com/api/users/@me/guilds',
        {
          method: 'get',
          headers: {
            Authorization: `Bearer ${tokenInfo.access_token}`,
          },
        }
      );

      const guilds = await guildinfo_raw.json();
      if (!Array.isArray(guilds))
        return functions.doRedirect(req, res, redirects.cannotgetguilds); // Impossible error.

      userinfo.access_token = tokenInfo.access_token;
      userinfo.guilds = guilds;

      if (process.env.discord.guild) {
        const check_if_banned = (
          await fetch(
            `https://discord.com/api/guilds/${process.env.discord.guild}/bans/${userinfo.id}`,
            {
              method: 'get',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bot ${process.env.discord.token}`,
              },
            }
          )
        ).status;

        if (check_if_banned === 200) {
          await process.db.toggleBlacklist(userinfo.id, true);
        } else if (check_if_banned === 404) {
          await fetch(
            `https://discord.com/api/guilds/${process.env.discord.guild}/members/${userinfo.id}`,
            {
              method: 'put',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bot ${process.env.discord.token}`,
              },
              body: JSON.stringify({
                access_token: tokenInfo.access_token,
              }),
            }
          );
        } else {
          console.log(
            '[AUTO JOIN SERVER] For some reason, the status code is ' +
              check_if_banned +
              ', instead of 200 or 404. You should worry about this.'
          );
        }
      }

      const blacklist_status = await process.db.blacklistStatusByDiscordID(
        userinfo.id
      );
      if (blacklist_status && !panelinfo.root_admin)
        return functions.doRedirect(req, res, redirects.blacklisted);

      const newAcc = await process.db.updateDiscordId(
        account.email,
        userinfo.id
      );

      req.session.data.dbinfo = newAcc;
      req.session.data.userinfo = userinfo;

      functions.doRedirect(req, res, redirects.linked);
    }
  );
  app.get(
    '/accounts/discord/login/callback',
    process.rateLimit({
      windowMs: 1000,
      max: 1,
      message:
        'You have been requesting this endpoint too fast. Please try again.',
    }),
    async (req, res) => {
      const redirects = process.pagesettings.redirectactions.oauth2;

      if (req.query.error && req.query.error_description) {
        if (
          req.query.error === 'access_denied' &&
          req.query.error_description ===
            'The resource owner or authorization server denied the request'
        ) {
          return functions.doRedirect(req, res, redirects.cancelledloginaction);
        }
      }

      if (!req.query.code)
        return functions.doRedirect(req, res, redirects.missingcode);

      const oauth2Token = await fetch('https://discord.com/api/oauth2/token', {
        method: 'post',
        body: `client_id=${process.env.discord.id}&client_secret=${
          process.env.discord.secret
        }&grant_type=authorization_code&code=${encodeURIComponent(
          req.query.code
        )}&redirect_uri=${encodeURIComponent(
          process.env.discord.login_callback
        )}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (!oauth2Token.ok)
        return functions.doRedirect(req, res, redirects.invalidcode);

      const tokenInfo = JSON.parse(await oauth2Token.text());
      const scopes = tokenInfo.scope;

      if (
        !scopes.includes('identify') ||
        !scopes.includes('guilds.join') ||
        !scopes.includes('email') ||
        !scopes.includes('guilds')
      )
        return functions.doRedirect(req, res, redirects.badscopes);

      const userinfo_raw = await fetch('https://discord.com/api/users/@me', {
        method: 'get',
        headers: {
          Authorization: `Bearer ${tokenInfo.access_token}`,
        },
      });

      const userinfo = JSON.parse(await userinfo_raw.text());

      if (!userinfo.verified)
        return functions.doRedirect(req, res, redirects.unverified);

      const guildinfo_raw = await fetch(
        'https://discord.com/api/users/@me/guilds',
        {
          method: 'get',
          headers: {
            Authorization: `Bearer ${tokenInfo.access_token}`,
          },
        }
      );

      const guilds = await guildinfo_raw.json();
      if (!Array.isArray(guilds))
        return functions.doRedirect(req, res, redirects.cannotgetguilds); // Impossible error.

      userinfo.access_token = tokenInfo.access_token;
      userinfo.guilds = guilds;

      if (process.env.discord.guild) {
        const check_if_banned = (
          await fetch(
            `https://discord.com/api/guilds/${process.env.discord.guild}/bans/${userinfo.id}`,
            {
              method: 'get',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bot ${process.env.discord.token}`,
              },
            }
          )
        ).status;

        if (check_if_banned === 200) {
          await process.db.toggleBlacklist(userinfo.id, true);
        } else if (check_if_banned === 404) {
          await fetch(
            `https://discord.com/api/guilds/${process.env.discord.guild}/members/${userinfo.id}`,
            {
              method: 'put',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bot ${process.env.discord.token}`,
              },
              body: JSON.stringify({
                access_token: tokenInfo.access_token,
              }),
            }
          );
        } else {
          console.log(
            '[AUTO JOIN SERVER] For some reason, the status code is ' +
              check_if_banned +
              ', instead of 200 or 404. You should worry about this.'
          );
        }
      }

      let dbinfo = await process.db.fetchAccountDiscordID(userinfo.id);
      if (!dbinfo) {
        req.session.variables = {
          error: {
            message:
              'No account was found linked with that discord account, please signup instead.',
          },
        };
        return res.redirect('/');
      }
      let panel_id;
      let panelinfo;
      let generated_password = null;

      if (!dbinfo) {
        req.session.variables = {
          error: {
            message:
              'No account was found linked with that discord account, please signup instead.',
          },
        };
        return res.redirect('/');
      } else {
        // Fetch account information.

        panel_id = dbinfo.pterodactyl_id;

        const panelinfo_raw = await fetch(
          `${process.env.pterodactyl.domain}/api/application/users/${panel_id}?include=servers`,
          {
            method: 'get',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.pterodactyl.key}`,
            },
          }
        );

        if ((await panelinfo_raw.statusText) === 'Not Found')
          return functions.doRedirect(req, res, redirects.cannotgetinfo);

        panelinfo = (await panelinfo_raw.json()).attributes;
      }

      const blacklist_status = await process.db.blacklistStatusByDiscordID(
        userinfo.id
      );
      if (blacklist_status && !panelinfo.root_admin)
        return functions.doRedirect(req, res, redirects.blacklisted);

      req.session.data = {
        dbinfo: dbinfo,
        panelinfo: panelinfo,
        userinfo,
      };

      if (!generated_password)
        suspendCheck(req.session.data.dbinfo.email, panelinfo.root_admin);

      functions.doRedirect(req, res, redirects.success);
    }
  );

  app.get(
    '/accounts/discord/signup/callback',

    process.rateLimit({
      windowMs: 1000,
      max: 1,
      message:
        'You have been requesting this endpoint too fast. Please try again.',
    }),

    async (req, res) => {
      const redirects = process.pagesettings.redirectactions.oauth2;

      if (req.query.error && req.query.error_description) {
        if (
          req.query.error === 'access_denied' &&
          req.query.error_description ===
            'The resource owner or authorization server denied the request'
        ) {
          return functions.doRedirect(req, res, redirects.cancelledloginaction);
        }
      }

      if (!req.query.code)
        return functions.doRedirect(req, res, redirects.missingcode);

      const oauth2Token = await fetch('https://discord.com/api/oauth2/token', {
        method: 'post',
        body: `client_id=${process.env.discord.id}&client_secret=${
          process.env.discord.secret
        }&grant_type=authorization_code&code=${encodeURIComponent(
          req.query.code
        )}&redirect_uri=${encodeURIComponent(
          process.env.discord.signup_callback
        )}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (!oauth2Token.ok)
        return functions.doRedirect(req, res, redirects.invalidcode);

      const tokenInfo = JSON.parse(await oauth2Token.text());
      const scopes = tokenInfo.scope;

      if (
        !scopes.includes('identify') ||
        !scopes.includes('guilds.join') ||
        !scopes.includes('email') ||
        !scopes.includes('guilds')
      )
        return functions.doRedirect(req, res, redirects.badscopes);

      const userinfo_raw = await fetch('https://discord.com/api/users/@me', {
        method: 'get',
        headers: {
          Authorization: `Bearer ${tokenInfo.access_token}`,
        },
      });

      const userinfo = JSON.parse(await userinfo_raw.text());

      if (!userinfo.verified)
        return functions.doRedirect(req, res, redirects.unverified);

      const guildinfo_raw = await fetch(
        'https://discord.com/api/users/@me/guilds',
        {
          method: 'get',
          headers: {
            Authorization: `Bearer ${tokenInfo.access_token}`,
          },
        }
      );

      const guilds = await guildinfo_raw.json();
      if (!Array.isArray(guilds))
        return functions.doRedirect(req, res, redirects.cannotgetguilds); // Impossible error.

      userinfo.access_token = tokenInfo.access_token;
      userinfo.guilds = guilds;

      if (process.env.discord.guild) {
        const check_if_banned = (
          await fetch(
            `https://discord.com/api/guilds/${process.env.discord.guild}/bans/${userinfo.id}`,
            {
              method: 'get',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bot ${process.env.discord.token}`,
              },
            }
          )
        ).status;

        if (check_if_banned === 200) {
          await process.db.toggleBlacklist(userinfo.id, true);
        } else if (check_if_banned === 404) {
          await fetch(
            `https://discord.com/api/guilds/${process.env.discord.guild}/members/${userinfo.id}`,
            {
              method: 'put',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bot ${process.env.discord.token}`,
              },
              body: JSON.stringify({
                access_token: tokenInfo.access_token,
              }),
            }
          );
        } else {
          console.log(
            '[AUTO JOIN SERVER] For some reason, the status code is ' +
              check_if_banned +
              ', instead of 200 or 404. You should worry about this.'
          );
        }
      }

      let dbinfo = await process.db.fetchAccountDiscordID(userinfo.id);
      let emailinfo = await process.db.fetchAccountByEmail(userinfo.email);
      if (emailinfo) {
        req.session.variables = {
          error: {
            message:
              'You already have an account with that email please sign in!',
          },
        };
        return res.redirect('/');
      }
      let panel_id;
      let panelinfo;
      let generated_password = null;

      if (!dbinfo) {
        // Create account.

        panelinfo = await process.db.createOrFindAccount(
          userinfo.username,
          userinfo.email,
          `#${userinfo.discriminator}`,
          userinfo.discriminator,
          userinfo.id
        );

        if (!panelinfo)
          return functions.doRedirect(req, res, redirects.anotheraccount);

        panel_id = panelinfo.id;

        if (panelinfo.password) generated_password = panelinfo.password;

        dbinfo = {
          id: userinfo.id,
          pterodactyl_id: panelinfo.id,
          coins: 0,
          package: null,
          memory: null,
          disk: null,
          cpu: null,
          servers: null,
          email: userinfo.email,
          name: userinfo.username,
        };
      } else {
        req.session.variables = {
          error: {
            message:
              'You already have an account with that email please sign in!',
          },
        };
        return res.redirect('/');
      }

      const blacklist_status = await process.db.blacklistStatusByDiscordID(
        userinfo.id
      );
      if (blacklist_status && !panelinfo.root_admin)
        return functions.doRedirect(req, res, redirects.blacklisted);

      req.session.data = {
        dbinfo: dbinfo,
        panelinfo: panelinfo,
      };

      if (generated_password) {
        req.session.variables = {
          password: generated_password,
        };
      }

      if (!generated_password) suspendCheck(dbinfo.email, panelinfo.root_admin);

      functions.doRedirect(req, res, redirects.success);
    }
  );
};
