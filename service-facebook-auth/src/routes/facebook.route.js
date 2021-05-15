const router = require("express").Router();
const {
  validateInput,
  respond,
  wrapController,
  isAuthBasic,
  isAuthenticated
} = require("@trongnv/backend-helper");
const facebookValid = require("../validations/facebook.validation");
const userCtrl = require("../controllers/user.controller");
const pageCtrl = require("../controllers/page.controller");
const groupCtrl = require("../controllers/group.controller");
const commonCtrl = require("../controllers/common.controller");
const facebookMid = require("../middleware/facebook");

router.get(
  "/:pageID/picture/:psid",
  validateInput(facebookValid.picture),
  commonCtrl.getPicture,
);

router.post(
  "/get-object",
  validateInput(facebookValid.getObject),
  isAuthenticated,
  wrapController(commonCtrl.getObjectFBs),
  respond
);

router.get(
  "/accounts",
  isAuthenticated,
  wrapController(userCtrl.getFacebooks),
  respond
);

router.get(
  "/accounts/overall",
  isAuthenticated,
  wrapController(commonCtrl.getOverall),
  respond
);

router.post(
  "/accounts",
  validateInput(facebookValid.saveToken),
  isAuthenticated,
  facebookMid.checkExist,
  wrapController(userCtrl.saveToken),
  respond
);

router.get(
  "/accounts/:id",
  isAuthenticated,
  wrapController(userCtrl.getUserInfo),
  respond
);

router.get(
  "/private/accounts/:id",
  isAuthBasic,
  wrapController(userCtrl.getUserInfoBasicAuth),
  respond
);

router.get(
  "/accounts/:id/token",
  isAuthenticated,
  wrapController(userCtrl.getAccessTokenUser),
  respond
);

router.get(
  "/private/accounts/:id/token",
  isAuthBasic,
  wrapController(userCtrl.getAccessTokenUserPrivate),
  respond
);

router.delete(
  "/accounts/:id", // user fb id
  validateInput(facebookValid.removeAccount),
  isAuthenticated,
  wrapController(userCtrl.removeAccount),
  respond
);

router.delete(
  "/objects", // user fb id
  validateInput(facebookValid.removeObjects),
  isAuthenticated,
  wrapController(commonCtrl.removeObjects),
  respond
);

router.get(
  "/pages",
  isAuthenticated,
  validateInput(facebookValid.getPages),
  facebookMid.checkUserFB,
  wrapController(pageCtrl.getListPage),
  respond
);

router.get(
  "/pages/:id/token",
  validateInput(facebookValid.idValid),
  isAuthenticated,
  wrapController(pageCtrl.getAccessTokenPage),
  respond
);

router.get(
  "/private/pages/:id/token",
  isAuthBasic,
  wrapController(pageCtrl.getAccessTokenPagePrivate),
  respond
);

router.get(
  "/pages/:id",
  validateInput(facebookValid.idValid),
  isAuthenticated,
  wrapController(pageCtrl.getPageInfo),
  respond
);

router.get(
  "/private/pages/:id",
  isAuthBasic,
  wrapController(pageCtrl.getPageInfoBasicAuth),
  respond
);

router.get(
  "/private/pages/:pageFBID/by-fbid",
  isAuthBasic,
  wrapController(pageCtrl.gePageByPageFBIDPrivate),
  respond
);

router.get(
  "/pages/:pageFBID/by-fbid",
  isAuthenticated,
  wrapController(pageCtrl.gePageByPageFBID),
  respond
);

router.get(
  "/groups",
  validateInput(facebookValid.getPages),
  isAuthenticated,
  facebookMid.checkUserFB,
  wrapController(groupCtrl.getListGroups),
  respond
);

module.exports = router;
