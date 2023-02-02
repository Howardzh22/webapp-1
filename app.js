import express from 'express'
import bcrypt from'bcrypt'

import { getAccounts, getAccount, getAccountByname, createAccount, createUser, updateAccount } from './database.js'

const app = express();



app.use(express.json())

const authenticate = async (req,res,next)=>{


    if(!req.get('Authorization')){
        /*var err= new Error('Not Authenticated')
        
        res.status(403).set('WWW-Authenticate','Basic')
        next(err)*/
        return res.status(403).json('Forbidden')
    }else {
        var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
        .toString()
        .split(':')
        var username = credentials[0]
        var Apassword = credentials[1]
        const psd = JSON.parse(JSON.stringify(await getAccountByname(username)));

        //if not valid
        const match = await bcrypt.compare(Apassword,psd['account_password']) ;
        //if(!(name === 'admin' && Apassword == 'admin123')){
        if(!match){
            //var err  = new Error('Not Authenticated!')
            //set status
           /* res.status(401).set('WWW-Authenticate','Basic')
            next(err) */
            
            return res.status(401).json('Unauthorized')
        
        }
        else
        {res.status(200)
        next()}
    }
}


/*
const create = async (body) =>{
    const {username,account_password,First_Name,Last_Name} = body;
    const hashedPassword = await bcrypt.hash(account_password,10);
    await createAccount({ username,hashedPassword,First_Name,Last_Name });
}
*/

app.post('/Authenticate', authenticate ,async (req,res) => {
    res.json('Protected route with Basic HTTP Authentication!')
})


//get user account information
app.get("/account/:id",authenticate, async (req,res) => {
    const id = req.params.id
    const account = await getAccount (id)
    res.status(200).json(account)
})


// update
app.put("/user/:id",authenticate, async (req,res) => {
    const { id,username,account_password,First_Name,Last_Name} = req.body;
    const account = await updateAccount(id,account_password,First_Name,Last_Name);
    if(!account)
    {
        res.status(204).json("No Content")
    }
    else{
        res.status(200).json(account)
    }


})


//healthy endpoint

app.get("/healthz",async(req,res) =>{
    res.status(200).json("server responds with 200 OK if it is healhty.")
})


app.post("/user", async (req,res) => {
    const { username,account_password,First_Name,Last_Name} = req.body;
    const user = await createUser(username,account_password,First_Name,Last_Name )
    res.status(201).json(user)
})



//create a user account
app.post("/accounts",async(req,res) => {
    const{ username,account_password,First_Name,Last_Name } =req.body

    const exist = await getAccountByname(username)
    if(!exist)
    {const account = await createAccount(username,account_password,First_Name,Last_Name )
    res.status(201).json(account)}
    else{
        res.status(400).json('bad request')
    }
})


export const server = app.listen(8080,() => {
    console.log('Server is running on port 8080')
})
