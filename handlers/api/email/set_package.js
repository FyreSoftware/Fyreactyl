/* eslint-disable no-mixed-operators */
/* eslint-disable camelcase */
const suspendCheck = require("../../servers/suspension_system.js");

module.exports.load = async function (app, ifValidAPI, ejs) {
  app.post("/api/resources/set_package/email/:email", async (req, res) => {
    if (
      (req.session.data && req.session.data.panelinfo.root_admin) ||
      ifValidAPI(req, res, "set package")
    ) {
      if (typeof req.body !== "object")
        return res.json({
          error: process.api_messages.core.bodymustbeanobject,
        });
      if (Array.isArray(req.body))
        return res.json({
          error: process.api_messages.core.bodycannotbeanarray,
        });

      const email = req.params.email; // Discord ID.
      const userinfo = await process.db.fetchAccountByEmail(email);
      if (!userinfo)
        return res.json({ error: process.api_messages.extra.invalidemail });

      const pkg = req.body.package;
      if (pkg !== null && typeof pkg !== "string")
        return res.json({
          error: process.api_messages.package.mustbeastringornull,
        });
      if (pkg !== null)
        if (!process.env.packages.list[pkg])
          return res.json({
            error: process.api_messages.package.invalidpackage,
          });

      if (!pkg) {
        await process.db.setPackageByEmail(email, null); // idk if this works
      } else {
        await process.db.setPackageByEmail(email, pkg);
      }

      res.json({
        error: process.api_messages.core.noError,
        package: pkg,
        email: email,
      });

      suspendCheck(email);
    }
  });
};
