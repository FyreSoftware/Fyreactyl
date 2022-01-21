/* eslint-disable camelcase */
module.exports.load = async function (app, ifValidAPI, ejs) {
  app.post("/api/j4r/delete", async (req, res) => {
    // This endpoint is not supported on APIs.

    if (req.session.data && req.session.data.panelinfo.root_admin) {
      // || ifValidAPI(req, res, 'create j4r')
      if (typeof req.body !== "object")
        return res.json({
          error: process.api_messages.core.bodymustbeanobject,
        });
      if (Array.isArray(req.body))
        return res.json({
          error: process.api_messages.core.bodycannotbeanarray,
        });

      const j4r_id = req.body.j4r_id;

      await process.db.deleteJ4R(j4r_id);

      res.json({
        j4r_id: j4r_id,
      });
    }
  });
};
