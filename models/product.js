import { DataTypes } from "sequelize"
import {sequelize } from '../util/autodb.js'

export const product = sequelize.define('product',{
    id: {
        type: DataTypes.INTEGER,
        allowNull :false,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sku: {
        type: DataTypes.STRING,
        allowNull: false,
        unique:true
    },
    manufacturer: {
        type: DataTypes.STRING,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    owner_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }


}, {tableName:'product',freezeTableName: true,timestamps: true
});



