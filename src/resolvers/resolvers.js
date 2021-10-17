// import Mutation from "./mutation"
// import Query from "./query"
import { GraphQLDateTime } from "graphql-iso-date"
import { GraphQLUpload } from "graphql-upload";
const { PubSub } = require('apollo-server');
const pubsub = new PubSub();
// const POST_ADDED = 'POST_ADDED'
// const POST_ADD_DataUser = 'POST_ADD_DataUser'
import fetch from 'cross-fetch';
import dotenv from "dotenv"
dotenv.config()
const path = require("path");
import bcrypt from "bcryptjs";
import console from "console";
const mysql = require('mysql');
const fs = require('fs');
const util = require('util');
import moment from 'moment';
// import User from "../models/User"
// import StatusAsset from "../models/StatusAsset"
// import Asset from "../models/Asset"

const jwt = require('jsonwebtoken')
const config = require('../config')

const { v4: uuid } = require('uuid');

const connection = mysql.createConnection({
  host: `${process.env.MYSQL_HOST}`,
  user: `${process.env.MYSQL_USER}`,
  password: `${process.env.MYSQL_PASSWORD}`,
  database: `${process.env.MYSQL_DB}`
});

// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'db_myapp'
// });

const query = util.promisify(connection.query).bind(connection);

function base64_encode(file) {
  // read binary data
  var bitmap = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return new Buffer.from(bitmap).toString('base64');
}

let queryDBImg = (sql) => {
  return new Promise((resolve, reject) => {
    query(sql, (err, results) => {
      if (err) reject(err);
      const dataImg = []
      if (results[0] != undefined) {
        results.map(data => {
          let url = path.join(__dirname, "../../uploads", data.IMAGE)
          var base64str = base64_encode(url);
          dataImg.push({ IMAGE_ID: data.IMAGE_ID, IMAGE: `${base64str}` })
        })
      }
      // console.log(dataImg)
      resolve(dataImg)
    });
  });
};

let queryDB = (sql) => {
  return new Promise((resolve, reject) => {
    query(sql, (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

let getUser = (username) => {
  const sqlAll = `SELECT * FROM asset_users`;
  const sqlByID = `${sqlAll} WHERE USER_USERNAME = '${username}'`;
  let sql = username ? sqlByID : sqlAll;
  return new Promise((resolve, reject) => {
    query(sql, (err, results) => {
      if (err) reject(err);
      resolve(results[0]);
    });
  });
};

let typeCheck = async (item) => {
  let { mimetype } = await item;
  // console.log(item)
  if (!(mimetype === "image/png" || mimetype === "image/jpeg")) {
    return false;
  } else {
    return true;
  }
}

const processUpload = async (file) => {
  const { createReadStream, mimetype, encoding, filename } = await file;
  let name = uuid() + '.jpg'
  let url = path.join(__dirname, "../../uploads", name)
  return await new Promise((resolve, reject) => {
    createReadStream()
      .pipe(fs.createWriteStream(url))
      .on("finish", () => {
        resolve({
          success: true,
          message: "Successfully Uploaded",
          mimetype, filename: name, encoding, location: url
        })
      })
      .on("error", (err) => {
        console.log("Error Event Emitted")
        reject({
          success: false,
          message: "Failed"
        })
      })
  })
}

const resolvers = {
  Subscription: {
    updateStatusAsset: {
      subscribe: () => pubsub.asyncIterator(['POST_UPDATE']),
    },
    // updateDataUser: {
    //     subscribe: (parent, args, context, info) => pubsub.asyncIterator([POST_ADD_DataUser]),
    // },
  },
  Upload: GraphQLUpload,
  Query: {
    // user: async (root, { name }, { userId, userModel }) => await userModel.getUserById(userId),
    getUser: (obj, { id }, { auth_username }) => {
      // console.log(auth_username)
      if (auth_username == null) {
        throw new Error("LoginFalse")
      }
      const data = getUser(auth_username)
      return data.then(rows => rows);
    },
    // getSearch: async (_, args) => {
    //   const { input: { ASSET_CODE }, limit, page, } = args
    //   let sql = `SELECT * FROM asset WHERE ASSET_CODE LIKE '%${ASSET_CODE}%' LIMIT ${limit}`;
    //   // queryDB(sql).then(rows => console.log(rows))
    //   return queryDB(sql).then(rows => rows);
    // },
  },

  User: {
    GET_ASSETS_ALL: (_, { limit = 0, page = 0, assetCode = '', select = 'ASSET_CODE' }) => {
      if (limit !== 0 && page !== 0) {
        const start = (page * limit) - limit
        let sql = `SELECT * FROM asset WHERE ${select} LIKE '%${assetCode.split(' ').join('%')}%' limit ${start},${limit} `;
        return queryDB(sql).then(rows => rows);
      }
      let sql = `SELECT * FROM asset WHERE ${select} LIKE '%${assetCode.split(' ').join('%')}%'`;
      return queryDB(sql).then(rows => rows);
    },
    GET_NUM_ASSET: () => {
      let sql = `SELECT COUNT(*) as ASSET_NUM_ALL FROM asset `;
      return queryDB(sql).then(rows => rows[0].ASSET_NUM_ALL);
    },
    GET_NUM_ASSET_SEARCH: (_, { assetCode = '', select = 'ASSET_CODE' }) => {
      let sql = `SELECT COUNT(*) as GET_NUM_ASSET_SEARCH FROM asset WHERE ${select} LIKE '%${assetCode.split(' ').join('%')}%'`;
      return queryDB(sql).then(rows => rows[0].GET_NUM_ASSET_SEARCH);
    },
    GET_PERIOD: (_, { limit = 20, page = 1 }) => {
      const start = (page * limit) - limit
      let sql = `SELECT * FROM asset_period ORDER BY PERIOD_ID DESC LIMIT ${start}, ${limit}`;
      return queryDB(sql).then(rows => rows);
    },
    GET_NUM_PERIOD: () => {
      let sql = `SELECT COUNT(*) as GET_NUM_PERIOD FROM asset_period `;
      return queryDB(sql).then(rows => rows[0].GET_NUM_PERIOD);
    },
    USER_ASSETS: (obj) => {
      // console.log(obj)
      let sql = `SELECT * FROM asset WHERE CREATED_BY = '${obj.USER_ID}'`;
      return queryDB(sql).then(rows => rows);
    },
    USER_PRIVILEGE: (obj) => {
      let sql = `SELECT * FROM asset_privilege WHERE PRIVILEGE_ID = '${obj.USER_PRIVILEGE}'`;
      return queryDB(sql).then(rows => rows);
    },
    ASSET_PRIVILEGE: (obj) => {
      let sql = `SELECT * FROM asset_status_and_privilege LEFT JOIN asset_status ON asset_status_and_privilege.STATUS_ID = asset_status.STATUS_ID WHERE PRIVILEGE_ID = '${obj.USER_PRIVILEGE}'`;
      return queryDB(sql).then(rows => rows);
    },
    USER_CHECK_ASSET: (obj, { limit = 20, page = 1, assetCode = '', select = 'ASSET_CODE' }) => {
      const start = (page * limit) - limit
      let sql = `SELECT *, asset.UPDATE_DATE FROM asset where asset.CHECK_DATE >= (SELECT PERIOD_START FROM asset_period ORDER BY PERIOD_ID DESC LIMIT 1) limit ${start},${limit}`;
      return queryDB(sql).then(rows => rows);
    },
    USER_NOT_CHECK_ASSET: (obj, { limit = 20, page = 1, assetCode = '', select = 'ASSET_CODE' }) => {
      const start = (page * limit) - limit
      let sql = `SELECT *, asset.UPDATE_DATE FROM asset where asset.CHECK_DATE < (SELECT PERIOD_START FROM asset_period ORDER BY PERIOD_ID DESC LIMIT 1) limit ${start},${limit}`;
      return queryDB(sql).then(rows => rows);
    },
    USER_ASSET_NUM_CHECK: (obj) => {
      let sql = `SELECT COUNT(*) as USER_ASSET_NUM_CHECK FROM asset where asset.CHECK_DATE >= (SELECT PERIOD_START FROM asset_period ORDER BY PERIOD_ID DESC LIMIT 1)`;
      return queryDB(sql).then(rows => rows[0].USER_ASSET_NUM_CHECK);
    },
    USER_ASSET_NUM_NOT_CHECK: (obj) => {
      let sql = `SELECT COUNT(*) as USER_ASSET_NUM_NOT_CHECK FROM asset where asset.CHECK_DATE < (SELECT PERIOD_START FROM asset_period ORDER BY PERIOD_ID DESC LIMIT 1)`;
      return queryDB(sql).then(rows => rows[0].USER_ASSET_NUM_NOT_CHECK);
    },
    ASSET_NUM_CHECK_ALL: () => {
      let sql = `SELECT COUNT(*) as ASSET_NUM_CHECK_ALL FROM asset where asset.CHECK_DATE >= (SELECT PERIOD_START FROM asset_period ORDER BY PERIOD_ID DESC LIMIT 1)`;
      return queryDB(sql).then(rows => rows[0].ASSET_NUM_CHECK_ALL);
    },
    ASSET_NUM_NOT_CHECK_ALL: (obj) => {
      let sql = `SELECT COUNT(*) as ASSET_NUM_NOT_CHECK_ALL FROM asset where asset.CHECK_DATE < (SELECT PERIOD_START FROM asset_period ORDER BY PERIOD_ID DESC LIMIT 1)`;
      return queryDB(sql).then(rows => rows[0].ASSET_NUM_NOT_CHECK_ALL);
    },
    ASSET_HISTORY_EDIT: (_, { AssetID = "", limit = 0, page = 0 }) => {
      if (limit !== 0 && page !== 0) {
        const start = (page * limit) - limit
        let sql = `SELECT asset_history_edit.ASSET_ID, asset_history_edit.ASSET_CODE, asset_history_edit.ASSET_NAME, asset_history_edit.ASSET_USER, 
          ASSET_NUMBER, ASSET_UNIT, ASSET_PRICE, ASSET_BRAND, ASSET_MODEL, ASSET_SERIALNUMBER, asset_history_edit.ASSET_STATUS, 
          asset_history_edit.ASSET_ROOM, asset_history_edit.ASSET_ORIGINAL_ROOM, asset_history_edit.UPDATE_BY, asset_history_edit.CREATE_DATE, NOTE
          FROM asset_history_edit
          INNER JOIN asset ON asset.ASSET_CODE = asset_history_edit.ASSET_CODE
          ORDER BY asset_history_edit.CREATE_DATE DESC limit ${start},${limit}`;
        return queryDB(sql).then(rows => rows);
      }
      let sql = `SELECT asset_history_edit.ASSET_ID, asset_history_edit.ASSET_CODE, asset_history_edit.ASSET_NAME, asset_history_edit.ASSET_USER, 
        ASSET_NUMBER, ASSET_UNIT, ASSET_PRICE, ASSET_BRAND, ASSET_MODEL, ASSET_SERIALNUMBER, asset_history_edit.ASSET_STATUS, 
        asset_history_edit.ASSET_ROOM, asset_history_edit.ASSET_ORIGINAL_ROOM, asset_history_edit.UPDATE_BY, asset_history_edit.CREATE_DATE, NOTE
        FROM asset_history_edit
        INNER JOIN asset ON asset.ASSET_CODE = asset_history_edit.ASSET_CODE
        ORDER BY asset_history_edit.CREATE_DATE DESC`;
      return queryDB(sql).then(rows => rows);
    },
    ASSET_HISTORY_CHECK: (_, { AssetID = "", limit = 0, page = 0, year = 0 }) => {
      // let sql = `SELECT * FROM asset_history_check WHERE ASSET_CODE LIKE '%${AssetID.split(' ').join('%')}%' ORDER BY CREATE_DATE DESC limit 0, ${limit}`;
      if (limit !== 0 && page !== 0) {
        const start = (page * limit) - limit
        let sql = `SELECT asset_history_check.ASSET_ID, asset.ASSET_CODE, asset.ASSET_NAME,ASSET_NUMBER, ASSET_UNIT, 
          ASSET_PRICE, ASSET_BRAND, ASSET_MODEL, ASSET_SERIALNUMBER, asset_history_check.ASSET_STATUS,
          asset.ASSET_USER, asset.ASSET_ROOM, ASSET_ORIGINAL_ROOM, asset_history_check.UPDATE_BY, asset_history_check.CREATE_DATE
          FROM asset
          INNER JOIN asset_history_check
          ON asset.ASSET_CODE = asset_history_check.ASSET_CODE
          WHERE (
            CASE
              WHEN ${year} = 0 THEN year(asset_history_check.CREATE_DATE)
              ELSE year(asset_history_check.CREATE_DATE) = ${year}
            END
          )
          ORDER BY asset_history_check.CREATE_DATE DESC limit ${start},${limit}`;
        return queryDB(sql).then(rows => rows);
      }
      let sql = `SELECT asset_history_check.ASSET_ID, asset.ASSET_CODE, asset.ASSET_NAME,ASSET_NUMBER, ASSET_UNIT, 
        ASSET_PRICE, ASSET_BRAND, ASSET_MODEL, ASSET_SERIALNUMBER, asset_history_check.ASSET_STATUS,
        asset.ASSET_USER, asset.ASSET_ROOM, ASSET_ORIGINAL_ROOM, asset_history_check.UPDATE_BY, asset_history_check.CREATE_DATE
        FROM asset
        INNER JOIN asset_history_check
        ON asset.ASSET_CODE = asset_history_check.ASSET_CODE
        ORDER BY asset_history_check.CREATE_DATE DESC`;
      return queryDB(sql).then(rows => rows);
    },
    YEAR_HISTORY_CHECK: () => {
      let sql = `SELECT year(CREATE_DATE) as year FROM asset_history_check GROUP BY year(CREATE_DATE)`;
      return queryDB(sql).then(rows => rows);
    },
    ASSET_NUM_HISTORY_ALL: () => {
      let sql = `SELECT COUNT(*) as ASSET_NUM_HISTORY_ALL FROM asset_history_check `;
      return queryDB(sql).then(rows => rows[0].ASSET_NUM_HISTORY_ALL);
    },
    ASSET_NUM_EDIT_ALL: () => {
      let sql = `SELECT COUNT(*) as ASSET_NUM_EDIT_ALL FROM asset_history_edit `;
      return queryDB(sql).then(rows => rows[0].ASSET_NUM_EDIT_ALL);
    },
    ASSET_NUM_USE_ALL: () => {
      let sql = `SELECT COUNT(*) as ASSET_NUM_USE_ALL FROM asset WHERE ASSET_STATUS = 'ใช้งาน' `;
      return queryDB(sql).then(rows => rows[0].ASSET_NUM_USE_ALL);
    },
    ASSET_NUM_DEFECTIVE_ALL: () => {
      let sql = `SELECT COUNT(*) as ASSET_NUM_DEFECTIVE_ALL FROM asset WHERE ASSET_STATUS = 'ชำรุด' `;
      return queryDB(sql).then(rows => rows[0].ASSET_NUM_DEFECTIVE_ALL);
    },
    ASSET_NUM_DECLINE_ALL: () => {
      let sql = `SELECT COUNT(*) as ASSET_NUM_DECLINE_ALL FROM asset WHERE ASSET_STATUS = 'เสื่อมสภาพ' `;
      return queryDB(sql).then(rows => rows[0].ASSET_NUM_DECLINE_ALL);
    },
    ASSET_NUM_UNNECESSARY_ALL: () => {
      let sql = `SELECT COUNT(*) as ASSET_NUM_UNNECESSARY_ALL FROM asset WHERE ASSET_STATUS = 'ไม่จำเป็นต้องใช้งานต่อไป' `;
      return queryDB(sql).then(rows => rows[0].ASSET_NUM_UNNECESSARY_ALL);
    },
    ASSET_NUM_NOT_FOUND_ALL: () => {
      let sql = `SELECT COUNT(*) as ASSET_NUM_NOT_FOUND_ALL FROM asset WHERE ASSET_STATUS = 'ตรวจไม่พบ' `;
      return queryDB(sql).then(rows => rows[0].ASSET_NUM_NOT_FOUND_ALL);
    },
  },

  Asset: {
    // ASSET_USER: (obj) => {
    //   let sql = `SELECT * FROM asset_users WHERE USER_ID = '${obj.ASSET_USER}'`;
    //   return queryDB(sql).then(rows => rows);
    // },
    ASSET_IMAGES: (obj) => {
      let sql = `SELECT * FROM asset_image WHERE ASSET_ID = '${obj.ASSET_ID}'`;
      return queryDBImg(sql).then(rows => rows);
    },
    ASSET_COUNT_IMAGES: (obj) => {
      let sql = `SELECT COUNT(*) as ASSET_COUNT_IMAGES FROM asset_image WHERE ASSET_ID = '${obj.ASSET_ID}'`;
      return queryDB(sql).then(rows => rows[0].ASSET_COUNT_IMAGES);
    },
    // ASSET_STATUS: (obj) => {
    //   let sql = `SELECT * FROM asset_status WHERE STATUS_ID = '${obj.ASSET_STATUS}'`;
    //   return queryDB(sql).then(rows => rows);
    // },
    // ASSET_ROOM: (obj) => {
    //   let sql = `SELECT * FROM asset_room WHERE ROOM_ID = '${obj.ASSET_ROOM}'`;
    //   return queryDB(sql).then(rows => rows);
    // },
    // ASSET_ORIGINAL_ROOM: (obj) => {
    //   let sql = `SELECT * FROM asset_room WHERE ROOM_ID = '${obj.ASSET_ORIGINAL_ROOM}'`;
    //   return queryDB(sql).then(rows => rows);
    // },
    CREATED_BY: (obj) => {
      let sql = `SELECT * FROM asset_users WHERE USER_ID = '${obj.CREATED_BY}'`;
      return queryDB(sql).then(rows => rows);
    },
    UPDATE_BY: (obj) => {
      let sql = `SELECT * FROM asset_users WHERE USER_ID = '${obj.UPDATE_BY}'`;
      return queryDB(sql).then(rows => rows);
    },
    // updateBy: async (asset, args, { dataloaders }) => await dataloaders.users.load(asset.updateBy),
    // createdBy: async (asset, args, { dataloaders }) => await dataloaders.users.load(asset.createdBy),
    // statusassets: async (user, args, { dataloaders, assetModel } ) => await assetModel.asset.find().populate({
    //         path: "createdBy updateBy",
    //         populate: { path: "createdBy updateBy"}, 
    //     })
  },

  Status_Asset: {
    // updateBy: async (asset, args, { dataloaders }) => await dataloaders.users.load(asset.updateBy),
    // createdBy: async (asset, args, { dataloaders }) => await dataloaders.users.load(asset.createdBy),
  },

  Mutation: {
    //  สมัครสมาชิก
    signup: async (parent, args, info) => {
      const { USER_USERNAME, USER_PASSWORD, USER_FIRSTNAME, USER_LASTNAME } = args;
      var sql = `SELECT * FROM asset_users WHERE USER_USERNAME = '${USER_USERNAME}'`;
      const password = await bcrypt.hash(USER_PASSWORD, 10);
      let token = (async () => {
        try {
          const rows = await query(sql);
          if (rows[0] != null) {
            throw new Error("Username มีในระบบแล้ว")
          }
          if (USER_PASSWORD.trim().length < 6) {
            throw new Error("Password must be at least 6 characters.")
          }
          sql = `INSERT INTO asset_users (USER_USERNAME, USER_FIRSTNAME, USER_LASTNAME, USER_PASSWORD) VALUES ('${USER_USERNAME}', '${USER_FIRSTNAME}', '${USER_LASTNAME}', '${password}')`;
          query(sql);
          return jwt.sign({ userId: USER_USERNAME }, APP_SECRET, { expiresIn: '3d' },);
        } finally {
          // connection.end();
        }
      })()
      return { token }
    },
    // Login
    login: async (parent, args, { userModel }, info) => {
      const { Username, Password } = args;

      if (Username == '') {
        throw new Error("กรุณากรอก Username")
      }
      if (Password == '') {
        throw new Error("กรุณากรอก รหัสผ่าน")
      }
      var sql = `SELECT * FROM asset_users WHERE USER_USERNAME = '${Username}'`;
      const rows = await query(sql);
      if (rows[0] == null) {
        throw new Error("ไม่พบ Username ในระบบ")
      }
      const checkPassword = await bcrypt.compare(Password, rows[0].USER_PASSWORD)
      if (!checkPassword) {
        throw new Error('รหัสผ่าน ไม่ถูกต้อง')
      }
      const token = jwt.sign({ userId: rows[0].USER_USERNAME }, config.secret, /*{ expiresIn: config.tokenLife },*/);
      const refreshToken = jwt.sign({ userId: rows[0].USER_USERNAME }, config.refreshTokenSecret, { expiresIn: config.refreshTokenLife })
      return {
        "status": true,
        "token": token,
        "refreshToken": refreshToken,
        "message": "เข้าสู่ระบบสำเร็จ"
      }
    },
    updateNotification: async (_, { token }, { auth_username }) => {
      query(`UPDATE asset_users SET USER_TOKEN = '${token}' WHERE USER_USERNAME = '${auth_username}'`)
      return { "status": true }
    },
    // UpLoad Images
    singleUploadLocal: async (_, { file, assetID }) => {
      let obj = (await processUpload(file));
      query(`INSERT INTO asset_image (IMAGE, ASSET_ID) VALUES ('${obj.filename}', '${assetID}')`)
      return obj
    },
    multipleUploadLocal: async (_, { files, assetID }) => {
      let obj = (await Promise.all(files)).map(processUpload);
      obj.map(data => data.then(d => {
        query(`INSERT INTO asset_image (IMAGE, ASSET_ID) VALUES ('${d.filename}', '${assetID}')`)
      }))
      return obj;
    },
    // Update Status Asset
    updateStatusAsset: async (_, { assetID, assetStatus }, { auth_username }) => {
      if (assetStatus === 1) {
        assetStatus = 'ใช้งาน'
      } else if (assetStatus === 2) {
        assetStatus = 'ชำรุด'
      } else if (assetStatus === 3) {
        assetStatus = 'เสื่อมสภาพ'
      } else if (assetStatus === 4) {
        assetStatus = 'ไม่จำเป็นต้องใช้งานต่อไป'
      } else if (assetStatus === 5) {
        assetStatus = 'ตรวจไม่พบ'
      }
      query(`UPDATE asset SET ASSET_STATUS = '${assetStatus}',CHECK_DATE = '${moment(new Date()).format('YYYY-MM-DD')}', UPDATE_DATE = '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}' WHERE ASSET_CODE = '${assetID}'`)

      query(`
        INSERT INTO asset_history_check (ASSET_CODE, ASSET_STATUS, UPDATE_BY, CREATE_DATE) 
        VALUES ('${assetID}', '${assetStatus}', '${auth_username}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}')`)
      // let sql = `SELECT * FROM asset_history_check WHERE ASSET_CODE = '${assetID}'`;
      let sql = `SELECT asset_history_check.ASSET_ID, asset.ASSET_CODE, asset.ASSET_NAME,ASSET_NUMBER, ASSET_UNIT, 
        ASSET_PRICE, ASSET_BRAND, ASSET_MODEL, ASSET_SERIALNUMBER, asset_history_check.ASSET_STATUS,
        asset.ASSET_USER, asset.ASSET_ROOM, ASSET_ORIGINAL_ROOM, asset_history_check.UPDATE_BY, asset_history_check.CREATE_DATE
        FROM asset
        INNER JOIN asset_history_check
        ON asset.ASSET_CODE = asset_history_check.ASSET_CODE
        WHERE asset_history_check.ASSET_CODE = '${assetID}'
        ORDER BY asset_history_check.CREATE_DATE DESC LIMIT 1 `;
      const dataUpdate = queryDB(sql).then(rows => rows);
      pubsub.publish('POST_UPDATE', { updateStatusAsset: dataUpdate });
      return { "status": true };
    },
    // Delete Images
    deleteImageAsset: async (_, { ImgID }) => {
      query(`SELECT IMAGE FROM asset_image WHERE IMAGE_ID = '${ImgID}'`).then(data => {
        let url = path.join(__dirname, "../../uploads", data[0].IMAGE)
        fs.unlinkSync(url)
      })
      query(`DELETE FROM asset_image WHERE IMAGE_ID = '${ImgID}'`)
      return { "status": true };
    },
    // Create Asset
    createAsset: async (parent, args, { auth_username }, info) => {
      const { assetCode, assetName, assetNumber, assetUnit, assetPrice, assetBrand, assetModel, assetSerialNumber, assetStatus, assetUser, assetRoom, assetOriginalRoom } = args;
      const data_user = getUser(auth_username)
      let userid = await data_user.then(rows => rows.USER_ID)
      const insert_asset = query(`INSERT INTO asset (ASSET_CODE, ASSET_NAME, ASSET_NUMBER, ASSET_UNIT, ASSET_PRICE, ASSET_BRAND, ASSET_MODEL, ASSET_SERIALNUMBER, ASSET_STATUS, ASSET_USER, ASSET_ROOM, ASSET_ORIGINAL_ROOM, CREATED_BY, UPDATE_BY) 
        SELECT '${assetCode}', '${assetName}', '${assetNumber}', '${assetUnit}', '${assetPrice}', '${assetBrand}', '${assetModel}', '${assetSerialNumber}', '${assetStatus}', '${assetUser}', '${assetRoom}', '${assetOriginalRoom}', '${userid}', '${userid}'
        WHERE not exists (select * from asset where ASSET_CODE = '${assetCode}')`)
      let insertId = await insert_asset.then(data => data.insertId)
      if (insertId === 0)
        return { "status": false };
      return { "idAsset": assetCode, "status": true };
    },

    // Edit Asset
    editAsset: async (_, { assetID, name, status, username, room, roomOriginal, note }, { auth_username }) => {
      const insert_asset = query(`
        INSERT INTO asset_history_edit (ASSET_CODE, ASSET_NAME, ASSET_STATUS, ASSET_USER, ASSET_ROOM, ASSET_ORIGINAL_ROOM, NOTE, UPDATE_BY, CREATE_DATE) 
        VALUES ('${assetID}', '${name}', '${status}', '${username}', '${room}', '${roomOriginal}', '${note}', '${auth_username}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}')
      `)
      const update_asset = query(`
        UPDATE asset 
        SET ASSET_STATUS = '${status}', 
            ASSET_USER = '${username}', 
            ASSET_ROOM = '${room}', 
            ASSET_ORIGINAL_ROOM = '${roomOriginal}',
            UPDATE_BY = '${auth_username}',
            CHECK_DATE = '${moment(new Date()).format('YYYY-MM-DD')}', 
            UPDATE_DATE = '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}' 
        WHERE ASSET_CODE = '${assetID}'`)
      let insertId = await insert_asset.then(data => data.insertId)
      let updateId = await update_asset.then(data => data.insertId)
      if (insertId === 0 && updateId === 0)
        return { "status": false };
      return { "idAsset": assetID, "status": true };
    },
    // Edit and Add Period
    addPeriod: async (_, { start, end, note }, { auth_username }) => {
      const insert_period = query(`INSERT INTO asset_period (PERIOD_START, PERIOD_END, NOTE, UPDATE_BY, UPDATE_DATE, CREATE_DATE) VALUES ('${moment(start).format('YYYY-MM-DD')}', '${moment(end).format('YYYY-MM-DD')}', '${note}', '${auth_username}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}')`)
      let insertId = await insert_period.then(data => data.insertId)
      if (insertId === 0)
        return { "status": false };
      
            // Notification
            const dataUser = query(`SELECT USER_TOKEN FROM asset_users WHERE USER_TOKEN != ""`)
            dataUser.then(data => data.map(data => sendPushNotification(data.USER_TOKEN)))
            async function sendPushNotification(expoPushToken) {
              const message = {
                to: expoPushToken,
                sound: 'default',
                title: 'แก้ไขช่วงเวลาตรวจนับ',
                body: `เริ่มการตรวจนับ : ${moment(start).format('DD/MM/YYYY')} สิ้นสุดตรวจนับ : ${moment(end).format('DD/MM/YYYY')}`,
                data: { someData: 'goes here' },
              };
      
              await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Accept-encoding': 'gzip, deflate',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
              });
            }
            // End Notification
      return { "idAsset": insertId, "status": true };
    },
    editPeriod: async (_, { periodID, start, end, note }, { auth_username }) => {
      query(`UPDATE asset_period SET PERIOD_START = '${moment(start).format('YYYY-MM-DD')}', PERIOD_END = '${moment(end).format('YYYY-MM-DD')}', UPDATE_DATE = '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', NOTE = '${note}', UPDATE_BY = '${auth_username}' WHERE PERIOD_ID = ${periodID}`)
      
      // Notification
      const dataUser = query(`SELECT USER_TOKEN FROM asset_users WHERE USER_TOKEN != ""`)
      dataUser.then(data => data.map(data => sendPushNotification(data.USER_TOKEN)))
      async function sendPushNotification(expoPushToken) {
        const message = {
          to: expoPushToken,
          sound: 'default',
          title: 'แก้ไขช่วงเวลาตรวจนับ',
          body: `เริ่มการตรวจนับ : ${moment(start).format('DD/MM/YYYY')} สิ้นสุดตรวจนับ : ${moment(end).format('DD/MM/YYYY')}`,
          data: { someData: 'goes here' },
        };

        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });
      }
      // End Notification

      return { "status": true };
    }
  },
  Date: GraphQLDateTime
};

export default resolvers;
