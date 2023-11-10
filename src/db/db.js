import 'dotenv/config';
import bookshelf from 'bookshelf';
import knex from 'knex';

export const db = knex({
  client: 'pg',
  connection: {
    host : process.env.PGHOST,
    port : process.env.PGPORT,
    user : process.env.PGUSER,
    password : process.env.PGPASSWORD,
    database : process.env.PGDATABASE
  }
});

export const shelf = bookshelf(db);
