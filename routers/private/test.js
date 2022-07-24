const { Console } = require('console');
var express = require('express');
const fileUpload = require('express-fileupload');
var router = express.Router();
const {resolve} = require('path');
const { consumers } = require('stream');
const con = require(resolve('./configs/database'));
const axios = require('axios').default;
const cache = require(resolve('./configs/cache'));
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const multer = require('multer');

var upload = multer({
  storage: multer.diskStorage({
      destination: function(req, file, callback) { callback(null, './routers/avatar/test/'); },
      filename: function(req, file, callback) { 
          
              callback(null, file.fieldname + '-' + Date.now() + file.originalname); 
      
          
      }
  }),
  // fileFilter: function(req, file, callback) {
  //     var ext = path.extname(file.originalname)
  //     if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
  //         return callback( /*res.end('Only images are allowed')*/ null, false)
  //     }

  //     callback(null, true)
  // }
})

router.get('/get/',(req,res)=>{
    const {link} = req.params
    axios({
        method: 'get',
        url: 'https://api.hydrax.net/7dc288422e5cb52a5759eb6c02b2016e/drive/1RqP7D35qlvDfhoDPafb9rqobK_otp-1d',
   
      })
        .then(function (response) {
          res.json({data: response.data.slug})
        });
        var string = 'https://drive.google.com/file/d/1xW9epGyWCmH_SDH3vlPky2SJ_oEb9YXq/view'
        var split = string.split('/')
        console.log(split[5])
})

router.post('/xoa-tap/:id',(req,res)=>{
  const {id} = req.params;
  const {eid, name, link} = req.body;
  const sql = `SELECT *, JSON_EXTRACT(tap, '$') FROM films WHERE id= ${con.escape(id)}`
  con.query(sql,(err,result)=>{
    if(err) throw err
    var [phim] = result
    if(phim){
      var episodes = JSON.parse(phim.tap) || [];
      var indexEpisodes = episodes.findIndex(x=>x.id == eid);
      if(indexEpisodes > -1){
        episodes[indexEpisodes] = {
          ...[episodes[indexEpisodes]]
          .splice(1,3)
        }
      } 
    }
    con.query(`UPDATE films SET tap= ${con.escape(JSON.stringify(episodes))} WHERE id = ${con.escape(id)}`,(err,result)=>{
      if (err) throw err;
      res.json({status: 200})
    })
   })
})

router.put('/upload',upload.any(),async (req,res)=>{
  let query = req.body;
  if (!req.body && !req.files) {
      res.json({ success: false });
  } else {
      sharp(req.files[0].path).webp({lossless:true}).toBuffer().toFile('./routers/avatar/test/'+ '262x317-', function(err) {
          if (err) {
              console.error('sharp>>>', err)
          }
          console.log('ok okoko')
      })
  }
})
module.exports = router;