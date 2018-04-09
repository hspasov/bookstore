const { Client } = require('pg');

console.log('Creating new superuser client...');
let superuser = new Client({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT
});

let superuserNewDB;
let newUser;

console.log('Connecting superuser...');
superuser.connect().then(() => {
  console.log('If selected new database exists, dropping...');
  return superuser.query(`DROP DATABASE IF EXISTS ${process.env.NEWDATABASE};`);
}).then(() => {
  console.log('If selected new user exists, dropping...');
  return superuser.query(`DROP USER IF EXISTS ${process.env.NEWUSER};`);
}).then(() => {
  console.log('Creating selected new user...');
  return superuser.query(`CREATE USER ${process.env.NEWUSER} WITH ENCRYPTED PASSWORD '${process.env.NEWPASSWORD}';`);
}).then(() => {
  console.log('Creating selected new database...');
  return superuser.query(`CREATE DATABASE ${process.env.NEWDATABASE} WITH OWNER ${process.env.NEWUSER};`);
}).then(() => {
  console.log('Creating new superuser client with connection to new database...');
  superuserNewDB = new Client({
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.NEWDATABASE,
    port: process.env.PGPORT
  });

  console.log('Connecting superuser to new database...');
  return superuserNewDB.connect();
}).then(() => {
  console.log('Adding pgcrypto extension...');
  return superuserNewDB.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
}).then(() => {
  console.log('Creating new user client...');
  newUser = new Client({
    user: process.env.NEWUSER,
    password: process.env.NEWPASSWORD,
    database: process.env.NEWDATABASE,
    port: process.env.PGPORT
  });

  console.log('Connecting new user...');
  return newUser.connect();
}).then(() => {
  console.log('Creating countries type...');
  return newUser.query(`CREATE TYPE country AS ENUM
    ('Bulgaria',
    'United Kingdom',
    'United States');`);
}).then(() => {
  console.log('Creating currency type...');
  return newUser.query(`CREATE TYPE currency AS ENUM
    ('BGN',
    'GBP',
    'USD');`);
}).then(() => {
  console.log('Creating order_state type...');
  return newUser.query(`CREATE TYPE order_state AS ENUM
    ('to_be_dispatched',
    'dispatched',
    'transit',
    'delivered',
    'received');`);
}).then(() => {
  console.log('Creating rating type...');
  return newUser.query(`CREATE TYPE rating AS ENUM
    ('terrible',
    'bad',
    'average',
    'good',
    'excellent');`);
}).then(() => {
  console.log('Creating table users...');
  return newUser.query(`CREATE TABLE users (
    id SERIAL PRIMARY KEY NOT NULL,
    username VARCHAR(64) NOT NULL,
    password TEXT NOT NULL,
    country country NOT NULL,
    address TEXT NOT NULL,
    phone_number VARCHAR(16) NOT NULL,
    balance NUMERIC(16, 2) NOT NULL DEFAULT 0,
    currency currency NOT NULL DEFAULT 'USD',
    date_of_birth DATE NOT NULL,
    image VARCHAR(256),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL);`);
}).then(() => {
  console.log('Creating table categories...');
  return newUser.query(`CREATE TABLE categories (
    id SERIAL PRIMARY KEY NOT NULL,
    label VARCHAR(64) NOT NULL);`);
}).then(() => {
  console.log('Creating table genres...');
  return newUser.query(`CREATE TABLE genres (
    id SERIAL PRIMARY KEY NOT NULL,
    label VARCHAR(64) NOT NULL);`);
}).then(() => {
  console.log('Creating table items...');
  return newUser.query(`CREATE TABLE items (
    id SERIAL PRIMARY KEY NOT NULL,
    title VARCHAR(128) NOT NULL,
    description TEXT,
    price NUMERIC(16, 2) NOT NULL,
    currency currency NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL);`);
}).then(() => {
  console.log('Creating table comments...');
  return newUser.query(`CREATE TABLE comments (
    id SERIAL PRIMARY KEY NOT NULL,
    item_id INTEGER NOT NULL REFERENCES items ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL);`);
}).then(() => {
  console.log('Creating table user_items...');
  return newUser.query(`CREATE TABLE user_items (
    id SERIAL PRIMARY KEY NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items ON DELETE CASCADE,
    state order_state NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL);`);
}).then(() => {
  console.log('Creating table ratings...');
  return newUser.query(`CREATE TABLE ratings (
    id SERIAL PRIMARY KEY NOT NULL,
    item_id INTEGER NOT NULL REFERENCES items ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users ON DELETE CASCADE,
    rating rating NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL);`);
}).then(() => {
  console.log('Creating table book_genres...');
  return newUser.query(`CREATE TABLE book_genres (
    item_id INTEGER NOT NULL REFERENCES items ON DELETE CASCADE,
    genre_id INTEGER NOT NULL REFERENCES genres,
    PRIMARY KEY(item_id, genre_id));`);
}).then(() => {
  console.log('Creating table item_images...');
  return newUser.query(`CREATE TABLE item_images (
    id SERIAL PRIMARY KEY NOT NULL,
    item_id INTEGER NOT NULL REFERENCES items ON DELETE CASCADE,
    file_name VARCHAR(256) NOT NULL);`);
}).then(() => {
  console.log('Creating function register...');
  return newUser.query(`CREATE OR REPLACE FUNCTION register (
    _username VARCHAR(64),
    _password TEXT,
    _country country,
    _address TEXT,
    _phone_number VARCHAR(16),
    _balance NUMERIC(16, 2),
    _currency currency,
    _date_of_birth DATE,
    _image VARCHAR(256)
  ) RETURNS RECORD AS $$
    DECLARE
      user RECORD;
    BEGIN
      SELECT INTO user username, created_at, FALSE from users
      WHERE users.username = _username;
      IF FOUND THEN
        RETURN user;
      ELSE
        INSERT INTO users (
          username,
          password,
          country,
          address,
          phone_number,
          balance,
          currency,
          date_of_birth,
          image,
          created_at,
          updated_at
        ) VALUES (
          _username,
          crypt(_password, gen_salt('bf', 8)),
          _country,
          _address,
          _phone_number,
          _balance,
          _currency,
          _date_of_birth,
          _image,
          now(),
          now()
        ) RETURNING username, created_at, TRUE INTO user;
        RETURN user;
      END IF;
    END$$ LANGUAGE plpgsql;`);
}).then(() => {
  console.log('Creating function login...');
  return newUser.query(`CREATE OR REPLACE FUNCTION login (
    _username VARCHAR(64),
    _password TEXT
  ) RETURNS RECORD AS $$
    DECLARE
      user RECORD;
    BEGIN
      SELECT INTO user username, TRUE from users
      WHERE users.username = _username AND
      users.password = crypt(_password, users.password);
      IF FOUND THEN
        RETURN user;
      ELSE
        RETURN (''::VARCHAR(64), FALSE);
      END IF;
    END$$ LANGUAGE plpgsql;`);
}).then(async () => {
  if (superuser) {
    await superuser.end();
  }
  if (superuserNewDB) {
    await superuserNewDB.end();
  }
  if (newUser) {
    await newUser.end();
  }
}).catch(async error => {
  console.error(error);
  if (superuser) {
    await superuser.end();
  }
  if (superuserNewDB) {
    await superuserNewDB.end();
  }
  if (newUser) {
    await newUser.end();
  }
});
