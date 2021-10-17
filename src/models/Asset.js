import mongoose from "mongoose";

const genPromise = (value, text) =>
  new Promise(resolve => {
    setTimeout(() => {
      console.log(text)
      return resolve(value)
    }, 100)
  })

const assetModel = (() => {
  const AssetSchema = new mongoose.Schema({

    assetCode: {
      type: String,
      required: true,
      trim: true
    },
    assetName: {
      type: String,
      required: true,
      trim: true
    },
    assetNumber: {
      type: Number,
      required: true,
    },
    assetUnitCost: {
      type: String,
      required: true,
      trim: true
    },
    assetBrand: {
      type: String,
      required: true,
      trim: true
    },
    assetModel: {
      type: String,
      required: true,
      trim: true
    },
    assetSerialNumber: {
      type: String,
      required: true,
      trim: true
    },
    assetImages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset_Images",
      required: true
    }],
    statusassets: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Status_Asset",
      required: true
    },
    updateBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    updateAt: {
      type: Date,
      required: true,
      default: () => Date.now()
    },
    createdAt: {
      type: Date,
      required: true,
      default: () => Date.now()
    }
  });

  const asset = mongoose.model("Asset", AssetSchema);

  return {
    asset,
    // getUserById: id =>{
    //   // console.log(idd)
    //   return genPromise(
    //     asset.findById(id), 
    //     `getUserById: ${id}`
    //     )
    // },
    // getUserByName: name =>{
    //   return genPromise(
    //     users.findOne({name:name}),
    //     `getUserByName: ${name}`
    //   )},
    // getAssetsByIds: ids =>{
    //   return genPromise(
    //     asset.find({ _id: {$in : ids}}),
    //     // users.filter(user => ids.includes(user.id)),
    //     `getUsersByIds: ${ids}`
    //   )},
    getAssetsByUserIds: userIds =>{
      return genPromise(
        asset.find({ createdBy: {$in : userIds}}),
          // posts.find(post => String(post.userId) === String(userIds)),
          // posts.find(post => userIds.includes(post.userId)),
        `getAssetsByUserIds: ${userIds}`
      )},
    // getAllUsers: () =>{
    //   // console.log(mongo_userModel)
    //   return genPromise(users.find(), 'getAllUsers')
    // }
  }
})()



export default assetModel;
