/* eslint-disable camelcase */
/* eslint-disable no-mixed-operators */
const suspendCheck = require("../../servers/suspension_system.js");

module.exports.load = async function (app, ifValidAPI, ejs) {
  app.post("/api/users/unblacklist/:id", async (req, res) => {
    if (
      (req.session.data && req.session.data.panelinfo.root_admin) ||
      ifValidAPI(req, res, "unblacklist user")
    ) {
      const user_id = req.params.id; // Discord ID.
      const userinfo = await process.db.fetchAccountDiscordID(user_id);
      if (!userinfo)
        return res.json({ error: process.api_messages.extra.invaliduserid });

      const blacklist_status = await process.db.toggleBlacklistByDiscordID(
        user_id
      );
      if (!blacklist_status)
        return res.json({
          error: process.api_messages.blacklist.notBlacklisted,
        });

      await process.db.toggleBlacklistByDiscordID(user_id, false);

      suspendCheck(
        req.session.data.dbinfo.email,
        req.session.data.panelinfo.root_admin
      );

      res.json({
        error: process.api_messages.core.noError,
      });
    }
  });
};
