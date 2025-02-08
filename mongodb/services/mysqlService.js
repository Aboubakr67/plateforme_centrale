const { mysqlConnection } = require("../config");

const executeProcedure = (procedureName) => {
    return new Promise((resolve, reject) => {
        mysqlConnection.query(`CALL ${procedureName}()`, (error, results) => {
            if (error) {
                return reject(error);
            }
            resolve(results[0]);
        });
    });
};

module.exports = { executeProcedure };
