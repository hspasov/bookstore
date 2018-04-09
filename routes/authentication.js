const assert = require('assert');
const Router = require('koa-router');
const send = require('koa-send');

const router = new Router({ prefix: '/auth' });

router.post('/register', async (ctx, next) => {
  // todo: data format validation
  ctx.assert(ctx.request.body.username, 400);
  ctx.assert(ctx.request.body.password, 400);
  ctx.assert(ctx.request.body.country, 400);
  ctx.assert(ctx.request.body.address, 400);
  ctx.assert(ctx.request.body.phoneNumber, 400);
  ctx.assert(ctx.request.body.currency, 400);
  ctx.assert(ctx.request.body.dateOfBirth, 400);
  try {
    const result = await ctx.db.query(`SELECT username, created_at, success FROM register
      ($1, $2, $3, $4, $5, 0, $6, $7, NULL)
      AS (username VARCHAR(64), created_at TIMESTAMP, success BOOLEAN);`,
    [
      ctx.request.body.username,
      ctx.request.body.password,
      ctx.request.body.country,
      ctx.request.body.address,
      ctx.request.body.phoneNumber,
      ctx.request.body.currency,
      ctx.request.body.dateOfBirth
    ]);
    assert.strictEqual(result.rows.length, 1, 'User defined function \'register\' returned an invalid amount of ');
    if (result.rows[0].success) {
      console.log(`New user created at ${result.rows[0].created_at}`);
      ctx.status = 201;
    } else {
      ctx.status = 412;
    }
  } catch (error) {
    console.error(error);
    ctx.throw();
  }
});

router.get('/', async (ctx, next) => {
  await send(ctx, 'public/html/index.html');
});

module.exports = router;
