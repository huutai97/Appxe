var express = require('express');
var router = express.Router();
const {resolve} = require('path');
const con = require(resolve('./configs/database'));
const session = require('express-session');
const jwt = require('jsonwebtoken');
const auth = require(resolve('./configs/auth'))

router.get('/',(req,res,next)=>{
    const sql = `select * from years`
    con.query(sql,(err,result)=>{
        if(err) throw err
        let data = result;
        res.json({data:data})
    })
})

router.post('/them-namsx',(req,res)=>{
    const {uuid, idphim, namsanxuat} = req.body;
    const sql = `insert into years (uuid,idphim,namsanxuat) values (${con.escape(uuid)},${con.escape(idphim)},${con.escape(namsanxuat)})`;
    con.query(sql,(err,result)=>{
        if(err) throw err
        let data = result
        res.json({data:data})
    })
})

router.delete('/xoa-namsx/:id',(req,res)=>{
    const sql = `delete from years where id= ` + `${con.escape(id)}`;
    con.query(sql,(err,result)=>{
        if(err) throw err
        res.json({meesage:'Đã xóa thành công'})
    })
})