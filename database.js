import mysql from 'mysql2'
import bcrypt from 'bcrypt'

import dotenv from 'dotenv'
dotenv.config()

const pool = mysql.createPool({
    host:process.env.MYSQL_HOST,
    user:process.env.MYSQL_USER,
    password:process.env.MYSQL_PASSWORD,
    database:process.env.MYSQL_DATABASE
}).promise()

export async function getAccounts()
{
    const [rows] = await pool.query("select username,First_Name,Last_Name from accounts")
    return rows
}

export async function getAccount(id){
    const [rows] = await pool.query(`
    SELECT  username,First_Name,Last_Name,account_created,account_updated
    FROM accounts
    WHERE id = ?
    `,[id])
    return rows[0];
}

export async function getAccountByname(username){
    const [rows] = await pool.query(`
    SELECT  account_password
    FROM accounts
    WHERE username = ?
    `,[username])
    return rows[0];
}


export async function createAccount(username,account_password,First_Name,Last_Name){
    const [result] = await pool.query(`
    INSERT INTO accounts(username,account_password,First_Name,Last_Name)
    VALUES(?,?,?,?)
    `,[username,account_password,First_Name,Last_Name])
    const id = result.insertId
    return getAccount(id)
}


export async function updateAccount(id,account_password,First_Name,Last_Name){
    const [update] = await pool.query(`
    UPDATE accounts set account_password=?,First_Name=?,Last_Name=?
    WHERE id =?
    `,[account_password,First_Name,Last_Name,id])
    return getAccount(id);

}


export async function createUser(username,account_password,First_Name,Last_Name){
    const salt = await bcrypt.genSaltSync(10);
    const hash = await bcrypt.hash(account_password,salt);
    
    const [result] = await pool.query(`
    INSERT INTO accounts(username,account_password,First_Name,Last_Name)
    VALUES(?,?,?,?)
    `,[username,hash,First_Name,Last_Name])
    const id = result.insertId
    return getAccount(id)
    
}



