/* eslint-disable no-constant-condition */
/* eslint-disable camelcase */
const fetch = require("node-fetch");
const functions = require("../functions.js");
const suspendCheck = require("./server suspension system.js");

module.exports.load = async function (app, ifValidAPI, ejs) {
  app.get("/accounts/discord/login", async (req, res) => {
    res.redirect(
      `https://discord.com/api/oauth2/authorize?client_id=${
        process.env.discord.id
      }&redirect_uri=${encodeURIComponent(
        process.env.discord.callbackpath
      )}&response_type=code&scope=identify%20email%20guilds%20guilds.join${
        !process.env.discord.prompt
          ? "&prompt=none"
          : req.query.prompt
          ? (req.query.prompt = "none" ? "&prompt=none" : "")
          : ""
      }`
    );
  });
  app.post("/accounts/email/reset", async (req, res) => {
    const email = req.body.email;

    const account = await process.db.fetchAccountByEmail(email);

    if (!account) {
      req.session.variables = {
        error: {
          message:
            "Account does not exist with that email, try signing up instead.",
        },
      };
      return res.redirect("/reset/password");
    }
    process.mailer.sendMail({
      from: "ethanthegamon@gmail.com",
      to: email,
      subject: "Reset password",
      text: "testing!",
      auth: {
        user: "ethanthegamon@gmail.com",
      },
    });
    req.session.variables = {
      success: {
        message: `Successfully sent an email to ${email}`,
      },
    };
    return res.redirect("/reset/password");
  });

  app.get("/accounts/email/password/reset", async (req, res) => {
    if (!req.query.id || !req.query.email) {
      return res.redirect("/login");
    }
    const userinfo = await process.db.fetchAccountByEmail(req.query.email);

    if (!userinfo) {
      return res.redirect("/login");
    }
  });

  app.post("/accounts/email/login", async (req, res) => {
    const redirects = process.pagesettings.redirectactions.oauth2;
    const userinfo = await process.db.fetchAccountByEmailAndPassword(
      req.body.email,
      req.body.password
    );
    if (!userinfo) {
      req.session.variables = {
        message:
          "Account does not exist with that email, try signing up instead.",
      };
      return res.redirect("/");
    }
    const panelinfo_raw = await fetch(
      `${process.env.pterodactyl.domain}/api/application/users/${userinfo.pterodactyl_id}?include=servers`,
      {
        method: "get",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.pterodactyl.key}`,
        },
      }
    );

    if ((await panelinfo_raw.statusText) === "Not Found")
      return functions.doRedirect(req, res, redirects.cannotgetinfo);

    const panelinfo = (await panelinfo_raw.json()).attributes;

    req.session.data = {
      dbinfo: userinfo,
      panelinfo: panelinfo,
    };
    return functions.doRedirect(req, res, redirects.success);
  });

  app.post("/accounts/email/singup", async (req, res) => {
    const redirects = process.pagesettings.redirectactions.oauth2;
    if (req.body.password !== req.body.password_confirm) {
      req.session.variables = {
        message: "Password is not the same as Confirm password input",
      };

      return res.redirect("/signup");
    }
    const account = await process.db.fetchAccountByEmail(req.body.email);
    if (account) {
      req.session.variables = {
        message:
          "Account already exis's with that email, try logging in instead.",
      };
      return res.redirect("/signup");
    }
    const userinfo = await process.db.createOrFindAccount(
      req.body.username,
      req.body.email,
      req.body.username,
      req.body.username,
      null,
      req.body.password
    );
    if (!userinfo) {
      req.session.variables = {
        message: "An error has occured, please report this to an admin",
      };
      console.log(userinfo);
      return res.redirect("/signup");
    }
    panel_id = userinfo.pterodactyl_id;

    dbinfo = {
      email: req.body.email,
      pterodactyl_id: panelinfo.id,
      coins: 0,
      package: null,
      memory: null,
      disk: null,
      cpu: null,
      servers: null,
      name: req.body.username,
    };
    req.session.data = {
      dbinfo: dbinfo,
      panelinfo: panelinfo,
    };
    functions.doRedirect(req, res, redirects.success);
  });

  app.get("/accounts/logout", (req, res) => {
    delete req.session.data;

    // req.session.destroy(() => {
    return functions.doRedirect(
      req,
      res,
      process.pagesettings.redirectactions.logout
    );
    // });
  });

  app.get(
    "/accounts/discord/callback",

    process.rateLimit({
      windowMs: 1000,
      max: 1,
      message:
        "You have been requesting this endpoint too fast. Please try again.",
    }),

    async (req, res) => {
      const redirects = process.pagesettings.redirectactions.oauth2;

      if (req.query.error && req.query.error_description) {
        if (
          req.query.error === "access_denied" &&
          req.query.error_description ===
            "The resource owner or authorization server denied the request"
        ) {
          return functions.doRedirect(req, res, redirects.cancelledloginaction);
        }
      }

      if (!req.query.code)
        return functions.doRedirect(req, res, redirects.missingcode);

      const oauth2Token = await fetch("https://discord.com/api/oauth2/token", {
        method: "post",
        body: `client_id=${process.env.discord.id}&client_secret=${
          process.env.discord.secret
        }&grant_type=authorization_code&code=${encodeURIComponent(
          req.query.code
        )}&redirect_uri=${encodeURIComponent(
          process.env.discord.callbackpath
        )}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (!oauth2Token.ok)
        return functions.doRedirect(req, res, redirects.invalidcode);

      const tokenInfo = JSON.parse(await oauth2Token.text());
      const scopes = tokenInfo.scope;

      if (scopes !== "identify email guilds guilds.join")
        return functions.doRedirect(req, res, redirects.badscopes);

      const userinfo_raw = await fetch("https://discord.com/api/users/@me", {
        method: "get",
        headers: {
          Authorization: `Bearer ${tokenInfo.access_token}`,
        },
      });

      const userinfo = JSON.parse(await userinfo_raw.text());

      if (!userinfo.verified)
        return functions.doRedirect(req, res, redirects.unverified);

      const guildinfo_raw = await fetch(
        "https://discord.com/api/users/@me/guilds",
        {
          method: "get",
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
              method: "get",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bot ${process.env.discord.token}`,
              },
            }
          )
        ).status;

        if (check_if_banned === 200) {
          await process.db.toggleBlacklistByDiscordID(userinfo.id, true);
        } else if (check_if_banned === 404) {
          await fetch(
            `https://discord.com/api/guilds/${process.env.discord.guild}/members/${userinfo.id}`,
            {
              method: "put",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bot ${process.env.discord.token}`,
              },
              body: JSON.stringify({
                access_token: tokenInfo.access_token,
              }),
            }
          );
        } else {
          console.log(
            "[AUTO JOIN SERVER] For some reason, the status code is " +
              check_if_banned +
              ", instead of 200 or 404. You should worry about this."
          );
        }
      }

      let dbinfo = await process.db.fetchAccountDiscordID(userinfo.id);
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

        await process.db.checkJ4R(userinfo.id, guilds);
      } else {
        // Fetch account information.

        panel_id = dbinfo.pterodactyl_id;

        const panelinfo_raw = await fetch(
          `${process.env.pterodactyl.domain}/api/application/users/${panel_id}?include=servers`,
          {
            method: "get",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.pterodactyl.key}`,
            },
          }
        );

        if ((await panelinfo_raw.statusText) === "Not Found")
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
      };

      if (generated_password) {
        req.session.variables = {
          password: generated_password,
        };
      }

      if (!generated_password)
        suspendCheck(req.session.data.userinfo.id, panelinfo.root_admin);

      functions.doRedirect(req, res, redirects.success);
    }
  );
};
