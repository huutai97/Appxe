var express = require('express');
var router = express.Router();
const {resolve} = require('path');
const con = require(resolve('./configs/database'))
const fileUpload = require('express-fileupload');
const auth = require(resolve('./configs/auth'))
const { v4: uuidv4 } = require('uuid');
const randtoken = require('rand-token');


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
    con.query(`SELECT * FROM listcar WHERE isDeleted IS NULL`,(err,result)=>{
        if(err) throw err
        res.json({status:200,infoListcar:result})
    })
})
.post(fileUpload(),(req,res)=>{
    const {modal, carMaker, type, corlor, licensePlates, status,uuid} = req.body
    var poster;
    var uploadPath;
    var randName = randtoken.generate(16);
    poster = req.files.poster;
    if(poster.mimetype == 'image/jpeg' || poster.mimetype == 'image/png' || poster.mimetype == 'image/jpg'){
        if (!req.files || Object.keys(req.files).length === 0) {
            res.json({status:405})
        }
        uploadPath =  ('./routers/avatar/modalcar/') + randName + poster.name;
        poster.mv(uploadPath);
        }
        else{
            res.json({status:405})
        }
    con.query(`UPDATE listcar SET modal=${con.escape(modal)}, carMaker=${con.escape(carMaker)}, type=${con.escape(type)}, corlor=${con.escape(corlor)}, licensePlates=${con.escape(licensePlates)}, status=${con.escape(status)},poster=${con.escape(poster.name)} where uuid=${con.escape(uuid)}`,(err,result)=>{
        if(err) throw err
        res.json({status:200,message:'Modal car has been updated'})
    })
})
.put(fileUpload(),(req,res)=>{
    const {modal, carMaker, type, corlor, licensePlates, status} = req.body
    var uuid  = uuidv4()
    var poster;
    var uploadPath;
    var randName = randtoken.generate(16);
    poster = req.files.poster;
    if(poster.mimetype == 'image/jpeg' || poster.mimetype == 'image/png' || poster.mimetype == 'image/jpg'){
        if (!req.files || Object.keys(req.files).length === 0) {
            res.end()
        }
        uploadPath =  ('./routers/avatar/modalcar/') + randName + poster.name;
        poster.mv(uploadPath);
        }
        else{
            res.end()
        }
    con.query(`INSERT INTO listcar (modal, carMaker, type, corlor, licensePlates, status, poster, uuid) values (${con.escape(modal)}, ${con.escape(carMaker)}, ${con.escape(type)}, ${con.escape(corlor)}, ${con.escape(licensePlates)}, ${con.escape(status)}, ${con.escape(poster.name)}, ${con.escape(uuid)})`,(err,result)=>{
        if(err) throw err
        res.json({status:200,message:'Modal car has been added'})
    })
})
.delete(auth.protect,checkPermission,(req,res)=>{
    const {uuid} = req.body;
    var objectDelete = {
        time: Date.now(),
        by: req.data?.id
    }
    con.query(`UPDATE customer SET isDeleted=${con.escape(JSON.stringify(objectDelete))} WHERE uuid = ${con.escape(uuid)}`,(err,result)=>{
        if(err) throw err
        res.json({status: 200})
    })

})
router.post('/status',(req,res)=>{
    const {uuid, status} = req.body;
    con.query(`UPDATE listcar SET status=${con.escape(status)} WHERE uuid=${con.escape(uuid)} `)
})

router.get('/sort',(req,res)=>{
    const {values} = req.body;
    const sql = `SELECT * FROM listcar WHERE carMaker=${con.escape(values)} OR corlor=${con.escape(values)} OR type=${con.escape(values)} OR status=${con.escape(values)}`
    console.log(sql  )
    con.query(sql,(err,result)=>{
        if(err) throw err
        res.json({status:200,dataListcar:result})
    })
})

router.delete('/delete-car',(req,res)=>{
    const {uuid} = req.body;
    con.query(`DELETE listcar where uuid = ${con.escape(uuid)}`,(err,result)=>{
        if(err) throw err
        res.json({status:200,infoCar:'Modal car has been deleted'})
    })
})
module.exports = router;