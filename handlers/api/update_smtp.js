/* eslint-disable camelcase */
/* eslint-disable no-mixed-operators */
module.exports.load = async function (app, ifValidAPI, ejs) {
  app.post('/api/smtp/update', async (req, res) => {
    if (req.session.data && req.session.data.panelinfo.root_admin) {
      if (typeof req.body !== 'object')
        return res.json({
          error: process.api_messages.core.bodymustbeanobject,
        });
      if (Array.isArray(req.body))
        return res.json({
          error: process.api_messages.core.bodycannotbeanarray,
        });
      const server = req.body.server;
      const port = req.body.port;
      const user = req.body.user;
      const password = req.body.password;

      const id = process.env.discord.guild;

      const data = await process.db.updateSmtp(
        id,
        server,
        port,
        user,
        password
      );

      res.json({
        error: process.api_messages.core.noError,
        success: true,
      });
    }
  });
};
