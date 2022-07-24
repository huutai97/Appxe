const jwt = require('jsonwebtoken');
const con = require('./database');

exports.protect =  (req,res,next) =>{
    let token = '';
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        token = req.headers.authorization.split(' ')[1]
    }
      if(!token){
        res.json({message:'Vui lòng đăng nhập'})
    }
    try{
      const decode = jwt.verify(token,'the-super-strong-secrect');
      var sql = `select * FROM users where id= ?`;
      con.query(sql,decode.id,(err,result)=>{
          if (err) throw err;
          var [user] = result;
         req.data = user
        next();
      });
    
    }
    catch{
      res.json({status:400})
    }
}



