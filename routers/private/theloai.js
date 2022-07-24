var express = require('express');
var router = express.Router();
const {resolve} = require('path'); 
const { off } = require('process');
const con = require(resolve('./configs/database'))

router.get("/", (req,res) => {
    const page = Math.floor(Number(req.query.page));
    const limit = 2;
    const offset = (page -1) * limit;
    if(!isNaN(page && Number(page) > 0)){
        sql= `select * from category LIMIT ` + `${con.escape(limit)}` + ` offset` + ` ${con.escape(offset)}`;
        con.query(sql,(err,result)=>{
            if(err) throw err
            let data = result;
            res.status(200).json({status: 200,data:data})
        })
    }
  
})

router.post("/", (req,res) => {
    const {uuid, tentheloai, motatheloai} = req.body;
    const sql= `INSERT INTO category (uuid,tentheloai,motatheloai) VALUES (${con.escape(uuid)},${con.escape(tentheloai)},${con.escape(motatheloai)})`
    con.query(sql,(err,result)=>{
        if(err) throw err
        let data = result;
        res.status(200).json({status: 200,data:data})
    })
})

router.put("/:id", (req,res) => {
    const id = req.params.id;
    const {uuid, tentheloai, motatheloai} = req.body;
    sql = `update into category set uuid = (${con.escape(uuid)}), tentheloai=(${con.escape(tentheloai)}), motatheloai= (${con.escape(motatheloai)})`;
    con.query(sql,(err,result)=>{
        if(err) throw err
        let data = result;
        res.status(200).json({status:true,data:data});
    })
})

router.delete("/:id", (req,res) => {
    const id = req.params.id;
    sql = `DELETE FROM CATEGORY WHERE ID= ` + `${con.escape(id)}`;
    con.query(sql,(err,result)=>{
        if(err) throw err
        let data = result;
        res.status(200).json({status:true,data:data})
    })
})

router.get("/:id", (req,res) => {
    const id = req.params.id;
    sql = `SELECT * FROM CATEGORY ` + `${con.escape(id)}`;
    con.query(sql,(err,result)=>{
        if(err) throw err
        let data = result;
        res.status(200).json({status:true,data:data})
    })
})

module.exports = router