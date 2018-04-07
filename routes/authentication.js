const Router = require('koa-router');
const send = require('koa-send');

const router = new Router({ prefix: '/' });

router.get('/', async (ctx, next) => {
  await send(ctx, 'public/html/index.html');
});

module.exports = router;
