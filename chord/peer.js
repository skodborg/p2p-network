var http = require('http');


function peer(id){

    var _this = {id : id};
    var _successor = { id : 1238, ip : 'localhost', port: 1235};
    var _predecessor = {id : id};


    function find_successor(id, callback){

      console.log("This id: " + _this.id);
      console.log("Succes id: " + _successor.id);
      console.log("Request id: " + id);
      if(_this.id < id  && id <= _successor.id){
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
              console.log(response);
              // TODO: HANDLE RESPONSE 
            })

        });
        post_req.write(JSON.stringify({id : id}));

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