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
    subject: 'Khôi phục mật khẫu - wWw.Noah.VN ',
    html: '<p>You requested for reset password, kindly use this <a href="http://localhost:8000/test/reset-password?token=' + token + '">link</a> to reset your password</p>'
    };
    mail.sendMail(mailOptions, function(error, info) {
    if(error){
    console.log('lỗi')
    }else {
    console.log(0)
    }
});
}

router.get("/",auth.protect, (req,res) => {
   con.query(`select * from users`,(err,result)=>{
    let data = result
    res.status(200).json({status:200,data:data})
   })
})

router.get('/info-user/:id',(req,res)=>{
    const {id} = req.params
    const sql = `select * from users where id = ${con.escape(id)}`
    con.query(sql,(err,result)=>{
        res.json({infoUser:result})
    })
})

router.post('/info/uploadAvatar/:id',fileUpload(),(req,res)=>{
    const {id} = req.params
    var avatar ;
    var uploadPath; 
    avatar = req.files.avatar;
    if(avatar.mimetype == 'image/jpeg' || avatar.mimetype == 'image/png' || avatar.mimetype == 'image/jpg'){
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.');
        }
        uploadPath =  ('./routers/avatar/') + avatar.name;
        avatar.mv(uploadPath);
        }
        else{
            res.json({message:'Tính làm gì đó....'})
        }
    const sql = `update users set avatar= ${con.escape(avatar.name)} where id= ${con.escape(id)}`;
        console.log(sql)
    con.query(sql,(err,result)=>{
     res.json({result:result})
    })
})

router.post('/rs-password',(req,res,next)=>{
    const email = req.body.email
    const sql = `select * from users where email=`+ `${con.escape(email)}`;
    con.query(sql,(err,result)=>{
        if(err) throw err
        if (result[0].email.length > 0) {
            var token = randtoken.generate(20);
            var sent = sendEmail(email, token);
              if (sent != '0') {
                 var data = {
                    token: token
                    
                 }
                 console.log(data)
                 con.query('UPDATE users SET ? WHERE email ="' + email + '"', data, function(err, result) {
                     if(err) throw err
                 })
                 type = 'success';
                 msg = 'The reset password link has been sent to your email address';
             } else {
                 type = 'error';
                 msg = 'Something goes to wrong. Please try again';
             }
         } else {
             type = 'error';
             msg = 'The Email is not registered with us';
  
         }
      
    })
})

router.post("/dang-ky",async (req,res) => {
    const {uuid, ten, matkhau, role, email, trangthai} = req.body
    const bcryptPassword = await bcrypt.hash(matkhau,10)
    const sql = `insert into users (uuid, ten, matkhau, role, email, trangthai) values (${con.escape(uuid)},${con.escape(ten)},${con.escape(bcryptPassword)},${con.escape(role)},${con.escape(email)},${con.escape(trangthai)})`
    con.query(sql,(err,result)=>{
        if(err) throw err
        let data = result;
        res.status(200).json({status:200,data:data});
    })
})

router.post('/dang-nhap',(req,res,next)=>{
    const { ten, matkhau} = req.body;
    if(ten,matkhau){
        const sql = `select id, ten, matkhau from users where ten = ${con.escape(ten)}`;
        con.query(sql,async (err,result)=>{
            if(err) throw err
            let [data] = result;
            if(data){
                const checkPassword = await bcrypt.compare(matkhau,data.matkhau);
                if(checkPassword){
                    var token = jwt.sign({id:result[0].id},'the-super-strong-secrect',{ expiresIn: '3h' });
                    con.query(
                    `UPDATE users SET last_login = now() WHERE id = '${result[0].id}'`
                    );
                    req.session.id = data.id;
                    res.cookie('access_token',token,{
                        maxAge: Date.now() + 24 * 60 * 60 * 1000,
                        httpOnly: true
                        })
                        .json({
                        result: true,token,
                    })
                }
                else{
                    res.json({message:'Mật khẩu không đúng'});
                }
            }else{
                res.json({messgae:'Tên tài khoản không đúng'});
            }
        })
    }
    else{
        res.json({message:'Vừa có lỗi gì đó xảy ra...'})
    }
})

router.post('/doi-mat-khau/:id', (req,res,next)=>{
    const id = req.params.id;
    const {matkhau, xacnhanmk, matkhaucu} = req.body;
    const sql = `select * from users where id= ` + `${con.escape(id)}`;
    con.query(sql,async (err,result)=>{
        if(err) throw err
        let [data] = result
        const passwordOld = data.matkhau
        const matkhaucune= await bcrypt.compare(matkhaucu,passwordOld)
        if(!matkhaucune){
            res.json({message:'Mật khẩu cũ của bạn không đúng'})
        }
        else{
            if(matkhau != xacnhanmk ){
                res.json({message:'Mật khẩu xác nhận không đúng'})
            }else{
                const confirmPassword= await bcrypt.hash(xacnhanmk,10)
                const sql2 = `UPDATE users SET matkhau =  (${con.escape(confirmPassword)}) where id=` + `${con.escape(id)}`;
                con.query(sql2,(err,result)=>{
                    if(err) throw err
                    res.json({message:'Thay đổi mật khẩu thành công'})
                })
            }
        }
    }) 
})

router.put("/:id", (req,res) => {
    const {uuid, ten, matkhau, role, email} = req.body
    const sql= `update users set uuid = ${con.escape(uuid)}, ten = ${con.escape(ten)}, matkhau = ${con.escape(matkhau)}, role = ${role}, email= ${con.escape(email)}`
    con.query(sql,(err,result)=>{
        if(err) throw err
        let data = result;
        res.status(200).json({status:200,data:data});
    })
})

router.delete("/delete-user/:id", (req,res) => {
    id = req.params.id;
    sql = `select * from users where id= ` + `${con.escape(id)}`;
    con.query(sql,(err,result)=>{
        if(err) throw err;
        let data = result;
        res.json({status:200,message:'User has been delete'})
    })
})

router.get("/thanh-vien/:id", (req,res) => {
    const id = req.params.id;
    const sql = `select * from users where id=` + `${con.escape(id)}`;
    con.query(sql,(err,resutl)=>{
        if(err) throw err
        let data = result;
        res.status(200).json({status:200,data:data})
    })
})

router.get('/user-status/:status/:id',(req,res)=>{
    const id = req.params.id;
    const status = req.params.status;
    let currenStatus = (status === 'active') ? "inactive" : "active";
    const sql = `UPDATE users set trangthai = (${con.escape(currenStatus)}) where id= `+ `${con.escape(id)}`;
    con.query(sql,(err,result)=>{
        if(err) throw err;
        let data = result
        res.status(200).json({status:200,data:data})
    })
})

router.get('/logout',(req,res)=>{
    return res
    .cookie('access_token','none')
    .clearCookie('access_token')
    .status(200)
    .json({message: "hẹn gặp lại"})
 })
 
module.exports = router