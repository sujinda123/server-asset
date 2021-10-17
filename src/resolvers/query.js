const Query = {
  user: async (root, { name }, { userId, userModel }) => await userModel.getUserById(userId),

  // allUsers (root, args, { userModel }) {
  //   return userModel.getAllUsers()
  // },
  // user: (parent, args, { userId, userModel }, info) =>{
  //   if(!userId)
  //     throw new Error("กรุณา เข้าสู่ระบบ")

  //   return userModel.findById(userId).populate({ 
  //       path: "statusassets assets",
  //       populate: { path: "createdBy updateBy"}, 
  //       options: { sort: { createdAt: -1 }},
  //   })},

  // users: (parent, args, { userId, userModel }, info) =>{
  //   if(!userId)
  //     throw new Error("กรุณา เข้าสู่ระบบ")

  //   return userModel.find().sort({createdAt: -1}).populate({
  //       path: "statusassets assets",
  //       populate: { path: "user" }
  //   })},

  // statusasset: (parent, args, { userId }, info) =>
  //   StatusAsset.findById(args.id).sort({createdAt: -1 }).populate({
  //       path: "statusassets",
  //       populate: { path: "user" }
  //   }),
  // statusassets: (parent, args, { userId }, info) =>
  //   StatusAsset.find().sort({ createdAt: -1 }).populate({
  //       path: "createdBy updateBy",
  //   }),
  // assets: (parent, args, { userId, assetModel }, info) =>{
  //   return assetModel.asset.find().sort({ createdAt: -1 }).populate({
  //       path: "createdBy updateBy",
  //       populate: { path: "createdBy updateBy"}, 
  //   })},
  // search: async (_, {input: { assetCode }, limit, page}, { userId }) =>{
  //   // const count = await Asset.countDocuments(searchQuery)
  //   if(!userId)
  //     throw new Error("กรุณา เข้าสู่ระบบ")
  //   if(assetCode)
  //     return await Asset.find({ assetCode: { $regex: assetCode, $options: 'i' }}).limit(limit).skip((page - 1) * limit).populate({
  //       path: "createdBy updateBy",
  //     })
  //   else
  //     return null
  // }
 
};

export default Query;   