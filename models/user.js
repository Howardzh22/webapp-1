import { DataTypes } from "sequelize";
import {sequelize } from '../util/autodb.js'

export    const user = sequelize.define('user',{
    id: {
        type: DataTypes.INTEGER,
        allowNull :false,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    account_password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    First_Name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Last_Name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {tableName:'user',freezeTableName: true});



