const Koa = require('koa');
const logger = require('koa-logger');
const bodyParser = require('koa-body');
const serve = require('koa-static');
const { Pool } = require('pg');
const path = require('path');
const routes = require('./routes');

// Create app
const app = new Koa();

// Create a database connection pool
const pool = new Pool({
  user: process.env.PGUSER,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT
});

app.use(logger());
app.use(bodyParser());
app.use(serve(path.join(__dirname, 'public')));

app.context.db = pool;
app.use(routes);

app.listen(3000);

console.log('Listening on 3000...');
