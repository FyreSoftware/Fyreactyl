/* eslint-disable camelcase */
/* eslint-disable no-mixed-operators */
module.exports.load = async function (app, ifValidAPI, ejs) {
  app.post("/api/name/change", async (req, res) => {
    if (
      (req.session.data && req.session.data.panelinfo.root_admin) ||
      ifValidAPI(req, res, "change name")
    ) {
      if (typeof req.body !== "object")
        return res.json({
          error: process.api_messages.core.bodymustbeanobject,
        });
      if (Array.isArray(req.body))
        return res.json({
          error: process.api_messages.core.bodycannotbeanarray,
        });
      const newName = req.body.name;
      const id = req.body.id;

      res.json({
        error: process.api_messages.core.noError,
        coins: await process.db.updateName(id, newName),
      });
    }
  });
};
