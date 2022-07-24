const express = require('express');
const router = express.Router();
const {resolve} = require('path');
const con = require(resolve('./configs/database'))
const fileUpload = require('express-fileupload');
const { json } = require('body-parser');
const auth = require(resolve('./configs/auth'))
const { v4: uuidv4 } = require('uuid');
const randtoken = require('rand-token');
const { stat } = require('fs');

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
.get((req,res)=>{
    con.execute(`SELECT id,name,phoneNumber,status FROM drivers WHERE isDeleted IS NULL`,(err,result)=>{
        if(err) throw err
        res.json({status:200,data:result})
    })
})
.post(fileUpload(),(req,res)=>{ // sửa
    var avatar;
    var driverLicense1;
    var driverLicense2;
    var uploadPath;
    var uploadPathlicense;
    var randName = randtoken.generate(16);
    avatar = req.files.avatar;
    driverLicense1 = req.files.driverLicense1;
    driverLicense2 = req.files.driverLicense2;
    if(avatar.mimetype == 'image/jpeg' || avatar.mimetype == 'image/png' || avatar.mimetype == 'image/jpg'){
        if (!req.files || Object.keys(req.files).length === 0) {
            res.json({status:405})
        }
        uploadPath =  ('./routers/avatar/drivers/') + randName + avatar.name;
        avatar.mv(uploadPath);
        }
        else{
            res.json({status:405})
        }
    if(driverLicense1.mimetype == 'image/jpeg' || driverLicense1.mimetype == 'image/png' || driverLicense1.mimetype == 'image/jpg'){
            if (!req.files || Object.keys(req.files).length === 0) {
                res.json({status:405})
            }
            uploadPathlicense =  ('./routers/avatar/license/') + randName + driverLicense1.name;
            driverLicense1.mv(uploadPathlicense);
            }
    else{
        res.json({status:405})
            }
            
    if(driverLicense2.mimetype == 'image/jpeg' || driverLicense2.mimetype == 'image/png' || driverLicense2.mimetype == 'image/jpg'){
                if (!req.files || Object.keys(req.files).length === 0) {
                    res.json({status:405})
                }
                uploadPathlicense =  ('./routers/avatar/license/') + randName + driverLicense2.name;
                driverLicense2.mv(uploadPathlicense);
                }
    else    {
                res.json({status:405})
            }
    const {name, email, address, sex, dateOfbirth, city, cmnd, type, dateRange, expDriver, phoneNumber,uuid} = req.body
    con.execute(`UPDATE drivers set name=(${con.escape(name)}), email=(${con.escape(email)}), address=(${con.escape(address)}), sex=(${con.escape(sex)}), dateOfbirth=(${con.escape(dateOfbirth)}), city=(${con.escape(city)}), cmnd=(${con.escape(cmnd)}), type=(${con.escape(type)}), dateRange=(${con.escape(dateRange)}), expDriver=(${con.escape(expDriver)}), avatar=${con.escape(avatar.name)}, driverLicense1=${con.escape(driverLicense1.name)}, driverLicense2=${con.escape(driverLicense2.name)}, phoneNumber=${con.escape(phoneNumber)} where uuid=${con.escape(uuid)}`,(err,result)=>{
        if(err) throw err
        res.json({status:200,message:'Drivers has been updated'})
    })
})
.put(fileUpload(),(req,res)=>{ // thêm\
    var uuid = uuidv4()
    var status = 0;
    var avatar;
    var driverLicense1;
    var driverLicense2;
    var uploadPath;
    var uploadPathlicense;
    var randName = randtoken.generate(16);
    avatar = req.files.avatar;
    driverLicense1 = req.files.driverLicense1;
    driverLicense2 = req.files.driverLicense2;
    if(avatar.mimetype == 'image/jpeg' || avatar.mimetype == 'image/png' || avatar.mimetype == 'image/jpg'){
        if (!req.files || Object.keys(req.files).length === 0) {
             res.status(400).send('No files were uploaded.');
        }
        uploadPath =  ('./routers/avatar/drivers/') + randName + avatar.name;
        avatar.mv(uploadPath);
        }
        else{
            res.json({message:'Type of image we not allow, please choose another'})
        }
    if(driverLicense1.mimetype == 'image/jpeg' || driverLicense1.mimetype == 'image/png' || driverLicense1.mimetype == 'image/jpg'){
            if (!req.files || Object.keys(req.files).length === 0) {
                 res.status(400).send('No files were uploaded.');
            }
            uploadPathlicense =  ('./routers/avatar/license/') + randName + driverLicense1.name;
            driverLicense1.mv(uploadPathlicense);
            }
    else{
                res.json({message:'Type of image we not allow, please choose another'})
            }
            console.log(driverLicense1.name)
    if(driverLicense2.mimetype == 'image/jpeg' || driverLicense2.mimetype == 'image/png' || driverLicense2.mimetype == 'image/jpg'){
                if (!req.files || Object.keys(req.files).length === 0) {
                     res.status(400).send('No files were uploaded.');
                }
                uploadPathlicense =  ('./routers/avatar/license/') + randName + driverLicense2.name;
                driverLicense2.mv(uploadPathlicense);
                }
    else{
                    res.json({message:'Type of image we not allow, please choose another'})
                }
    const {name, email, address, sex, dateOfbirth, city, cmnd, type, dateRange, expDriver, phoneNumber } = req.body
    con.execute(`insert into drivers(name, email, address, sex, dateOfbirth, city, cmnd, type, dateRange, expDriver ,avatar, driverLicense1, uuid, driverLicense2, status) values(${con.escape(name)}, ${con.escape(email)}, ${con.escape(address)}, ${con.escape(sex)}, ${con.escape(dateOfbirth)}, ${con.escape(city)}, ${con.escape(cmnd)}, ${con.escape(type)}, ${con.escape(dateRange)}, ${con.escape(expDriver)}, ${con.escape(avatar.name)}, ${con.escape(driverLicense1.name)}, ${con.escape(uuid)}, ${con.escape(driverLicense2.name)}, ${con.escape(status)}), ${con.escape(phoneNumber)}`,(err,result)=>{
        if(err) throw err
        let data = result
        res.json({status:200,message:'Drivers has been added'})
    })
})
.delete(auth.protect,checkPermission,(req,res)=>{
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

router.get('/info',(req,res)=>{
    const {uuid} = req.body
    con.execute(`SELECT * FROM drivers WHERE uuid=${con.escape(uuid)}`,(err,result)=>{
        if (err) throw err
        let [data] = result;
        res.json({status:200,InfoDriver:data})
    })
})

router.post('/status/',(req,res)=>{
    const {uuid,status} = req.body
    const sql = `UPDATE drivers SET status = (${con.escape(status)}) where uuid= ${con.escape(uuid)}`;
    con.execute(sql,(err,result)=>{
        if(err) throw err;
        res.status(200).json({status:200,message:'Change status has beed updated'})
    })      
})

router.get('/sort',(req,res)=>{
    const {values} = req.body
    con.execute(`SELECT * FROM  drivers where type=${con.escape(values)} or status=${con.escape(values)}`,(err,result)=>{
        if(err) throw err
        res.json({status:200,message:result})
    })
})

router.get('/search',(req,res)=>{
    const {values} = req.body;
    const sql = `SELECT * FROM drivers WHERE name LIKE '%${(values)}%' OR phoneNumber='${(values)}%' OR type='${(values)}'`
    con.execute(sql,(err,result)=>{
        if(err) throw err
        res.json({status:200,InfoDriverSearch : result})
    })
})

router.delete('/delete-drivers',(req,result)=>{ // delete
    const {uuid} = req.body
    con.execute(`DELETE FROM drivers where uuid = ${con.escape(uuid)}`,(err,result)=>{
        if(err) throw err
        res.json({status:200,message:'Drivers has been deleted'})
    })
})
module.exports = router ;
