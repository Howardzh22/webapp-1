import { user } from "./models/user.js"


import bcrypt from'bcrypt'


export async function createUser(username,account_password,First_Name,Last_Name){
    const salt = await bcrypt.genSaltSync(10);
    const hash = await bcrypt.hash(account_password,salt);
    
    const u = await user.create({
        username:username,
        account_password:hash,
        First_Name:First_Name,
        Last_Name:Last_Name
    })
    return u
}

export async function getUserByName(name){
    const u = await user.findAll({
        where:{
            username:name
        }
    })
    return u
}

export async function getUser(id){
    const u = await user.findAll({
        where:{
            id:id
        }
    })
    return u
}

export async function updateUser(id,account_password,First_Name,Last_Name,username){
    const salt = await bcrypt.genSaltSync(10);
    const hash = await bcrypt.hash(account_password,salt);
    
    const u = await user.update({
        id:id,
        account_password:hash,
        First_Name:First_Name,
        Last_Name:Last_Name
    },
    {
        where:{username:username}
    })
    const u1 = await user.findAll({
        where:{
            id:id
        }
    })
    return u1
}