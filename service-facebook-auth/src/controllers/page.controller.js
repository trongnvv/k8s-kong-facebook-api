const {
  PageFacebookModel,
} = require('../models');
const HSC = require('http-status-codes');
const facebookService = require('../services/fb.service');

const gePageByPageFBIDPrivate = async (req, res, next) => {
  const page = await PageFacebookModel
    .find({ pageFacebookID: req.params.pageFBID, isRemoved: false })
    .sort({ 'updatedAt': -1 })
    .lean();
  return page;
}

const gePageByPageFBID = async (req, res, next) => {
  const page = await PageFacebookModel
    .find({ pageFacebookID: req.params.pageFBID, isRemoved: false, userID: req.user.userId })
    .sort({ 'updatedAt': -1 })
    .lean();
  return page;
}

const getListPage = async (req, res, next) => {
  const { facebook, user } = req;
  const { isClone } = req.query;
  if (isClone) await facebookService.clonePage(req);
  const pages = await PageFacebookModel.find({
    userID: user.userId,
    userFacebookID: facebook.userFacebookID,
    isRemoved: false
  })
    .sort({ createdAt: -1 })
    .select({
      accessToken: 0,
      __v: 0,
      createdAt: 0,
      updatedAt: 0,
      isRemoved: 0,
    })
    .lean();
  return pages;
};

const getAccessTokenPage = async (req, res, next) => {
  const { id: pageID } = req.params;
  const rs = await PageFacebookModel.findOne({
    _id: mongoose.Types.ObjectId(pageID),
    userID: req.user.userId
  });
  if (!rs) return next({
    status: HSC.BAD_REQUEST,
    message: 'Page facebook not found!'
  })
  return rs.accessToken;
};

const getAccessTokenPagePrivate = async (req, res, next) => {
  const { id: pageID } = req.params;
  const rs = await PageFacebookModel.findOne({
    _id: mongoose.Types.ObjectId(pageID)
  });
  if (!rs) return next({
    status: HSC.BAD_REQUEST,
    message: 'Page facebook not found!'
  })
  return rs.accessToken;
};

const getPageInfo = async (req, res, next) => {
  const { id: pageID } = req.params;
  const rs = await PageFacebookModel.findOne({
    _id: mongoose.Types.ObjectId(pageID),
    userID: req.user.userId
  });
  if (!rs) return next({
    status: HSC.BAD_REQUEST,
    message: 'Page facebook not found!'
  });
  return rs;
};

const getPageInfoBasicAuth = async (req, res, next) => {
  const { id: pageID } = req.params;
  const rs = await PageFacebookModel.findById(pageID);
  if (!rs) return next({
    status: HSC.BAD_REQUEST,
    message: 'Page facebook not found!'
  });
  return rs;
};

module.exports = {
  gePageByPageFBID,
  gePageByPageFBIDPrivate,
  getListPage,
  getAccessTokenPage,
  getAccessTokenPagePrivate,
  getPageInfo,
  getPageInfoBasicAuth,
};
