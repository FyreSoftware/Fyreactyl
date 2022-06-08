/* eslint-disable no-constant-condition */
/* eslint-disable camelcase */
const fetch = require("node-fetch");
const functions = require("../../functions.js");
const suspendCheck = require("../servers/suspension_system.js");
const nodemailer = require("nodemailer");
module.exports.load = async function (app, ifValidAPI, ejs) {
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
    const dbSettings = await process.db.findOrCreateSettings(
      process.env.discord.guild
    );
    try {
      const mailer = nodemailer.createTransport({
        host: dbSettings.smtp_server,
        port: dbSettings.smtp_port,
        secure: true,
        auth: {
          user: dbSettings.smtp_user,
          pass: dbSettings.smtp_pass,
        },
      });
      const id = functions.makeid(9);
      var contentHTML = ` 
    <h1>${dbSettings.name}</h1>
      Hello ${account.name}!
      <br>We've recently received a request for resetting your password, if this wasn't you, you can ignore this email.<br>
      If this was you please click this <a href="${process.env.website.url}/reset/password/form?id=${id}">link</a><br>
      Kind regards,<br>${dbSettings.name}
  `;
      mailer.sendMail({
        from: dbSettings.smtp_user,
        to: email,
        subject: "Reset password",
        html: contentHTML,
      });
      req.session.variables = {
        success: {
          message: `Sent an email to ${email}`,
        },
      };

      await process.db.updateResetId(email, id);
      return res.redirect("/reset/password");
    } catch (err) {
      req.session.variables = {
        error: {
          message:
            "Something went wrong with the smtp config. Please contact an administrator to fix this issue.",
        },
      };
      return res.redirect("/login");
    }
  });
  app.post("/accounts/email/password/reset/:id", async (req, res) => {
    if (!req.params.id) {
      return res.redirect("/login");
    }

    const confirm = await process.db.fetchAccountByResetId(req.params.id);

    if (!confirm) {
      return res.redirect("/login");
    }

    if (req.body.password !== req.body.password_confirm) {
      req.session.variables = {
        error: {
          message: "Password is not the same as the confirm password field.",
        },
      };
      return res.redirect(`/reset/password/form?id=${req.params.id}`);
    }

    await process.db.updatePassword(confirm.email, req.body.password);

    req.session.variables = {
      success: {
        message: `Your password is now ${req.body.password}`,
      },
    };
    return res.redirect("/login");
  });

  app.post("/accounts/email/login", async (req, res) => {
    const redirects = process.pagesettings.redirectactions.oauth2;
    const userinfo_withemail = await process.db.fetchAccountByEmail(
      req.body.email
    );

    if (userinfo_withemail?.discord_id && !userinfo_withemail.password) {
      req.session.variables = {
        error: {
          message:
            "Looks like you signed up with discord, try using discord to login.",
        },
      };
      return res.redirect("/");
    }
    const userinfo = await process.db.fetchAccountByEmailAndPassword(
      req.body.email,
      req.body.password
    );
    if (!userinfo) {
      req.session.variables = {
        error: {
          message: "Wrong email or password, try again.",
        },
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
    const blacklist_status = await process.db.blacklistStatusByEmail(
      req.body.email
    );
    if (blacklist_status !== "false" && !panelinfo.root_admin) {
      return functions.doRedirect(req, res, redirects.blacklisted);
    }

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
      return res.redirect("/signup");
    }
    panel_id = userinfo.pterodactyl_id;

    dbinfo = {
      email: req.body.email,
      pterodactyl_id: userinfo.id,
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
      panelinfo: userinfo,
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
};
