const combineRouters = require('koa-combine-routers');
const authentication = require('./authentication');

module.exports = combineRouters([authentication]);
