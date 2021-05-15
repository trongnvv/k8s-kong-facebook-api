const {
  UserFacebookModel,
  PageFacebookModel,
  GroupFacebookModel,
} = require('../models');
const HSC = require('http-status-codes');
const facebookService = require('../services/fb.service');
const { facebook: FACEBOOK_HOST } = require("../../config");
const mongoose = require('mongoose');
const axios = require('axios');
const { setCache, getCache } = require("@trongnv/backend-helper");

const getPicture = async (req, res, next) => {
  try {
    const key = `fb_picture_pageID_${req.params.pageID}_psid_${req.params.psid}`;
    let url = await getCache(key);
    if (!url) {
      const page = await PageFacebookModel.findById(req.params.pageID);
      if (!page) throw new Error();
      url = `${FACEBOOK_HOST}/${req.params.psid}/picture?type=large&access_token=${page.accessToken}`;
      setCache(key, url, 3600);
    }
    res.set('Content-Type', 'image/jpeg');
    await axios({ url: url, responseType: 'stream' })
      .then(r => r.data.pipe(res))
  } catch (error) {
    res.status(HSC.BAD_REQUEST).json({
      success: false,
      message: "Picture not found!"
    });
  }
}

const getObjectFBs = async (req, res, next) => {
  const { user } = req;
  let { ids } = req.body;
  const objectIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => mongoose.Types.ObjectId(id));
  let objects = [];
  const userFB = await UserFacebookModel.find({
    userFacebookID: { $in: ids },
    userID: user.userId,
    isRemoved: false
  }).lean();
  objects = objects.concat(userFB);

  let pages = await PageFacebookModel.find({
    _id: { $in: objectIds },
    userID: user.userId,
    isRemoved: false
  }).lean();
  objects = objects.concat(pages);

  let groups = await GroupFacebookModel
    .aggregate()
    .match({
      _id: { $in: objectIds },
      userID: user.userId,
      isRemoved: false
    })
    .lookup({
      from: UserFacebookModel.collection.collectionName,
      localField: 'userFacebookID',
      foreignField: 'userFacebookID',
      as: 'user'
    })
    .unwind('user')
    .addFields({
      accessToken: '$user.accessToken'
    })
    .project({
      user: 0
    });
  objects = objects.concat(groups);
  return objects;
};

const getOverall = async (req, res, next) => {
  const { isClone } = req.query;
  const { user } = req;
  if (isClone) await facebookService.clonePageMulti(req);
  const rs = await UserFacebookModel.aggregate()
    .match({ userID: user.userId, isRemoved: false })
    .sort({ createdAt: -1 })
    .project({
      accessToken: 0,
      createdAt: 0,
      updatedAt: 0,
      isRemoved: 0,
    })
    .lookup({
      from: PageFacebookModel.collection.collectionName,
      let: { userFacebookID: '$userFacebookID' },
      pipeline: [
        { $match: { $expr: { $eq: ['$$userFacebookID', '$userFacebookID'], }, isRemoved: false } },
        {
          $project: {
            accessToken: 0,
            createdAt: 0,
            isRemoved: 0,
            status: 0,
            updatedAt: 0
          }
        }
      ],
      as: 'pages'
    })
    .lookup({
      from: GroupFacebookModel.collection.collectionName,
      let: { userFacebookID: '$userFacebookID' },
      pipeline: [
        { $match: { $expr: { $eq: ['$$userFacebookID', '$userFacebookID'], }, isRemoved: false } },
        {
          $project: {
            createdAt: 0,
            isRemoved: 0,
            updatedAt: 0
          }
        }
      ],
      as: 'groups'
    })
  return rs;
};

const removeObjects = async (req, res, next) => {
  const { user } = req;
  const { ids } = req.body;
  const objectIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => mongoose.Types.ObjectId(id));
  PageFacebookModel.updateMany({
    _id: { $in: objectIds },
    userID: user.userId,
    isRemoved: false
  }, { isRemoved: true }).exec();
  GroupFacebookModel.updateMany({
    _id: { $in: objectIds },
    userID: user.userId,
    isRemoved: false
  }, { isRemoved: true }).exec();
};

module.exports = {
  getPicture,
  getObjectFBs,
  getOverall,
  removeObjects,
};
