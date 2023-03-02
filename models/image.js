import { DataTypes, Sequelize } from "sequelize";
import {sequelize } from '../util/autodb.js'

export    const image = sequelize.define('image',{
    id: {
        type: DataTypes.INTEGER,
        allowNull :false,
        autoIncrement: true,
        primaryKey: true
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    file_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    
    s3_bucket_path: {
        type: DataTypes.STRING,
        allowNull: false
    },
    
}, {tableName:'image',freezeTableName: true});



