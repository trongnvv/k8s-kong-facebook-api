
const {
  GroupFacebookModel,
} = require('../models');
const facebookService = require('../services/fb.service');

const getListGroups = async (req, res, next) => {
  const { facebook, user } = req;
  const { isClone } = req.query;
  if (isClone) await facebookService.cloneGroups(req);
  const rs = await GroupFacebookModel.find({
    userID: user.userId,
    userFacebookID: facebook.userFacebookID,
    isRemoved: false
  })
    .sort({ createdAt: -1 })
    .select('groupFacebookID userFacebookID name')
    .lean();
  return rs;
};

module.exports = {
  getListGroups
};
