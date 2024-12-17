module.exports.Helper={
    formatLogData : async function(object){
        let data = JSON.stringify(object);
        data = JSON.parse(data);
        return data;
    }
}