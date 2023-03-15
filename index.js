import express from 'express'
import bcrypt from'bcrypt'
import bodyParser from 'body-parser'

import {sequelize} from './util/autodb.js'
import crypto from 'crypto'

import {  createUser, getUserByName, getUser, updateUser } from './controlU.js'
import { addProduct, getProduct, updateProduct, deleteProduct } from './controlP.js'
import { uploadImage, deleteImage, getImage } from './controlI.js'



const app = express();

import multer from 'multer'

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })


import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import dotenv from 'dotenv'
dotenv.config()

const randomImageName = () => crypto.randomBytes(8).toString('hex')

const bucketName = process.env.BUCKET_NAME
const region = process.env.BUCKET_REGION
const accessKey = process.env.ACCESS_KEY
const secretAccessKey = process.env.SECRET_ACCESS_KEY

const s3 = new S3Client({
    region: region
})

 
sequelize.sync().then((result) => {
    //console.log(result[0]);
}).catch((error) => {
    console.log(error);
})

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }))




const authenticate = async (req,res,next)=>{


    if(!req.get('Authorization')){
        /*
        var err= new Error('Not Authenticated')
        
        res.status(403).set('WWW-Authenticate','Basic')
        next(err)
        */
        return res.status(403).json('Forbidden')
    }else {
        var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
        .toString()
        .split(':')
        var username = credentials[0]
        var Apassword = credentials[1]
        const user = await getUserByName(username)
        console.log(user[0].dataValues.account_password)
        //if not valid
        const match = await bcrypt.compare(Apassword,user[0].dataValues.account_password) ;
        if(!match){
            //var err  = new Error('Not Authenticated!')
            //set status
           /* 
           res.status(401).set('WWW-Authenticate','Basic')
            next(err) 
            */
            
            return res.status(401).json('Unauthorized')
        
        }
        else
        {res.status(200)
        next()}
    }
}

//get user account information
app.get("/v1/user/:id",authenticate, async (req,res) => {
    const id = req.params.id
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
    .toString()
    .split(':')
    var username = credentials[0]
    const gid = await getUserByName(username)
    if(id != gid[0].dataValues.id) res.status(403).json("forbidden")
    else
    {
    const user = await getUser(id)
    res.status(200).json(user)
    }
})

//Update User's account information
app.put("/v1/user/:id",authenticate, async (req,res) => {
    const id = req.params.id
    const { First_Name,Last_Name,account_password,username} = req.body;

    var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
    .toString()
    .split(':')
    var name = credentials[0]
    const gid = await getUserByName(name)
    if(id != gid[0].dataValues.id) res.status(403).json("forbidden")
    else
   { 
        const account = await updateUser(id,account_password,First_Name,Last_Name,username);
        if(!account)
        {
            res.status(204).json("No Content")
        }
        else{
            res.status(200).json(account)
        }
    }


})

//Add a new product
app.post("/v1/product",authenticate, async(req,res) =>{
    const {name,description,sku,manufacturer,quantity} = req.body
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
    .toString()
    .split(':')
    var username = credentials[0]
    const gid = await getUserByName(username)
    if(!name || !description || !sku || !manufacturer || !quantity) res.status(400).json("missing required fields")
    else if(quantity<=0 || quantity>100 ) res.status(400).json("bad request with wrong quantity")
    else
    {
        const product = await addProduct(name,description,sku,manufacturer,quantity,gid[0].dataValues.id)
        res.status(201).json(product)
    }
})

//update a product by put
app.put("/v1/product/:id",authenticate, async(req,res) =>{
    const id = req.params.id
    const {name,description,sku,manufacturer,quantity} = req.body
    const exist = await getProduct(id)
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
        .toString()
        .split(':')
        var username = credentials[0]
    const gid = await getUserByName(username)
    if(!name || !description || !sku || !manufacturer || !quantity) res.status(400).json("missing required fields")
    else if(!exist[0]) res.status(400).json("No product in this user")
    else if(gid[0].dataValues.id != exist[0].dataValues.owner_user_id) res.status(403).json("Forbidden")
    else if(quantity<=0 || quantity>100) res.status(400).json("bad request with wrong quantity")
    else 
    {
        const product = await updateProduct(id,name,description,sku,manufacturer,quantity)
        res.status(201).json(product)
    }
})


//update a product by patch
app.patch("/v1/product/:id",authenticate, async(req,res) =>{
    const id = req.params.id
    const {name,description,sku,manufacturer,quantity} = req.body
    const exist = await getProduct(id)
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
        .toString()
        .split(':')
        var username = credentials[0]
    const gid = await getUserByName(username)

    if(!exist[0]) res.status(400).json("No product in this user")
    else if(gid[0].dataValues.id != exist[0].dataValues.owner_user_id) res.status(403).json("Forbidden")
    else if(quantity<=0 || quantity>100) res.status(400).json("bad request with wrong quantity")
    else 
    {
        const product = await updateProduct(id,name,description,sku,manufacturer,quantity)
        res.status(201).json(product)
    }
})

//Delete Product
app.delete("/v1/product/:id", authenticate, async(req,res) =>{
    const id = req.params.id
    const exist = await getProduct(id)
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
        .toString()
        .split(':')
        var username = credentials[0]
    const gid = await getUserByName(username)

    if (!exist[0]) res.status(404).json("No product")
    else if (gid[0].dataValues.id != exist[0].dataValues.owner_user_id)  res.status(403).json("Forbidden")
    else 
    {
        deleteProduct(id)
        res.status(201).json("delete successfully")
    }
} )





//Health 
app.get("/healthz",async(req,res) =>{
    res.status(200).json("server responds with 200 OK if it is healhty.")
})

//create  user account
app.post("/v1/user", async(req,res) => {
    const{ username,account_password,First_Name,Last_Name } =req.body

    const valid = username.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi)
    const exist = await getUserByName(username)
    console.log(exist[0])
    console.log(valid)
    if(!exist[0] && valid)
    {
        const u = await createUser(username,account_password,First_Name,Last_Name)
        res.status(201).json(u)
    }
    else if(!valid) res.json("bad username")
    else
    {
       res.status(400).json('bad request')
    }
})

//Get Product Information
app.get("/v1/product/:id", async(req,res) =>{
    const id = req.params.id
    const product = await getProduct(id)
    res.status(200).json(product)
})

export const server = app.listen(8080,() => {
    console.log('Server is running on port 8080')
})

app.get('/v1/product/:id/image/:image_id',authenticate , async (req, res) => {
    const imageid = req.params.image_id
    const id = req.params.id
    const exist = await getProduct(id)
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
        .toString()
        .split(':')
        var username = credentials[0]
    const gid = await getUserByName(username)
    if(!exist[0]) res.status(400).json("bad request")
    else if(gid[0].dataValues.id != exist[0].dataValues.owner_user_id) res.status(403).json("Forbidden")
    else
    {
    const image = await getImage(imageid)
    res.status(200).json(image)
    }
})


app.post('/v1/product/:id/image',authenticate, upload.single('image'), async (req, res) => {
    const imageName = randomImageName()
    const id = req.params.id
    const params = {
      Bucket: bucketName,
      Body: req.file.buffer,
      Key: `${id}/${imageName}`,
      ContentType: req.file.mimetype
    }
    const commandp = new PutObjectCommand(params)
    await s3.send(commandp)

    const commandg = new GetObjectCommand(params);
    const url = await getSignedUrl(s3, commandg, { expiresIn: 60 });
    const exist = await getProduct(id)
      var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
          .toString()
          .split(':')
          var username = credentials[0]
    const gid = await getUserByName(username)
    if(!exist[0]) res.status(400).json("bad request")
    else if(gid[0].dataValues.id != exist[0].dataValues.owner_user_id) res.status(403).json("Forbidden")
    else
    {
      const post = await uploadImage(id,imageName,params.Key)
      res.status(200).json(post)}
  })
  
  app.delete('/v1/product/:id/image/:image_id',authenticate, async (req,res) => {
    const id = req.params.id
    const imageid = req.params.image_id
    const image = await getImage(imageid)

    const exist = await getProduct(id)
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
        .toString()
        .split(':')
        var username = credentials[0]
    const gid = await getUserByName(username)
    if(!exist[0] || !image[0]) res.status(400).json("bad request")
    else if(gid[0].dataValues.id != exist[0].dataValues.owner_user_id) res.status(403).json("Forbidden")
    else 
    {
        const imagename = image[0].dataValues.file_name
        const params = {
            Bucket: bucketName,
            Key: imagename
          }
          const command = new DeleteObjectCommand(params)
          await s3.send(command)

        await deleteImage(imageid)
        res.status(201).json("delete successfully!")
    }
  })