const { CONNREFUSED } = require('dns');
var express = require('express');
var router = express.Router();
const {resolve} = require('path');
const con = require(resolve('./configs/database'))

router.get("/", (req,res) => {
    con.query(`select * from footer`,(err,result)=>{
        if(err) throw err
        let data = result;
        res.status(200).json({status:200,data:data})
    })
})

router.post("/add-info", (req,res) => {
    const {uuid, tenweb, email, sdt} = req.body;
    sql = `insert into footer (uuid, tenweb, email, sdt) VALUES (${con.escape(uuid)},${con.escape(tenweb)},${con.escape(email)},${con.escape(sdt)})`;
    con.query(sql,(err,result)=>{
        if(err) throw err
        res.status(200).json({status:200,data:data})
    })
})

router.put("/edit-info", (req,res) => {
    const {uuid, tenweb, email, sdt} = req.body;
    const sql = `update footer set uuid = ${con.escape(uuid)},tenweb = ${con.escape(tenweb)},email = ${con.escape(email)},sdt = ${con.escape(sdt)}`
    con.query(sql,(err,result)=>{
        if(err) throw err
        let data = result
        res.status(200).json({status:200,data:data})
    })
})



module.exports = router