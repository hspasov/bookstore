const Koa = require('koa');
const logger = require('koa-logger');
const bodyParser = require('koa-body');
const serve = require('koa-static');
const path = require('path');
const routes = require('./routes');

const app = new Koa();

app.use(logger());
app.use(bodyParser());
app.use(serve(path.join(__dirname, 'public')));

app.use(routes);

app.listen(3000);

console.log('Listening on 3000...');
