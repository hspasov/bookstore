const Koa = require('koa');
const logger = require('koa-logger');
const bodyParser = require('koa-body');
const Router = require('koa-router');
const serve = require('koa-static');
const path = require('path');

const app = new Koa();
const router = new Router();

app.use(logger());
app.use(bodyParser());
app.use(serve(path.join(__dirname, 'public')));

router.get('/', async (ctx, next) => {
  ctx.body = 'Hello world';
});

app.use(router.routes());

app.listen(3000);
