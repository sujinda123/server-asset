import mongoose from "mongoose";

const genPromise = (value, text) =>
  new Promise(resolve => {
    setTimeout(() => {
      console.log(text)
      return resolve(value)
    }, 100)
  })

const userModel = (() => {
  const userSchema = new mongoose.Schema({
    userUsername: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    userFirstname: {
      type: String,
      required: true
    },
    userLastname: {
      type: String,
      required: true
    },
    userPwd: {
      type: String,
      required: true,
      trim: true
    },
    assets: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
    }],
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
  const user = mongoose.model("User", userSchema);

  return {
    user,
    getUserById: id =>{
      // console.log(idd)
      return genPromise(
        user.findById(id), 
        `getUserById: ${id}`
        )
    },
    // getUserByName: name =>{
    //   return genPromise(
    //     users.findOne({name:name}),
    //     `getUserByName: ${name}`
    //   )},
    getUsersByIds: ids =>{
      return genPromise(
        user.find({ _id: {$in : ids}}),
        // users.filter(user => ids.includes(user.id)),
        `getUsersByIds: ${ids}`
      )},
    // getAllUsers: () =>{
    //   // console.log(mongo_userModel)
    //   return genPromise(users.find(), 'getAllUsers')
    // }
  }
})()
// const User = mongoose.model("User", userSchema);

export default userModel;
