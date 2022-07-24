// const axios = require('axios').default;
// const redis = require('redis');

// (async () => {
//     redisClient = redis.createClient();
  
//     redisClient.on("error", (error) => console.error(`Error : ${error}`));
  
//     await redisClient.connect();
// })();

// const fetchApiData = async(species)=> {
//     const apiResponse = await axios.get(
//       `http://localhost:8000/api/phim/trang-chu/${species}`
//     );
//     console.log("Request sent to the API");
//     return apiResponse.data;
// }

exports.moduleCache = async (req,res,next)=>{
    try{
        const species = req.params.species;
        const cache = await redisClient.get(species)
        if(cache){
            result = JSON.parse(cache)
            res.json({status:false,data:result})
        }
        else{
            let result = await fetchApiData(species)
            if(result.length === 0){
                throw "Rỗng";
            }
            await redisClient.set(species, JSON.stringify(result), {EX: 24 * 60 * 60 *1800,NX: true,});   
            console.log('Data is cached') 
            res.send({
            fromCache: 'cache ok',
            data: result,
            });
        }
    }
    catch(err){
        console.error(err);
        res.status(404).send("Data unavailable");
    }
    
}
