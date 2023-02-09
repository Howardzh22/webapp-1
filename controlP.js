
import { product } from './models/product.js'

export async function addProduct(name,description,sku,manufacturer,quantity,id){
    const p = await product.create({
        name:name,
        description:description,
        sku:sku,
        manufacturer:manufacturer,
        quantity:quantity,
        owner_user_id:id
    })
    return p
}

export async function getProduct(id){
    const p = await product.findAll({
        where:{
            id:id
        }
    })
    return p
}



export async function updateProduct(id,name,description,sku,manufacturer,quantity){
    
    const p = await product.update({
        name:name,
        description:description,
        sku:sku,
        manufacturer:manufacturer,
        quantity:quantity,
    },
    {
        where:{id:id}
    })
    const p1 = await product.findAll({
        where:{
            id:id
        }
    })
    return p1
}

export async function deleteProduct(id){
    await product.destroy({
        where:{
            id:id
        }
    })
}