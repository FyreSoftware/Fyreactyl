/* eslint-disable camelcase */
/* eslint-disable no-mixed-operators */
module.exports.load = async function (app, ifValidAPI, ejs) {
  app.get("/api/users/info/email/:email", async (req, res) => {
    if (
      (req.session.data && req.session.data.panelinfo.root_admin) ||
      ifValidAPI(req, res, "user info")
    ) {
      const email = req.params.email; // Discord ID.
      const userinfo = await process.db.fetchAccountByEmail(email);
      if (!userinfo)
        return res.json({ error: process.api_messages.extra.invalidemail });

      res.json({
        error: process.api_messages.core.noError,
        info: userinfo,
      });
    }
  });
};
