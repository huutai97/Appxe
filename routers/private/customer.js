var express = require('express');
var router = express.Router();
const {resolve} = require('path');
const con = require(resolve('./configs/database'))
const fileUpload = require('express-fileupload');
const { json } = require('body-parser');
const auth = require(resolve('./configs/auth'))
const { v4: uuidv4 } = require('uuid');
const randtoken = require('rand-token');
const { now } = require('moment');
const sharp = require('sharp');

const checkPermission = (req,res,next)=>{
    let {role} = req.data;
    if(role === 'member'){
        next()
    }
    else{
       res.json({message:'U do not access right here !...'})
    }
}


router.route('/')
.get((req,res)=>{ // Danh sách
    con.execute(`SELECT name, phoneNumber, email, type FROM customer WHERE isDeleted IS NULL`,(err,result)=>{
        if (err) throw err
        // let data = result
        res.json({status:200,InfoCustomer: result})
    })
}).put(fileUpload(),(req,res)=>{ // Thêm
    var avatar;
    var uploadPath;
    var status = 0;
    const {name, email, sex, address, city, dateOfbirth, cmnd, type, phoneNumber} = req.body;
    const uuid = uuidv4();
    avatar = req.files.avatar;
        if(avatar.mimetype == 'image/jpeg' || avatar.mimetype == 'image/png' || avatar.mimetype == 'image/jpg'){
            if (!req.files || Object.keys(req.files).length === 0) {
                return res.status(400).send('No files were uploaded.');
            }
            uploadPath =  ('./routers/avatar/customer') + avatar.name;
            avatar.mv(uploadPath);
            }
            else{
                res.json({message:'Tính làm gì đó....'})
            }
    con.execute(`INSERT INTO customer(name, email, sex, address, city, dateOfbirth, cmnd, type, phoneNumber, avatar, uuid, status) values (${con.escape(name)}, ${con.escape(email)}, ${con.escape(sex)}, ${con.escape(address)}, ${con.escape(city)}, ${con.escape(dateOfbirth)}, ${con.escape(cmnd)}, ${con.escape(type)}, ${con.escape(phoneNumber)}, ${con.escape(avatar.name)}, ${con.escape(uuid)}, ${con.escape(status)})`,(err,result)=>{
        if(err) throw err
        let data = result;
        res.json({status:200,message:'Successed'})
    })
}).post(fileUpload(),(req,res)=>{ // Sửa
    const {name, email, sex, address, city, dateOfbirth, cmnd, type, phoneNumber, uuid} = req.body;
    var avatar;
    var uploadPath;
    var randName = randtoken.generate(16)
    avatar = req.files.avatar;
        if(avatar.mimetype == 'image/jpeg' || avatar.mimetype == 'image/png' || avatar.mimetype == 'image/jpg'){
            if (!req.files || Object.keys(req.files).length === 0) {
                return res.status(400).send('No files were uploaded.');
            }
            uploadPath =  ('./routers/avatar/customer')+ randName + avatar.name;
            avatar.mv(uploadPath);
            }
        else{
            res.json({message:'Tính làm gì đó....'})
            }
    con.execute(`UPDATE customer set name=(${con.escape(name)}), email=(${con.escape(email)}), sex=(${con.escape(sex)}), address=(${con.escape(address)}), city=(${con.escape(city)}), dateOfbirth=(${con.escape(dateOfbirth)}), cmnd=(${con.escape(cmnd)}), type=(${con.escape(type)}), phoneNumber=(${con.escape(phoneNumber)}), avatar=(${con.escape(avatar.name)}) where uuid= ${con.escape(uuid)}`,(err,result)=>{
        if(err) throw err
        res.json({status:200,message:'The customer has been updated'})
    })
}).delete(auth.protect,checkPermission,(req,res)=>{
    const {uuid} = req.body;
    var objectDelete = {
        time: Date.now(),
        by: req.data?.id
    }
    con.execute(`UPDATE customer SET isDeleted=${con.escape(JSON.stringify(objectDelete))} WHERE uuid = ${con.escape(uuid)}`,(err,result)=>{
        if(err) throw err
        res.json({status: 200})
    })

})

router.get('/info-customer/',(req,res)=>{
    const {id} = req.body
    con.getConnection(function(err,conn) {
        if (err) throw err;
        conn.query(`SELECT * FROM customer where id= ${con.escape(id)};SELECT COUNT(id) AS TotalRental,SUM(valueContract) AS valueContract,SUM(amountRemaining) AS amountRemaining,dateContract FROM contract WHERE IDcustomer=${con.escape(id)}; SELECT COUNT(dateContract) AS numberOfContract,status, SUM(valueContract) AS valueContract,dateContract FROM contract WHERE IDcustomer=${con.escape(id)} GROUP BY date(dateContract)`,(err,result)=>{
            if(err) throw err
            let [[data],carrentalInfo,historyRental] = result;
            res.json({status:200,InfoCustomer:{
                ...data,
                carrentalInfo,historyRental
            }})
        })
        con.releaseConnection(conn)
    }); 


})



router.delete('/delete-customer',(req,res)=>{
    const {uuid} = req.body
    con.query(`DELETE FROM customer where uuid= ${con.escape(uuid)}`,(err,result)=>{
        if(err) throw err
        res.json({status:200,message:'Delete has been successed'})
    })
})
module.exports = router