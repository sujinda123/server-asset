import jwt from 'jsonwebtoken'
const config = require('./config')

const getUser = token =>{
    const parsedToken = token.split(" ")[1]
    try{
        // console.log(parsedToken)
        const decodeToken = jwt.verify(parsedToken, config.secret)
        return decodeToken.userId
    }catch(error){
        return null
    }

}

export default getUser