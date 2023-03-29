import { Sequelize } from "sequelize"
import {logger} from '../logger.js'
import dotenv from 'dotenv'
dotenv.config()

const databaseName = process.env.DATABASE_NAME
const username = process.env.DATABASE_USERNAME
const password = process.env.DATABASE_PASSWORD
const host = process.env.DATABASE_HOST
const dialect = process.env.DIALECT


export const sequelize = new Sequelize(databaseName,username,password,{
    dialect: dialect,
    host: host,
    logging: (message) => {logger.info(message)}
});


