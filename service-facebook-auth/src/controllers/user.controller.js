const {
  UserFacebookModel,
  PageFacebookModel,
  GroupFacebookModel,
} = require('../models');
const HSC = require('http-status-codes');
const facebookService = require('../services/fb.service');

const getFacebooks = async (req, res, next) => {
  const { user } = req;
  let listUserFB = await UserFacebookModel
    .find({
      userID: user.userId,
      isRemoved: false
    })
    .sort({ createdAt: -1 })
    .select({
      __v: 0,
      createdAt: 0,
      updatedAt: 0,
      isRemoved: 0,
    })
    .lean();
  const listUnavailableID = [];
  for (const userFB of listUserFB) {
    if (userFB.status === "EXPIRED") continue;
    const resUserFB = await facebookService.getUser(userFB.accessToken);
    if (!resUserFB || resUserFB.error) {
      // check fb expired on fb
      listUnavailableID.push(userFB.userFacebookID);
    }
  }
  if (listUnavailableID.length > 0) {
    // update response
    listUserFB = listUserFB.map(v => {
      return {
        ...v,
        accessToken: undefined,
        status: listUnavailableID.includes(v.userFacebookID) ? "EXPIRED" : "SUBSCRIBE"
      }
    });
    // update db
    UserFacebookModel.updateMany(
      { userFacebookID: { $in: listUnavailableID } },
      { status: "EXPIRED" }
    ).exec();
  }
  listUserFB = listUserFB.map(v => {
    return {
      ...v,
      accessToken: undefined
    }
  });
  return listUserFB;
};

const saveToken = async (req, res, next) => {
  const { user, facebook } = req;
  const userFB = await UserFacebookModel.findOneAndUpdate(
    {
      userFacebookID: facebook.userFacebookID,
    },
    {
      isRemoved: false,
      userID: user.userId,
      status: 'SUBSCRIBE',
      userFacebookName: facebook.name,
      userFacebookEmail: facebook.email,
      accessToken: facebook.accessToken,
      userLink: facebook.userLink,
      userFacebookPicture: facebook.picture
    },
    { new: true, upsert: true }
  );
  // cache 
  facebookService.cacheUserToken(req, facebook);
  await facebookService.clonePage(req, facebook.accounts && facebook.accounts.data);
  await facebookService.cloneGroups(req);
  return userFB;
};

const getUserInfo = async (req, res, next) => {
  const { id: userFacebookID } = req.params;
  const userFB = await UserFacebookModel.findOne({ userFacebookID, userID: req.user.userId });
  if (!userFB) return next({
    status: HSC.BAD_REQUEST,
    message: 'User facebook not found!'
  })
  return userFB;
};

const getUserInfoBasicAuth = async (req, res, next) => {
  const { id: userFacebookID } = req.params;
  const userFB = await UserFacebookModel.findOne({ userFacebookID });
  if (!userFB) return next({
    status: HSC.BAD_REQUEST,
    message: 'User facebook not found!'
  })
  return userFB;
};

const getAccessTokenUser = async (req, res, next) => {
  const { id: userFacebookID } = req.params;
  const userFB = await UserFacebookModel.findOne({ userFacebookID, userID: req.user.userId });
  if (!userFB) return next({
    status: HSC.BAD_REQUEST,
    message: 'User facebook not found!'
  })
  return userFB.accessToken;
};

const getAccessTokenUserPrivate = async (req, res, next) => {
  const { id: userFacebookID } = req.params;
  const userFB = await UserFacebookModel.findOne({ userFacebookID });
  if (!userFB) return next({
    status: HSC.BAD_REQUEST,
    message: 'User facebook not found!'
  })
  return userFB.accessToken;
};

const removeAccount = async (req, res, next) => {
  const { user, db } = req;
  const { id: userFacebookID } = req.params;
  const facebook = await UserFacebookModel.find({
    userID: user.userId,
    userFacebookID,
    isRemoved: false
  });
  if (!facebook) {
    next({
      success: false,
      code: HttpStatus.BAD_REQUEST,
      status: HttpStatus.BAD_REQUEST,
      message: 'Account facebook not found'
    });
    return;
  }
  UserFacebookModel.updateOne({ userFacebookID }, { isRemoved: true }).exec();
  PageFacebookModel.updateMany({ userFacebookID }, { isRemoved: true }).exec();
  GroupFacebookModel.updateMany({ userFacebookID }, { isRemoved: true }).exec();
};

module.exports = {
  getFacebooks,
  saveToken,
  getUserInfo,
  getUserInfoBasicAuth,
  getAccessTokenUser,
  getAccessTokenUserPrivate,
  removeAccount,
};
