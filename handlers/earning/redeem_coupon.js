/* eslint-disable camelcase */
const functions = require("../../functions.js");
const suspendCheck = require("../servers/suspension_system.js");

module.exports.load = async function (app, ifValidAPI, ejs) {
  app.post(
    "/earn/redeem_coupon",

    process.rateLimit({
      windowMs: 1000,
      max: 1,
      message:
        "You have been requesting this endpoint too fast. Please try again.",
    }),

    async (req, res) => {
      const redirects = process.pagesettings.redirectactions.redeem_coupon;
      if (!req.session.data || !req.session.data.dbinfo)
        return functions.doRedirect(req, res, redirects.notsignedin);

      const code = req.body.code;
      if (typeof code !== "string")
        return functions.doRedirect(req, res, redirects.missingcouponcode);
      if (code.length === 0)
        return functions.doRedirect(
          req,
          res,
          redirects.zerocharactercodesareinvalid
        );

      const coupon_info = await process.db.claimCoupon(code);
      if (!coupon_info)
        return functions.doRedirect(req, res, redirects.invalidcouponcode);

      const current = await process.db.fetchAccountByEmail(
        req.session.data.dbinfo.email
      );

      if (coupon_info.coins) {
        current.coins += coupon_info.coins;

        await process.db.setCoinsByEmail(
          req.session.data.dbinfo.email,
          current.coins
        );
      }

      if (
        coupon_info.memory ||
        coupon_info.disk ||
        coupon_info.cpu ||
        coupon_info.servers
      ) {
        if (coupon_info.memory) current.memory += coupon_info.memory;
        if (coupon_info.disk) current.disk += coupon_info.disk;
        if (coupon_info.cpu) current.cpu += coupon_info.cpu;
        if (coupon_info.servers) current.servers += coupon_info.servers;

        await process.db.setResourcesByEmail(
          req.session.data.dbinfo.email,
          current.memory,
          current.disk,
          current.cpu,
          current.servers
        );
      }

      functions.doRedirect(req, res, redirects.successfullyclaimedcoupon);

      suspendCheck(req.session.data.dbinfo.email);
    }
  );
};
