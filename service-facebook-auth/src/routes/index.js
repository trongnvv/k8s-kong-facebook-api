const router = require('express').Router();
const facebookRoute = require('./facebook.route');

/**
 * @swagger
 * /ping:
 *   get:
 *     description: It will return 'Pong' results
 *     tags: [Ping]
 *     security:
 *      - Bearer: []
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Service are running...
 */
router.get('/ping', async (req, res) => {
  res.json({ name: 'Service auth are running...', ping: 'PONG' });
});

router.use('/', facebookRoute);

module.exports = router;
