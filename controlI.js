import { image } from './models/image.js'

export async function uploadImage(productId, fileName, path) {
    const i = await image.create ({
        product_id : productId,
        file_name : fileName,
        s3_bucket_path : path
    })
  
    return i;
}
  
export async function deleteImage(imageId) {
    const i = await image.destroy({
        where : {
            id : imageId
        }
    })
}

export async function getImage(imageId) {
    const i = await image.findAll({
        where:{
            id : imageId
        }
    })

    return i
}

export async function getImageByProduct(Id) {
    const i = await image.findAll({
        where:{
            product_id : Id
        }
    })

    return i
}


  
