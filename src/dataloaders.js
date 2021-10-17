const Dataloader = require('dataloader')
import User from "./models/user";
// 1
async function batchUsers (Users, keys) {
  return await User.find({_id: {$in: keys}})
}

// 2
module.exports = ({Users}) =>({
  // 3
  userLoader: new Dataloader(
    keys => batchUsers(Users, keys),
    {cacheKeyFn: key => key.toString()},
  ),
});