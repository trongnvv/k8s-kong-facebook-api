const express = require('express');
const cors = require('cors');

const {
  health,
  bundle,
  notFoundHandle,
  errorHandle,
  tracing,
  initTracer,
} = require('@trongnv/backend-helper');

const routers = require('./src/routes');

const app = express();
const logger = require('morgan'); // log access route
/**
 * Passport
 */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 *  Logging Http Request.
 */
app.use(logger('dev'));

/**
 *  Healthz check, metrics
 */
app.use([health, bundle]);

/**
 *  Tracing api
 */
app.use(tracing(initTracer('service_auth')));

app.use(`/${process.env.ROUTING}`, routers);
app.use([notFoundHandle, errorHandle]);

// require('./config/db');

module.exports = app;
