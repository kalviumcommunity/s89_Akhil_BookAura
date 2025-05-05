const jwt = require('jsonwebtoken')

const verifyToken = (req,res,next)=>{
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token){
        return res.status(401).send({message:"AcessDenied. No token provided"})
    }
    try {
        const verifed = jwt.verify(token,process.env.JWT_SECRET);
        req.user=verifed;
        next();
    } catch (error) {
        return res.status(300).send({message:"Invalidtoken",error})
    }
}
module.exports=verifyToken;