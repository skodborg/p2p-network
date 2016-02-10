var http = require('http');
const crypto = require('crypto');
var nullPeer = { id : "null", ip : "null", port: "null" };

// TODO: toggle hashing

function peer(port, succ_port, pred_port) {
    var _successor;
    var _predecessor;

    function hashId(id){
      if (process.env.NOHASHING == 'true') {
        return port
      }
      return crypto.createHash('sha256').update(id).digest('hex');
    }

    function createPeer(ip, port){
      return {id : hashId(ip + port), ip : ip, port: port};
    }

    if (succ_port == "null") {
      _successor = nullPeer;
    }
    else {
      _successor = createPeer('localhost', succ_port);
    }


    if (pred_port == "null") {
      _predecessor = nullPeer;
    }
    else {
      _predecessor = createPeer('localhost', pred_port);
    }

    // NOTE: id equals port for now
    var _this = createPeer('localhost', port);


    function get_this(){
      return _this;
    }

    function get_successor() {
      return _successor;
    }

    function get_predecessor() {
      return _predecessor;
    }

    function notifyPredecessor(){
      _predecessor = nullPeer;
    }

    function notifySuccessor(node){
      _successor = node;
    }

    function leave(){
      httpRequest(_successor, '/peerRequests/notify_predecessor', {} , function(response){
            httpRequest(_predecessor, '/peerRequests/notify_successor', _successor , function(response){
                  _successor = nullPeer;
                  _predecessor = nullPeer;
            });      
      });
    }

    function find_successor(id, callback) {
      // base case: only one node in ring, it is the successor of everything
      if (_this.id == _successor.id && _this.id == _predecessor.id) {
        callback(_this);
      }
      
      // if the searched id is between this node and its successor, return the successor
      // - EDGE CASE: if this node is the last in ring (successor has lower id), and the
      //              searched id is higher, return the successor (first node in ring)
      else if (_this.id == id) {
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

    function find_predecessor(id, callback) {
      // base case: only one node in ring, it is the predecessor of everything
      if (_this.id == _successor.id && _this.id == _predecessor.id) {
        callback(_this);
      }
      else if (id == _this.id) {
        callback(_predecessor);
      }
      else if ((_this.id < id  && id <= _successor.id)  || 
               (_successor.id < _this.id && id > _this.id)) {
        callback(_this);
      }
      else {

        httpRequest(_successor, '/peerRequests/find_predecessor', {id : id} , function(response){
              callback(JSON.parse(response));
        });
      }
    }

    function notify(peer) {
      // base case: only one node in ring, the peer is now our new successor AND predecessor.
      if (_this.id == _successor.id && _this.id == _predecessor.id) {
        _predecessor = peer;
        _successor = peer;
      }

      // if the predecessor has left the network or is not known yet, accept the notify request
      else if (_predecessor.id == "null") {
        _predecessor = peer;
      }

      // new node has joined, or stabilization attemts to update pointers
      else if ((peer.id < _this.id && peer.id > _predecessor.id) ||
               (_predecessor.id > _this.id && peer.id > _predecessor.id)) {
        _predecessor = peer;
      }
    }

    var joined = true

    function join(peer) {
      joined = false
      httpRequest(peer, '/peerRequests/find_successor', {id : _this.id} , function(response){
        _successor = JSON.parse(response);
        httpRequest(_successor, '/peerRequests/notify', _this , function(response){});
      });
      joined = true
    }

    function stabilize() {
      if (!joined) {
        return
      }
      if(_successor.id == "null" && _predecessor.id == "null"){
        return;
      }
      httpRequest(_successor, '/peerRequests/find_predecessor', {id : _successor.id}, function(response){
        var successorsPredecessor = JSON.parse(response);

        // if our successor has no predecessor, notify it of us
        if(JSON.stringify(successorsPredecessor) == JSON.stringify(nullPeer)){
          httpRequest(_successor, '/peerRequests/notify', _this , function(response){});
        }

        // if our successor's predecessor should actually be our new successor, update
        else if ((successorsPredecessor.id < _successor.id && successorsPredecessor.id > _this.id)
                || (_this.id > _successor.id && successorsPredecessor.id > _this.id)) {
          _successor = successorsPredecessor;
          httpRequest(_successor, '/peerRequests/notify', _this , function(response){});
        }
      });
    }
    
    


    function httpRequest(peer, link, content, callback) {
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
          res.on('data', function(chunk) {
            response += chunk;
          });

          res.on('end', function() {
            callback(response);
          });
      });

      post_req.write(JSON.stringify( content ));
      post_req.end();
    }
    if(process.env.STABILIZE == 'ON'){
      setInterval(stabilize, 1000);
    }
    

return {
      find_successor : find_successor,
      find_predecessor : find_predecessor,
      join : join,
      get_successor : get_successor,
      get_predecessor : get_predecessor,
      notify : notify,
      stabilize : stabilize,
      notifyPredecessor : notifyPredecessor,
      notifySuccessor : notifySuccessor,
      leave : leave,
      get_this : get_this

    }

}


module.exports = new peer(process.env.PORT, process.env.PORTSUCC, process.env.PORTPRED);
if (process.env.JOIN == 'true') {
  module.exports.join( {ip:'localhost', port:4000} )
}
