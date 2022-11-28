/* eslint-disable no-mixed-operators */
/* eslint-disable camelcase */
const fetch = require("node-fetch");

module.exports.load = async function (app, ifValidAPI, ejs) {
  app.post("/api/users/blacklist/email/:email", async (req, res) => {
    if (
      (req.session.data && req.session.data.panelinfo.root_admin) ||
      ifValidAPI(req, res, "blacklist user")
    ) {
      const email = req.params.email; // Discord ID.
      const userinfo = await process.db.fetchAccountByEmail(email);
      if (!userinfo)
        return res.json({ error: process.api_messages.extra.invaliduserid });

      const blacklist_status = await process.db.blacklistStatusByEmail(email,);
      if (blacklist_status)
        return res.json({
          error: process.api_messages.blacklist.alreadyBlacklisted,
        });

      await process.db.toggleBlacklistByEmail(email, true);
      res.json({
        error: process.api_messages.core.noError,
      });
    }
  });
};
