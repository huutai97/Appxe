var mysql = require('mysql2');
var con = mysql.createPool({
    host: "localhost",
    user: "root",
    password : "",
    database: 'apixe',
    multipleStatements: true
});



module.exports = con;