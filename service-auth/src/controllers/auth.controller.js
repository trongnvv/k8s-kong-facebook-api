const hsc = require("http-status-codes");
const { jwtHandle, bcryptHandle, errorCustom } = require('../utils');
const { UserModel } = require('../models')
module.exports = {
  register: async (req, res, next) => {
    const { username, password, confirmPassword } = req.body;
    if (password !== confirmPassword) return next({
      status: hsc.BAD_REQUEST,
      message: 'Confirm password wrong'
    })
    if (await UserModel.findOne({ username }))
      return next({
        status: hsc.BAD_REQUEST,
        message: 'Account existed'
      })
    const user = await UserModel.create({
      username,
      password: await bcryptHandle.encrypt(password),
    });

    const accessToken = jwtHandle.sign({
      userID: user._id,
      username
    });
    req.message = 'Regist success!';
    return {
      accessToken: 'Bearer ' + accessToken,
      userID: user._id,
      username
    };
  },
  login: async (req, res, next) => {
    const { username, password } = req.body;
    const user = await UserModel.findOne({ username });
    if (!user) return next({
      status: hsc.BAD_REQUEST,
      message: `Account wasn't existed`
    })
    const checkPass = await bcryptHandle.compare(password, user.password);
    if (!checkPass) return next({
      status: hsc.BAD_REQUEST,
      message: 'Password wrong!'
    })

    const accessToken = jwtHandle.sign({
      userID: user._id,
      username: user.username,
    });
    req.message = 'Login success!';
    return {
      accessToken: 'Bearer ' + accessToken,
      userID: user._id,
      username: user.username,
    };
  },
  getUserInfo: async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) return next({
      status: hsc.FORBIDDEN,
      message: hsc.getStatusText(hsc.FORBIDDEN)
    })
    const [tokenType, accessToken] = authorization.split(' ');
    if (tokenType !== 'Bearer')
      return next({
        status: hsc.BAD_REQUEST,
        message: 'Access token invalid'
      })
    const data = await jwtHandle.verify(accessToken);
    const { userID, iat, exp } = data;
    if (!userID || iat > exp) return next({
      status: hsc.UNAUTHORIZED,
      message: 'Access token expired'
    })
    const user = await UserModel.findById(userID).select({ createdAt: 0, updatedAt: 0, password: 0 }).lean();
    return user
  }
};
