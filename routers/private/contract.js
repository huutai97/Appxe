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
    con.execute(`SELECT name,departureDay,status FROM contract WHERE isDeleted IS NULL`,(err,result)=>{
        if(err) throw err
        let data = result
        res.json({status:200,dataConstract:data})
    })
})
.post((req,res)=>{
    const {name, IDdrivers, IDmodalCar, IDcustomer, valueContract, amountRecive, amountRemaining, paymentTern, dateContract, VAT, note, departureDay, destination, uuid} = req.body;
    con.execute(`UPDATE contract SET name = ${con.escape(name)}, IDdrivers=${con.escape(IDdrivers)}, IDmodalCar=${con.escape(IDmodalCar)}, IDcustomer=${con.escape(IDcustomer)}, valueContract=${con.escape(valueContract)}, amountRecive=${con.escape(amountRecive)}, amountRemaining=${con.escape(amountRemaining)}, paymentTern=${con.escape(paymentTern)}, dateContract=${con.escape(dateContract)}, VAT=${con.escape(VAT)}, note=${con.escape(note)}, departureDay=${con.escape(departureDay)}, destination=${con.escape(destination)} where uuid=${con.escape(uuid)}`,(err,result)=>{
        if(err) throw err
        res.json({status:200,message:'Constact has been updated'})
    })
})
.put((req,res)=>{
    const uuid = uuidv4();
    const {name, IDdrivers,nameCustomer,IDmodalCar, IDcustomer, valueContract, amountRecive, amountRemaining, paymentTern, dateContract, VAT, note, departureDay, destination} = req.body;
        con.execute(`INSERT INTO contract (name, IDdrivers, IDmodalCar, IDcustomer, valueContract, amountRecive, amountRemaining, paymentTern, dateContract, VAT, note, departureDay, destination, uuid) VALUES (${con.escape(name)}, ${con.escape(IDdrivers)}, ${con.escape(IDmodalCar)}, ${con.escape(IDcustomer)}, ${con.escape(valueContract)}, ${con.escape(amountRecive)}, ${con.escape(amountRemaining)}, ${con.escape(paymentTern)}, ${con.escape(dateContract)}, ${con.escape(VAT)}, ${con.escape(note)}, ${con.escape(departureDay)}, ${con.escape(destination)}, ${con.escape(uuid)})`,(err,result2)=>{
         if(err) throw err
         let data = result2
         res.json({status:200,messsage:data})
        })
   
  
})
.delete(auth.protect,checkPermission,(req,res)=>{
    const {uuid} = req.body;
    var objectDelete = {
        time: Date.now(),
        by: req.data?.id
    }
    con.execute(`UPDATE contract SET isDeleted=${con.escape(JSON.stringify(objectDelete))} WHERE uuid = ${con.escape(uuid)}`,(err,result)=>{
        if(err) throw err
        res.json({status: 200})
    })

})

router.get('/info',(req,res)=>{
    const {uuid, idCustomer, idDrivers, idCar} = req.body
        con.query(`SELECT * FROM contract WHERE uuid=${con.escape(uuid)};SELECT id,name FROM customer WHERE ID = ${con.escape(idCustomer)};SELECT id,name FROM drivers WHERE id= ${con.escape(idDrivers)};SELECT id,modal FROM listcar WHERE id=${con.escape(idCar)}`,(err,result)=>{
            if(err) throw err
            let [[data],customer,drivers,car]= result
            res.json({infoContract:{
                ...data,customer,drivers,car
            }})
            res.end()
        })


  
})

router.post('/status',(req,res)=>{
    const {uuid, status} = req.body;
    con.execute(`UPDATE contract SET status=${con.escape(status)} where uuid=${con.escape(uuid)}`,(err,result)=>{
        if(err) throw err
        res.json({status:200,message:'Status has been updated'})
    })
})
router.get('/sort',(req,res)=>{
    const {status} = req.body;
    con.execute(`SELECT * FROM contract where status=${con.escape(status)}`,(err,result)=>{
        if(err) throw err
        res.json({status:200,data:result})
    })
})

router.delete('/delete-contract',(req,res)=>{
    const {uuid} = req.body
    con.execute(`DELETE contract WHERE uuid= ${con.escape(uuid)}`)
})

module.exports = router;