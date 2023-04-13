import express from 'express'
import bcrypt from'bcrypt'
import bodyParser from 'body-parser'

import {sequelize} from './util/autodb.js'
import crypto from 'crypto'

import {  createUser, getUserByName, getUser, updateUser } from './controlU.js'
import { addProduct, getProduct, updateProduct, deleteProduct } from './controlP.js'
import { uploadImage, deleteImage, getImage, getImageByProduct } from './controlI.js'
import { logger } from './logger.js'
import StatsD from 'node-statsd'

const host = process.env.DATABASE_HOST
const statsd = new StatsD({ port: 8125, globalize: 'true'});

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
    //delete credentials  
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

        logger.error("Forbidden")
        return res.status(403).json('Forbidden')
    }else {
        var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
        .toString()
        .split(':')
        var username = credentials[0]
        var Apassword = credentials[1]
        const user = await getUserByName(username)
        if(!user)
        logger.error("Unauthorized")
            return res.status(404).json('user not found')
        //if not valid
        const match = await bcrypt.compare(Apassword,user[0].dataValues.account_password) ;
        if(!match){
            logger.error("Unauthorized")
            return res.status(401).json('Unauthorized')
        
        }
        else
        {
            res.status(200)
            next()
        }
    }
}

//get user account information
app.get("/v1/user/:id",authenticate, async (req,res) => {
    statsd.increment('get user')
    const id = req.params.id
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
    .toString()
    .split(':')
    var username = credentials[0]
    const gid = await getUserByName(username)
    if(id != gid[0].dataValues.id) 
    {
        res.status(403).json("Forbidden")
        logger.error("Forbidden")
    }
    else
    {
        const user = await getUser(id)
        res.status(200).json(user)
        logger.info("get user")
    }
})

//Update User's account information
app.put("/v1/user/:id",authenticate, async (req,res) => {
    statsd.increment('update user')
    const id = req.params.id
    const { First_Name,Last_Name,account_password,username} = req.body;

    var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
    .toString()
    .split(':')
    var name = credentials[0]
    const gid = await getUserByName(name)
    if(id != gid[0].dataValues.id) 
    {
        res.status(403).json("Forbidden")
        logger.error("Forbidden")
    }
    else
   { 
        const account = await updateUser(id,account_password,First_Name,Last_Name,username);
        if(!account)
        {
            res.status(404).json("No Content")
            logger.info("No Content")
        }
        else{
            res.status(200).json(account)
            logger.info("update user")
        }
    }


})

//Add a new product
app.post("/v1/product",authenticate, async(req,res) =>{
    statsd.increment('add product')
    const {name,description,sku,manufacturer,quantity} = req.body
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
    .toString()
    .split(':')
    var username = credentials[0]
    const gid = await getUserByName(username)
    if(!name || !description || !sku || !manufacturer || !quantity) 
    {
        res.status(400).json("missing required fields")
        logger.error("missing required fields")
    }
    else if(quantity<=0 || quantity>100 ) 
    {
        res.status(400).json("bad request with wrong quantity")
        logger.error("bad request with wrong quantity")
    }
    else
    {
        const product = await addProduct(name,description,sku,manufacturer,quantity,gid[0].dataValues.id)
        res.status(201).json(product)
        logger.info("add a product")
    }
})

//update a product by put
app.put("/v1/product/:id",authenticate, async(req,res) =>{
    statsd.increment('update product1')
    const id = req.params.id
    const {name,description,sku,manufacturer,quantity} = req.body
    const exist = await getProduct(id)
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
        .toString()
        .split(':')
        var username = credentials[0]
    const gid = await getUserByName(username)
    if(!name || !description || !sku || !manufacturer || !quantity) 
    {
        res.status(400).json("missing required fields")
        logger.error("missing required fields")
    }
    else if(!exist[0]) 
    {
        res.status(400).json("No product in this user")
        logger.error("No product in this user")
    }
    else if(gid[0].dataValues.id != exist[0].dataValues.owner_user_id) 
    {
        res.status(403).json("Forbidden")
        logger.error("Forbidden")
    }
    else if(quantity<=0 || quantity>100) res.status(400).json("bad request with wrong quantity")
    else 
    {
        const product = await updateProduct(id,name,description,sku,manufacturer,quantity)
        res.status(201).json(product)
        logger.info("update a product")
    }
})


//update a product by patch
app.patch("/v1/product/:id",authenticate, async(req,res) =>{
    statsd.increment('update product2')
    const id = req.params.id
    const {name,description,sku,manufacturer,quantity} = req.body
    const exist = await getProduct(id)
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
        .toString()
        .split(':')
        var username = credentials[0]
    const gid = await getUserByName(username)

    if(!exist[0]) res.status(400).json("No product in this user")
    else if(gid[0].dataValues.id != exist[0].dataValues.owner_user_id) 
    {
        res.status(403).json("Forbidden")
        logger.error("Forbidden")
    }
    else if(quantity<=0 || quantity>100) 
    {
        res.status(400).json("bad request with wrong quantity")
        logger.error("bad request with wrong quantity")
    }
    else 
    {
        const product = await updateProduct(id,name,description,sku,manufacturer,quantity)
        res.status(201).json(product)
        logger.info("update product")
    }
})

//Delete Product
app.delete("/v1/product/:id", authenticate, async(req,res) =>{
    statsd.increment('delete product')
    const id = req.params.id
    const exist = await getProduct(id)
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
        .toString()
        .split(':')
        var username = credentials[0]
    const gid = await getUserByName(username)

    if (!exist[0]) 
    {
        res.status(404).json("No product")
        logger.error("No product")
    }
    else if (gid[0].dataValues.id != exist[0].dataValues.owner_user_id) 
    {
        res.status(403).json("Forbidden")
        logger.error("Forbidden")
    }
    else 
    {
        deleteProduct(id)
        res.status(201).json("delete successfully")
        logger.info("delete successfully")
    }
} )





//Health 
app.get("/healthz",async(req,res) =>{
    res.status(200).json("server responds with 200 OK if it is healhty.")
    logger.info("healthy")
    statsd.increment('get healthy')
})

//create  user account
app.post("/v1/user", async(req,res) => {
    statsd.increment('create user')
    const{ username,account_password,First_Name,Last_Name } =req.body

    const valid = username.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi)
    const exist = await getUserByName(username)
    console.log(exist[0])
    console.log(valid)
    if(!exist[0] && valid)
    {
        const u = await createUser(username,account_password,First_Name,Last_Name)
        res.status(201).json(u)
        logger.info("create a new user")
    }
    else if(!valid) 
    {
        res.status(400).json("bad username")
        logger.error("bad username")
    }
    else
    {
       res.status(400).json('bad request')
       logger.error("bad request")
    }
})

//Get Product Information
app.get("/v1/product/:id", async(req,res) =>{
    statsd.increment('get product')
    const id = req.params.id
    const product = await getProduct(id)
    res.status(200).json(product)
    logger.info("get a product")
})

export const server = app.listen(8080,() => {
    console.log('Server is running on port 8080')
})

//Get Image Information
app.get('/v1/product/:id/image/:image_id',authenticate , async (req, res) => {
    statsd.increment('get image')
    const imageid = req.params.image_id
    const id = req.params.id
    const exist = await getProduct(id)
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
        .toString()
        .split(':')
        var username = credentials[0]
    const gid = await getUserByName(username)
    if(!exist[0]) 
    {
        res.status(400).json("bad request")
        logger.error("bad request")
    }
    else if(gid[0].dataValues.id != exist[0].dataValues.owner_user_id) 
    {
        res.status(403).json("Forbidden")
        logger.error("Forbidden")
    }
    else
    {
        const image = await getImage(imageid)
        res.status(200).json(image)
        logger.info("get a image!")
    }
})

//Get All Image Information
app.get('/v1/product/:id/image',authenticate , async (req, res) => {
    statsd.increment('get all image')
    const id = req.params.id
    const exist = await getProduct(id)
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
        .toString()
        .split(':')
        var username = credentials[0]
    const gid = await getUserByName(username)
    if(!exist[0]) 
    {
        res.status(400).json("bad request")
        logger.error("bad request")
    }
    else if(gid[0].dataValues.id != exist[0].dataValues.owner_user_id) 
    {
        res.status(403).json("Forbidden")
        logger.error("Forbidden")
    }
    else
    {
        const image = await getImageByProduct(id)
        res.status(200).json(image)
        logger.info("get all image")
    }
})

//Upload an Image
app.post('/v1/product/:id/image',authenticate, upload.single('image'), async (req, res) => {
    statsd.increment('upload image')
    const imageName = randomImageName()
    const id = req.params.id
    const filetype =/jpeg|jpg|png/
    const exname = req.file.originalname
    if(filetype.test(exname.toLowerCase()))
    {
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
        if(!exist[0]) 
        {
            res.status(400).json("bad request")
            logger.error("bad request")
        }
        else if(gid[0].dataValues.id != exist[0].dataValues.owner_user_id) 
        {
            res.status(403).json("Forbidden")
            logger.error("Forbidden")
        }
        else
        {
            const post = await uploadImage(id,imageName,params.Key)
            res.status(200).json(post)
            logger.info("upload image")
        }
    }
    else
    {
        res.status(400).json("bad request")
        logger.error("bad request")
    }
  })
  
  //Delete an Image
  app.delete('/v1/product/:id/image/:image_id',authenticate, async (req,res) => {
    statsd.increment('delete image')
    const id = req.params.id
    const imageid = req.params.image_id
    const image = await getImage(imageid)

    const exist = await getProduct(id)
    var credentials = Buffer.from(req.get('Authorization').split(' ')[1],'base64')
        .toString()
        .split(':')
        var username = credentials[0]
    const gid = await getUserByName(username)
    if(!exist[0] || !image[0]) 
    {
        res.status(400).json("bad request")
        logger.error("bad request")
    }
    else if(gid[0].dataValues.id != exist[0].dataValues.owner_user_id) 
    {
        res.status(403).json("Forbidden")
        logger.error("Forbidden")
    }
    else 
    {
        const imageName = image[0].dataValues.file_name
        const params = {
            Bucket: bucketName,
            Key: `${id}/${imageName}`
          }
          const command = new DeleteObjectCommand(params)
          await s3.send(command)

        await deleteImage(imageid)
        res.status(201).json("delete successfully!")
        logger.info("delete successfully!")
    }
  })
