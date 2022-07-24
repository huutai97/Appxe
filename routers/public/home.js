const { Console } = require('console');
var express = require('express');
var router = express.Router();
const {resolve} = require('path');
const con = require(resolve('./configs/database'));
const moment = require("moment");

// get tất cả phim hoặc phân trang
router.get("/", (req,res) => {
   const page = Math.floor(Number(req.query.page));
   if(!isNaN(page) && Number(page) > 0){
    const limit = 5
    const offset = (page - 1) * limit
    const sql = `select * from films limit ` + `${con.escape(limit)}` + ` offset` + ` ${con.escape(offset)}`;
    con.query(sql,(err,result)=>{
        if(err) throw err;
        let data = result;
        res.status(200).json({status:200,data:data})
    })
   } 
   else{
    const sql2 = `select * from films`
    con.query(sql2,(err,result)=>{
        if(err) throw err
        let data = result;
        res.json({data:data})
    })
   }
})

router.get('/tu-phim',(req,res)=>{
    res.json(req.session.cart || [])
})

router.get('/top-phim',(req,res)=>{
    const sql = `select idphim,luotxem from topfilms where ngaytao=DATE(NOW() - INTERVAL 7 DAY)  order by luotxem desc limit 5;select idphim,luotxem from topfilms where ngaytao=DATE(NOW() - INTERVAL 1 DAY) limit 5 `
    con.query(sql,(err,result)=>{
        if(err) throw err
        let [top7day,top1day] = result
        res.json({top7day:top7day,top1day:top1day})
    })
})
 
// get phim theo id 
router.get("/:id",(req,res)=>{
    const {id} = req.params
    con.query(`SELECT *, JSON_EXTRACT(views, '$') as views FROM films WHERE id = ${con.escape(id)};SELECT * FROM comment WHERE id=${con.escape(id)};`, (err,result)=>{
        if(err) throw err
        var [[phim],comment] = result;
        if(phim){
            var listEpisode = JSON.parse(phim.tap) || []
            var views = JSON.parse(phim.views) || [];
            var today = moment().format("DD-MM-YYYY");
            var indexViews = views.findIndex(x=> x.date === today);
            if(indexViews > -1){
                views[indexViews] = {
                    ...views[indexViews],
                    view: views[indexViews].view + 1
                }
            }else{
                views.unshift({
                    date: today,
                    view: 1
                })
            }
            var infoOut = {
                ...phim,
                views: views?.map(x=> x.view)?.reduce((a,b)=> a+b,0,),
                tap: listEpisode,
                comment:comment
            } 
            res.json({status: 200, data: infoOut})
            con.query(`UPDATE films SET views = ${con.escape(JSON.stringify(views))} WHERE id = ${con.escape(id)}`);
        }else{
            res.json({status: 404})
        }
    })
})

//Button like phim (logic chưa đúng)
// router.put('/like-phim/:id',(req,res)=>{
//     const id = req.params.id;
//     const sql = `update films set luotthich = luotthich +1 where id=` + `${con.escape(id)}`;
//     con.query(sql,(err,result)=>{
//         if(err) throw err
//     })
// })

//Button like comment (logic chưa đúng)
// router.put('/like-binhluan/:id',(req,res)=>{
//     const {id} = req.params;
//     const action = req.body;
//     const counter = action === 'likeComment' ? 1 : -1;
//     const sql = `update comment set likeComment = likeComment ${con.escape(counter)} where id=` + `${con.escape(id)}`;
//     console.log(sql)
//     con.query(sql,(err,result)=>{
//         if(err) throw err
//         res.json({message:'Like + 1'})
//     })
// })


//get bình luận trong phim
router.get('/binh-luan/:id/',(req,res,next)=>{
    const {id,userID} = req.params;
    var sql = `SELECT * FROM films where id = ${con.escape(id)};select * from comment where idphim= ${con.escape(id)};select id,ten,role from users where trangthai='active';select * from replycomment where idphim=${con.escape(id)} and trangthai='active'`;
    con.query(sql,(err,result)=>{
        if(err) throw err
        var [[dataPhim], commentFilm,[UserComment],UserReply] = result;
        console.log(UserComment.ten)
        res.json({
            status:200,
            info: {
                ...dataPhim,
                binhluan: commentFilm,
                traloibinhluan:UserReply
            },
        })
    })
})

// user post bình luận
router.post('/binh-luan/:id/user/:userID',(req,res,next)=>{
    const {id,userID} = req.params;
    const {binhluan} = req.body;
   var sql = `SELECT * FROM films where id = ${con.escape(id)}  ; SELECT ten,role from users where id = ${con.escape(userID)}; select * from comment where idphim= ${con.escape(id)}`;
     con.query(sql, function (err, result1) {
        if (err) throw err;
        let likebl = 0
        var [dataPhim, [dataUser],commentBy] = result1;
        let tennguoibl = dataUser.ten;
        let rolenguoibl = dataUser.role;
                const sql2 = `insert into comment (idphim,idnguoibl,binhluan,tennguoibl,rolenguoibl,likeComment) values (${con.escape(id)},${con.escape(userID)},${con.escape(binhluan)},${con.escape(tennguoibl)},${con.escape(rolenguoibl)},${con.escape(likebl)})`;
                con.query(sql2,(err,result2)=>{
                    if(err) throw err
                })
        res.json({
        result: dataPhim,
        commentBy:commentBy 
        })
    });
})


//Reply bình luận
router.post('/reply-bl/:idComment/user-reply/:idnguoibl/phim/:idphim',(req,res,next)=>{
    const {idnguoibl,idComment,idphim} = req.params;
    const {uuid,binhluan} = req.body;
    const sql1 = `select id,ten,role from users where id= ${con.escape(idnguoibl)}`; 
    con.query(sql1,(err,result)=>{
        if(err) throw err;
        let [data] = result
        const sql2 = `insert into replyComment (uuid,idphim,idComment,idnguoibl,binhluan,tennguoibl,rolenguoibl,trangthai) values (${con.escape(uuid)},${con.escape(idphim)},${con.escape(idComment)},${con.escape(idnguoibl)},${con.escape(binhluan)},${con.escape(data.ten)},${con.escape(data.role)},'active')`;
        con.query(sql2,(err,result)=>{
          if(err) throw err
        })
        res.json({status:200,message:'reply comment thành công'})
    }) 
})

// DELETE BÌNH LUẬN
router.delete('/xoa-binhluan/:id',(req,res)=>{
    const id = req.params.id
    const sql = `delete from comment where id= ` + `${con.escape(id)}`
    con.query(sql,(err,result)=>{
        if(err) throw err
        res.json({status:200,message:'Đã xóa bình luận'})
    })
})

//save phim 2
router.get('/tu-phim/:id',(req,res,next)=>{
    const {id} = req.params;
    con.query(`select * from films where id= ${con.escape(id)}`,(err,result)=>{
        if(err) throw err;
            let [data] = result;
            var filmArray = {
            id : req.params.id,
            tenviet : data.tenviet,
            tenanh : data.tenanh,
            thumnail : data.thumbnail
        }
        var cartPhim = req.session.cart || [];
        var index = cartPhim.findIndex(x=> x.id === id)
        if(index === -1){
            cartPhim.push(filmArray)
        }
        req.session.cart = cartPhim
        res.json(cartPhim)
    })
});

module.exports = router