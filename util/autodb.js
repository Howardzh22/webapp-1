import { Sequelize } from "sequelize"

export const sequelize = new Sequelize('accounts_app','root','12345678',{
    dialect: 'mysql',
    host: 'localhost',
});

