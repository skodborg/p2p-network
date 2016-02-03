var http = require('http');


function peer(id){

    // var _this = { id : 2000, ip : 'localhost', port: 2000};
    // var _successor = { id : 2002, ip : 'localhost', port: 2002};
    // var _predecessor = { id : 2004, ip : 'localhost', port: 2004};

    // var _this = { id : 2002, ip : 'localhost', port: 2002};
    // var _successor = { id : 2004, ip : 'localhost', port: 2004};
    // var _predecessor = { id : 2000, ip : 'localhost', port: 2000};

    // var _this = { id : 2004, ip : 'localhost', port: 2004};
    // var _successor = { id : 2000, ip : 'localhost', port: 2000};
    // var _predecessor = { id : 2002, ip : 'localhost', port: 2002};


    function find_successor(id, callback){

      
      // TODO EXPLAIN EDGE CASE, ID IS HIGHER THEN LAST NODE IN RING
      if((_this.id < id  && id <= _successor.id)  || 
         (_successor.id < _this.id && id > _this.id)){

        callback(_successor);
      
      }else{
        
        var post_options = {
            host : _successor.ip,
            port: _successor.port,
            path: '/peerRequests/find_successor',
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            }
        };

        // Set up the request
        var post_req = http.request(post_options, function(res) {
            var response = "";
            res.on('data', function (chunk) {
              response += chunk;
            });

            res.on('end', function(){
              callback(JSON.parse(response));
            })

        });
        post_req.write(JSON.stringify({id : id }));

        post_req.end();

      }
    }

    function find_predecessor(id){
      // TODO: implement
      return { successor : _successor };
    }


    function join(node){
      // TODO: implement
    }

    return {
      find_successor : find_successor,
      find_predecessor : find_predecessor,
      join : join
    }


}


module.exports = new peer(process.env.PORT);