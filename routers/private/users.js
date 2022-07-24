var express = require('express');
var router = express.Router();
const {resolve} = require('path');
const con = require(resolve('./configs/database'));
const bcrypt = require('bcrypt');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const auth = require(resolve('./configs/auth'))
const randtoken = require('rand-token');
const nodemailer = require("nodemailer");
const fileUpload = require('express-fileupload');
const { v4: uuidv4 } = require('uuid');
const { brotliCompressSync } = require('zlib');

const checkPermission = (req,res,next)=>{
    let {role} = req.data;
    if(role === 'member'){
        next()
    }
    else{
       res.json({message:'U do not access right here !...'})
    }
}


function sendEmail(email, token) {
    var email = email;
    var token = token;
    var mail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
    user: 'bihackquai@gmail.com', // Your email id
    pass: 'almsedhupokyggmh' // Your password
}
});

var mailOptions = {
    from: 'bihackquai@gmail.com',
    to: email,
    subject: 'Khôi phục mật khẫu  ',
    html: '<p>You requested for reset password, kindly use this <a href="http://localhost:8000/api/xe/users/update-password?token=' + token + '">link</a> to reset your password</p>'
    };
    mail.sendMail(mailOptions, function(error, info) {
    if(error) throw error
});
}

router.route('/')
.get(auth.protect,checkPermission,(req,res)=>{
    con.query(`SELECT uuid, name, role FROM users`,(err,result)=>{
        if(err) throw err
        res.json({status:200,message:result})
    })
})
.post((req,res)=>{ //login 
    const {name, password} = req.body
    if(name,password){
        con.query(`SELECT * FROM USERS`,async (err,result)=>{
            if(err) throw err;
            let [data] = result
            if(data){
                const checkPassword = await bcrypt.compare(password,data.password)
                if(checkPassword){
                    var token = jwt.sign({id:result[0].id},'the-super-strong-secrect',{ expiresIn: '5h' });
                    con.query(`UPDATE users SET last_login = now() where uuid = '${result[0].uuid}'`)
                    req.session.id = data.id;
                    res.json({result: true, token})
                }
                else{
                    res.json({status:200,message:'Your password is wrong'})
                }
            }
            else{
                res.end()
            }
        })
    }else{
        res.end()
    }
})
.put(async (req,res)=>{ //reg
    const uuid = uuidv4()
    const status = 'active';
    const role = 'member';
    const {name, password, email, name2} = req.body
    const bcryptPassword = await bcrypt.hash(password,10)
    con.query(`INSERT INTO users(name, password, email, name2, uuid, status, role) VALUES (${con.escape(name)}, ${con.escape(bcryptPassword)}, ${con.escape(email)}, ${con.escape(name2)}, ${con.escape(uuid)}, ${con.escape(status)}, ${con.escape(role)})`,(err,result)=>{
        if(err) throw err
        res.json({status:200,messagae:'Singup Success'})
    })
})
.delete((req,res)=>{
    const {uuid} = req.body
    con.query(`DELETE users where uuid= ${con.escape(uuid)}`,(err,result)=>{
        if(err) throw err
        res.json({status:200,messagae:'Users has been deleted'})
    })
})
 
router.post('/resest-password',(req,res,next)=>{
    const email = req.body.email
    const sql = `SELECT * FROM users WHERE email=${con.escape(email)}`;
    con.query(sql,(err,result)=>{
        if(err) throw err
        try{
            if (result[0].email.length > 0) {
                var token = randtoken.generate(20);
                var sent = sendEmail(email, token);
                  if (sent != '0') {
                     var data = {
                        token: token
                     }
                     con.query('UPDATE users SET ? WHERE email ="' + email + '"', data, function(err, result) {
                         if(err) throw err
                     })
                        res.json({status:200,messagae:'The reset password link has been sent to your email address'})
                 } else {
                    res.end();
                 }
             } else {
               res.end()
             }
        }catch{
           res.json({message:'Some thing went wrong '})
        }  
    })
})

router.get('/token-resest',(req,res)=>{
    token : req.query.token
})

router.post('/update-password/',async (req,res)=>{
    const {token, password, confirmPassword} = req.body
    con.query(`SELECT * FROM users WHERE token=${con.escape(token)}`,async (err,result)=>{
        if(err) throw err
        let [data] = result;
        try{
            if(data){
                if(password != confirmPassword){
                 res.json({status:200,messagae:'Password not the same'})
                }else{
                 const debryptConfirmPassword =  await bcrypt.hash(confirmPassword,10);
                 con.query(`UPDATE users SET password=(${con.escape(debryptConfirmPassword)}) WHERE email= ${con.escape(data.email)}`,(err,result)=>{
                     if(err) throw err
                     res.json({status:200,message:'Password has been updated'})
                 })
                }
             }
        }
        catch{
            res.end()
        }
    })
})

router.post('/change-password',(req,res)=>{
    const {uuid,newPassword,confirmPassword,oldPasswordInput} = req.body
    con.query(`SELECT uuid,password FROM users WHERE uuid = ${con.escape(uuid)}`, async (err,result)=>{
        if(err) throw err
        let [data] = result;
        const oldDataPassword = data.password;
        const comparePassword = await bcrypt.compare(oldPasswordInput,oldDataPassword)
        if(!comparePassword){
            res.json({message:'Your old password is not correct'})
        }
        else{
            if(newPassword != confirmPassword){
                res.json({message:'Your confirm password in not correct'})
            }else{
                const hashPassword = await bcrypt.hash(confirmPassword,10)
                con.query(`UPDATE users SET password= ${con.escape(hashPassword)} WHERE uuid=${con.escape(uuid)} `,(err,result)=>{
                    if(err) throw err
                    res.json({status:200})
                })
            }
        }

    })
})
module.exports = router;
