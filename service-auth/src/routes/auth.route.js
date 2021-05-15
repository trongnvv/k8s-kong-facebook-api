const router = require('express').Router();
const { isAuthenticated } = require('@trongnv/backend-helper');
const { validateInput, respond, wrapController } = require('@trongnv/backend-helper');
const { register, login } = require('../validations/auth.validation');
const authController = require('../controllers/auth.controller');

router.post('/register',
  validateInput(register),
  wrapController(authController.register),
  respond
);

router.post('/login',
  validateInput(login),
  wrapController(authController.login),
  respond
);

router.get('/user/info',
  wrapController(authController.getUserInfo),
  respond
);

module.exports = router;
