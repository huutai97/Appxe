var express = require('express');
var router = express.Router();
const {resolve} = require('path');
const con = require(resolve('./configs/database'))
const fileUpload = require('express-fileupload');
const { json } = require('body-parser');
const auth = require(resolve('./configs/auth'))
const { v4: uuidv4 } = require('uuid');

const checkPerrmission = (req,res,next)=>{
    let [data] = req.data;
    if(data.role == 'admin' || data.role == 'mod'){
        next()
    }else{
        res.json({message:'Bạn không có quyền thực thi '})
    }
}

router.get("/", (req,res) => {
    try{
        const page = Math.floor(Number(req.query.page));
        if(!isNaN(page) && Number(page) > 0) {
            const limt = 5;
            const offset = (page - 1) * limt;
            const sql = `select * from films where status= 'active'  limit` + ` ${con.escape(limt)} ` + `offset ` + `${con.escape(offset)} ` ;
            console.log(sql)
            con.query(sql,(err,result)=>{
            if(err) throw err
            let data = result
            res.status(200).json({status: 200,data:data})
         })
        }else{
            const sql = `select * from films where status= 'active'`
            con.query(sql,(err,result)=>{
                if(err) throw err
                let data = result;
                res.json({status:200,data:data})
            })
           
        }
    }
    catch{
        res.json({message:"Không có phim bạn cần tìm"})
    }
})

//get 1 phim
router.get("/info-phim/:id", (req,res) => {
    const id = req.params.id;
    const sql = `select * from films where id= ${con.escape(id)};select * from category;select namsanxuat from years where idphim= ${con.escape(id)} `;
    con.query(sql,(err,result)=>{
        if(err) throw err
        let [[data],category,years] = result;
        let tapPhim = JSON.parse(data.tap) || [];
        var views = JSON.parse(data.views) || [];
        res.status(200).json({infoPhim : {
            ...data,category:category,
            namsanxuat:years,
            tap:tapPhim,
            views: views?.map(x=> x.view)?.reduce((a,b)=> a+b,0,),
        }})
    })
})

//get top phim
// router.get('/top-phim',(req,res,next)=>{
//     const sql = `select * from (select sum(luotxem) from films where DATE(ngaytao) >= DATE(now))`;
//     con.query(sql,(err,result)=>{
//         if(err) throw err
//         let data = result
//         res.json({data:data})
//     })
// })


// tìm phim
router.get('/tim-phim',(req,res)=>{
    const {name,values} = req.query;
    const sql = `SELECT * from films WHERE namsanxuat= '%${values}%' OR tenviet  LIKE '%${name}%' OR tenanh  LIKE '%${name}%'` 
    con.query(sql,(err,result)=>{
        if(err) throw err
        let data = result
        res.json({data:data})
    })
})

//Phim theo năm
router.get('/nam-san-xuat/:year',(req,res)=>{
    const {year} = req.params;
    const sql = `SELECT * FROM films WHERE namsanxuat= ${con.escape(year)}`
    con.query(sql,(err,result)=>{
        if(err) throw err
        res.json({data:result})
    })  
})

// thêm phim
router.post("/them-phim",auth.protect,checkPerrmission,fileUpload(), (req,res) => {
    var uuid = uuidv4();
    var thumbnail;
    var uploadPath; 
    thumbnail = req.files.thumbnail;
        if(thumbnail.mimetype == 'image/jpeg' || thumbnail.mimetype == 'image/png' || thumbnail.mimetype == 'image/jpg'){
            if (!req.files || Object.keys(req.files).length === 0) {
                return res.status(400).send('No files were uploaded.');
            }
            uploadPath =  ('./routers/image/') + thumbnail.name;
            thumbnail.mv(uploadPath);
            }
            else{
                res.json({message:'Tính làm gì đó....'})
            }
            const {tenviet, tenanh, slugviet, sluganh,trailer, mota, luotthich, tags, seo, thoiluong, chatluong, theloai, quocgia, namsanxuat, trangthaiphim, idnguoitao,status,tendienvien,tendaodien} = req.body;
            const listDienVien = tendienvien.split(',')
                for(var i = 0, len = listDienVien.length; i < len; i++){
                    var splitDienVien = listDienVien[i]?.split('|');
                      listDienVien.push({
                      id: uuidv4(),
                      tendienvien: splitDienVien[0]
                    })
                  }
                const sql =  `INSERT INTO films (uuid, tenviet, tenanh, slugviet, sluganh, trailer, thumbnail, mota, luotthich, tags, seo, thoiluong, chatluong, theloai, quocgia, namsanxuat, trangthaiphim, status,tendienvien) VALUES (${con.escape(uuid)},${con.escape(tenviet)},${con.escape(tenanh)},${con.escape(slugviet)},${con.escape(sluganh)},${con.escape(trailer)},${con.escape(thumbnail.name)},${con.escape(mota)},${con.escape(luotthich)},${con.escape(tags)},${con.escape(seo)},${con.escape(chatluong)},${con.escape(thoiluong)},${con.escape(theloai)},${con.escape(quocgia)},${con.escape(namsanxuat)},${con.escape(trangthaiphim)}, ${con.escape(status)}, ${con.escape(JSON.stringify(listDienVien))})`
                con.query(sql,(err,result)=>{    
                    if(err) throw err
                    let data = result
                    res.json({data:data})
                })

})

// thêm tập phim
router.post("/them-tap/:id", (req,res) => {
    const {id} = req.params
    const {episode} = req.body || []
    const sql = `SELECT *, JSON_EXTRACT(tap, '$') AS tap FROM films WHERE ID = ${con.escape(id)}`
    con.query(sql,(err,result)=>{
      var [phim] = result
      if(phim){
        var list = episode.split(',')
        var episodes = JSON.parse(phim.tap) || [];
        for(var i = 0, len = list.length; i < len; i++){
          var splitItem = list[i]?.split('|');
          episodes.push({
            id: uuidv4(),
            tentap: splitItem[0],
            link: splitItem[1]
          })
        }
      }
      con.query(`UPDATE films SET tap= ${con.escape(JSON.stringify(episodes))} WHERE id = ${con.escape(id)}`,(err,result)=>{
        if(err) throw err
        res.json({status: 200})
      })
    })
  })

//user đăng nhập
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
                    var token = jwt.sign({id:result[0].id},'the-super-strong-secrect',{ expiresIn: '8h' });
                    con.query(
                    `UPDATE users SET last_login = now() WHERE id = '${result[0].id}'`
                    );
                    req.session.id = data.id;
                    res.cookie('access_token',token,{
                        maxAge: Date.now() + 24 * 60 * 60 * 1000,
                        httpOnly: true ,
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
    }else{
        res.json({message:'Vừa có lỗi gì đó xảy ra...'})
    }
    
})

// chỉnh sữa thông tin phim
router.put("/edit-thong-tin-phim/:id", fileUpload(),(req,res) => {
    const id = req.params.id
    const {tenviet, tenanh, slugviet, sluganh,trailer, mota, tags, seo, thoiluong, chatluong, theloai, quocgia, namsanxuat, trangthaiphim, idnguoitao,status,tendaodien} = req.body;
    var thumbnail;
    var uploadPath; 
    thumbnail = req.files.thumbnail;
    if(thumbnail.mimetype == 'image/jpeg' || thumbnail.mimetype == 'image/png' || thumbnail.mimetype == 'image/jpg'){
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.');
        }
        uploadPath =  ('./routers/image/') + thumbnail.name;
        thumbnail.mv(uploadPath);
        }
    else{
            res.json({message:'Tính làm gì đó....'})
        }
        const sql =  `UPDATE films SET tenviet= (${con.escape(tenviet)}), tenanh= (${con.escape(tenanh)}),slugviet= (${con.escape(slugviet)}),sluganh= (${con.escape(sluganh)}),trailer= (${con.escape(trailer)}),thumbnail= (${con.escape(thumbnail.name)}), mota= (${con.escape(mota)}),tags= (${con.escape(tags)}),seo= (${con.escape(seo)}),thoiluong= (${con.escape(thoiluong)}), chatluong= (${con.escape(chatluong)}),theloai= (${con.escape(theloai)}),quocgia= (${con.escape(quocgia)}),namsanxuat= (${con.escape(namsanxuat)}),trangthaiphim= (${con.escape(trangthaiphim)}), lastedit = now() where id =${con.escape(id)}`;
        con.query(sql,(err,result)=>{
            if(err) throw err
            res.json({status:200,message:'chỉnh sữa phim is okela'})
        }) 
       
})

// chỉnh sửa diễn viên
router.put('/edit-dienvien-phim/:id',(req,res)=>{
    const {id} = req.params
    const {eid,ten} = req.body;
    con.query(`SELECT tendienvien,JSON_EXTRACT(tendienvien,'$') FROM films where id=${con.escape(id)}`,(err,result)=>{
        if(err) throw err
        var [data] = result;
        if(data){
           var editDienVien =  JSON.parse(data.tendienvien) || [];
           var idDienVien = editDienVien.findIndex(x=>  x.id == eid)   
           if(idDienVien > -1){
                editDienVien[idDienVien] = {
                    ...editDienVien[idDienVien],
                    tendienvien: ten
                }
               con.query(`UPDATE films SET tendienvien= ${con.escape(JSON.stringify(editDienVien))}`)
           }else{
            res.end();
           }
   
        }
    })
})

// chỉnh sửa tập phim
router.put("/edit-tap/:id", (req,res) => {
    const {id} = req.params;
    const {eid, name, link} = req.body;
    const sql = `SELECT tap, JSON_EXTRACT(tap, '$') FROM films WHERE id= ${con.escape(id)}`
    con.query(sql,(err,result)=>{
      if (err) throw err;
      var [phim] = result;
      if(phim){
        var episodes = JSON.parse(phim.tap) || [];
        var indexEpisodes = episodes.findIndex(x=> x.id == eid);
        if(indexEpisodes > -1){
          episodes[indexEpisodes] = {
            ...episodes[indexEpisodes],
            tentap: name,
            link: link
          }
          con.query(`UPDATE films SET tap= ${con.escape(JSON.stringify(episodes))} WHERE id = ${con.escape(id)}`,(err,result)=>{
            if (err) throw err;
            res.json({status: 200})
          })
        }else{
          res.end()
        }
      }else{
        res.end()
      }
    }) 
  })

//get phim hot
router.get('/phim-hot',(req,res)=>{
    con.query(`SELECT * FROM films where hotphim= 'yes' limit 8`,(err,result)=>{
        res.json({status:200,data:result})
    })
})

//yes no phim hot
  router.get('/status-hot-phim/:status/:id',(req,res)=>{
    const id = req.params.id;
    const status = req.params.status;
    let currenStatus = (status === 'yes') ? "yes" : "no";
    const sql = `UPDATE films set hotphim = (${con.escape(currenStatus)}) where id= `+ `${con.escape(id)}`;
    con.query(sql,(err,result)=>{
        if(err) throw err;
        let [data] = result
        res.status(200).json({status:200,data:data})
    })
})

//status phim
router.get('/status-phim/:status/:id',(req,res)=>{
    const id = req.params.id;
    const status = req.params.status;
    let currenStatus = (status === 'active') ? "inactive" : "active";
    const sql = `UPDATE films set statusphim = (${con.escape(currenStatus)}) where id= `+ `${con.escape(id)}`;
    con.query(sql,(err,result)=>{
        if(err) throw err;
        let [data] = result
        res.status(200).json({status:200,data:data})
    })
})

// delete phim 
router.delete("/:id", (req,res) => {
    const id = req.params.id
    sql = `delete from films where id = ` + `${con.escape(id)}`; 
    con.query(sql,(err,resutl)=>{
        if(err) throw err
        let [data] = result;
        res.json({message:true,data:data})
    })
})

//delete tập phim
router.delete("/delete-tap-phim/:id", (req,res) => {
    const id = req.params.id
    sql = `delete from episode where id = ` + `${con.escape(id)}`; 
    con.query(sql,(err,resutl)=>{
        if(err) throw err
        let [data] = result;
        res.json({message:true,data:data})
    })
})

module.exports = router