const facebookService = require("../services/fb.service");
const HttpStatus = require("http-status-codes");
const { UserFacebookModel } = require('../models');

module.exports = {
  checkExist: async (req, res, next) => {
    try {
      const { user } = req;
      let { accessToken, code } = req.body;
      if (code) {
        const resTokenByCode = await facebookService.getAccessTokenByCode(code);
        if (!resTokenByCode || resTokenByCode.error)
          throw new Error("Code fail");
        accessToken = resTokenByCode.access_token;
      }

      // get long term access token on fb
      const userAccessToken = await facebookService.getLongAccessToken(accessToken);
      if (!userAccessToken || userAccessToken.error)
        throw new Error("AccessToken fail");
      accessToken = userAccessToken.access_token;

      // check user on fb || check token on fb
      const resUserFB = await facebookService.getUser(accessToken);
      if (!resUserFB || resUserFB.error) {
        next({
          success: false,
          code: HttpStatus.BAD_REQUEST,
          status: HttpStatus.BAD_REQUEST,
          message: "Token expired",
        });
        return;
      }

      const { email, name, id, link, accounts, picture } = resUserFB;
      const userFB = await UserFacebookModel.findOne({ userFacebookID: id, isRemoved: false });
      if (userFB && userFB.userID !== user.userId) throw new Error('Facebook account connected with another account');

      req.facebook = {
        email,
        name,
        accessToken,
        userLink: link,
        userFacebookID: id,
        accounts,
        picture: picture && picture.data && picture.data.url
      };

      next();
    } catch (error) {
      console.log("error", error.message);
      next({
        success: false,
        code: HttpStatus.BAD_REQUEST,
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
  },
  checkUserFB: async (req, res, next) => {
    try {
      const { user, db } = req;
      const { id: userFacebookID } = req.query;
      const facebook = await UserFacebookModel.findOne({
        userFacebookID,
        userID: user.userId,
        isRemoved: false
      });
      if (!facebook) throw new Error("Facebook not found");
      if (facebook.status == "EXPIRED") throw new Error("Account facebook expired");
      const resUserFB = await facebookService.getUser(facebook.accessToken);
      if (!resUserFB || resUserFB.error) {
        // check fb expired on fb
        await UserFacebookModel.updateOne(
          { userFacebookID },
          { status: "EXPIRED" }
        );
        next({
          success: false,
          code: HttpStatus.UNAUTHORIZED,
          status: HttpStatus.UNAUTHORIZED,
          message: "Account facebook expired",
        });
        return;
      }
      req.facebook = facebook;
      next();
    } catch (error) {
      console.log('checkUserFB: ',error);
      next({
        success: false,
        code: HttpStatus.BAD_REQUEST,
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
  },
};
