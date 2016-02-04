var http = require('http');


function peer(id, succ_id, pred_id){

    // NOTE: id equals port for now
    var _this = { id : id, ip : 'localhost', port: id};
    var _successor = { id : succ_id, ip : 'localhost', port: succ_id};
    var _predecessor = { id : pred_id, ip : 'localhost', port: pred_id};

    function get_successor(){
      return _successor;
    }

    function get_predecessor(){
      return _predecessor;
    }

    function find_successor(id, callback){
      
      // if the searched id is between this node and its successor, return the successor
      // - EDGE CASE: if this node is the last in ring (successor has lower id), and the
      //              searched id is higher, return the successor (first node in ring)
      if (_this.id == id) {
        // searched id equals this node's id; return self
        callback(_this);
      } 
      else if ((_this.id < id  && id <= _successor.id)  || 
               (_successor.id < _this.id && id > _this.id)) {
        // searched id is between this node and its successor; return successor
        callback(_successor);  
      }
      else {
        // searched id is not this node, nor its immediate neighbourhood;
        // pass request around the ring through our successor
        httpRequest(_successor, '/peerRequests/find_successor', {id : id} , function(response){
              callback(JSON.parse(response));
        });
        
      }
    }

    function find_predecessor(id, callback){
      if (id == _this.id) {
        callback(_predecessor);
      }
      else if ((_this.id < id  && id <= _successor.id)  || 
               (_successor.id < _this.id && id > _this.id)) {
        callback(_this);
      }
      else {
        var post_options = {
            host : _successor.ip,
            port: _successor.port,
            path: '/peerRequests/find_predecessor',
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            }
        };

        var post_req = http.request(post_options, function(res) {
            var response = "";
            res.on('data', function (chunk) {
              response += chunk;
            });

            res.on('end', function(){
              callback(JSON.parse(response));
            })

        });
        post_req.write(JSON.stringify( {id : id} ));
        post_req.end();
      }
    }

    function notify(peer){
      
      if(peer.id < _this.id && peer.id > _predecessor.id){
        _predecessor = peer;
      }else if(peer.id < _successor.id){
        _successor = peer;
      }

    }

    function join(peer){

    }

    return {
      find_successor : find_successor,
      find_predecessor : find_predecessor,
      join : join,
      get_successor : get_successor,
      get_predecessor : get_predecessor,
      notify : notify
    }


    function httpRequest(peer, link, content, callback){
      var post_options = {
            host : peer.ip,
            port: peer.port,
            path: link,
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            }
        };

        // perform request and handle response
        var post_req = http.request(post_options, function(res) {
            var response = "";
            res.on('data', function (chunk) {
              response += chunk;
            });

            res.on('end', function(){
              callback(response);
            })

        });
        post_req.write(JSON.stringify( content ));
        post_req.end();
    }
}


module.exports = new peer(process.env.PORT, process.env.PORTSUCC, process.env.PORTPRED);