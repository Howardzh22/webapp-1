import { Sequelize } from "sequelize"

export const sequelize = new Sequelize('accounts_app','root','Csye6225@',{
    dialect: 'mysql',
    host: 'localhost',
});

