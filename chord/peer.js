var http = require('http');
const crypto = require('crypto');

var nullPeer = { id : "null", ip : "null", port: "null" };

function peer(port, succ_port, pred_port) {
  var _successor;
  var _predecessor;
  var _fingerTable = [];
  var _hashLength = 1;

  function hashId(id){
    if (process.env.NOHASHING == 'true') {
      return port
    }

    var hashString = crypto.createHash('sha256').update(id).digest('hex');
    hashString = hashString.slice(0, _hashLength);

    return parseInt(hashString, 16);
  }

  function createPeer(ip, port){
    return {id : hashId(ip + port), ip : ip, port: port};
  }

  var _this = createPeer('localhost', port);

  if (succ_port == "null") {
    setSuccessor(nullPeer);
  }
  else {
    setSuccessor(createPeer('localhost', succ_port));
    initFingertable();
  }


  if (pred_port == "null") {
    _predecessor = nullPeer;
  }
  else {
    _predecessor = createPeer('localhost', pred_port);
  }

  // NOTE: id equals port for now
  



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
    setSuccessor(node);
  }

  function leave(){
    deleteRequest(_successor, '/peerRequests/predecessor' , function(response){
          putRequest(_predecessor, '/peerRequests/successor', _successor , function(response){
                setSuccessor(nullPeer);
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
    else if ((_this.id < id && id <= _successor.id)  || 
             (_successor.id < _this.id && (id > _this.id || id < _successor.id))) {
      // searched id is between this node and its successor; return successor¨
      callback(_successor);  
    }
    else {
      // searched id is not this node, nor its immediate neighbourhood;
      // pass request around the ring through our successor
      getRequest(_successor, '/peerRequests/find_successor/'+id, function(response){
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
    else if ((_this.id < id && id <= _successor.id)  || 
             (_successor.id < _this.id && (id > _this.id || id < _successor.id))) {
      callback(_this);
    }
    else {
      getRequest(_successor, '/peerRequests/find_predecessor/'+id, function(response){
            callback(JSON.parse(response));
      });

    }
  }

  function notify(peer) {
    console.log("NOTIFY : " + JSON.stringify(peer));
    // base case: only one node in ring, the peer is now our new successor AND predecessor.
    if (_this.id == _successor.id && _this.id == _predecessor.id) {
      _predecessor = peer;
      setSuccessor(peer);
    }

    // if the predecessor has left the network or is not known yet, accept the notify request
    else if (_predecessor.id == "null") {
      _predecessor = peer;
    }

    // new node has joined, or stabilization attemts to update pointers
    else if ((peer.id < _this.id && peer.id > _predecessor.id) ||
             (_predecessor.id > _this.id && (peer.id > _predecessor.id || peer.id < _this.id))) {
      _predecessor = peer;
    }
  }

  var joined = true

  function join(peer) {
    joined = false;
    getRequest(peer, '/peerRequests/find_successor/'+_this.id, function(response){
            setSuccessor(JSON.parse(response));     
            postRequest(_successor, '/peerRequests/notify', _this , function(response){
              initFingertable();
            });
    });

    joined = true
  }


  function stabilize() {
    var tempSuccessor = _successor
    if (!joined) {
      return
    }
    if(tempSuccessor.id == "null" && _predecessor.id == "null"){
      return;
    }
    getRequest(tempSuccessor, '/peerRequests/find_predecessor/'+tempSuccessor.id, function(response){
      var successorsPredecessor = JSON.parse(response);

              // if our successor has no predecessor, notify it of us
      if(JSON.stringify(successorsPredecessor) == JSON.stringify(nullPeer)){
  
        postRequest(tempSuccessor, '/peerRequests/notify', _this , function(response){});
      }

      // if our successor's predecessor should actually be our new successor, update
      else if ((successorsPredecessor.id < tempSuccessor.id && successorsPredecessor.id > _this.id)
              || (_this.id > tempSuccessor.id && (successorsPredecessor.id > _this.id 
              || successorsPredecessor.id < tempSuccessor.id))) {
        tempSuccessor = successorsPredecessor;
        postRequest(tempSuccessor, '/peerRequests/notify', _this , function(response){
          setSuccessor(tempSuccessor);
        });
      }
    });
  }
  
  


  function postRequest(peer, link, content, callback) {
    httpRequest(peer, link, content, callback, "POST");
  }

  function getRequest(peer, link, callback){
     var get_options = {
        host : peer.ip,
        port: peer.port,
        path: link,
        agent: false
    };
    http.get(get_options, function(res) {
      var response = "";
      res.on('data', function(chunk) {
        response += chunk;
      });

      res.on('end', function() {
        callback(response);
      });
    });
  }

  function deleteRequest(peer, link, callback) {
    httpRequest(peer, link, "", callback, "DELETE");
  }

  function putRequest(peer, link, content, callback) {
    httpRequest(peer, link, content, callback, "PUT");
  }

  function setSuccessor(successor){
    _successor = successor;
    var tempSuccessor = JSON.parse(JSON.stringify(successor));

    tempSuccessor.fingerID = fingerStart(1);
    _fingerTable[1] = tempSuccessor;

  }

  /////////////////////////
  ///// FINGERTABLES //////
  /////////////////////////

  function getFingertable(){
    return _fingerTable;
  }

  function initFingertable(i){
    if(typeof i === 'undefined'){
      i = 1;
    }
    if(i >= _hashLength*4){
      updateOthers();
      return;
    }
    var fingerID = fingerStart(i+1);
    if(fingerID >= _this.id && fingerID < _fingerTable[i].id){
      _fingerTable[i+1] = JSON.parse(JSON.stringify(_fingerTable[i]));
      _fingerTable[i+1].fingerID = fingerID;
      initFingertable(i+1);
    }else{
      getRequest(_successor, '/peerRequests/find_successor/'+fingerID, function(response){
          returnedSuccessor = JSON.parse(response);

          returnedSuccessor.fingerID = fingerID;

          _fingerTable[i+1] = returnedSuccessor;
          initFingertable(i+1);
      });
      
    }
  }

  function updateOthers(i){
      if(typeof i === 'undefined'){
      i = 1;
      }
      if(i > _hashLength*4){
        return;
      }
    
      //var pred_search_id = math.mod((_this.id - Math.pow(2, i-1)), Math.pow(2, _hashLength*4));
      var pred_search_id = (_this.id - Math.pow(2, i-1)).mod(Math.pow(2, _hashLength));

      getRequest(_successor, '/peerRequests/find_predecessor/'+pred_search_id, function(response){
        returnedPredecessor = JSON.parse(response);
        postRequest(returnedPredecessor, '/peerRequests/updateFingerTable', {peer : _this, i : i}, function(response){});
        updateOthers(i+1); 
      });
    
  }

  function updateFingerTable(peer, i){
    var hashMaxLength = (_hashLength * 4)-1;
    var fingerTableEntry = _fingerTable[i].id;

    if((peer.id >= _this.id && peer.id < fingerTableEntry)
      || (fingerTableEntry < _this.id && 
          ((hashMaxLength >= peer.id && peer.id >= _this.id)
            ||  (  peer.id >= 0 && peer.id < fingerTableEntry)))){

      peer.fingerID = _fingerTable[i].fingerID;
      _fingerTable[i] = peer;
      postRequest(_predecessor, '/peerRequests/updateFingerTable', {peer : peer, i : i}, function(response){
      });
    }
  }

  function fingerStart(k){

    return (_this.id + Math.pow(2, k-1)) %  Math.pow(2, _hashLength*4);
  }

  /////////////////////////
  //// FINGERTABLES END ///
  /////////////////////////


  function httpRequest(peer, link, content, callback, method) {
    var post_options = {
          host : peer.ip,
          port: peer.port,
          path: link,
          method: method,
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
      get_this : get_this,
      getFingertable : getFingertable,
      updateFingerTable : updateFingerTable

    }


}

Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
};

module.exports = new peer(process.env.PORT, process.env.PORTSUCC, process.env.PORTPRED);
if (process.env.JOIN == 'true') {
  module.exports.join( {ip:'localhost', port:4000} )
}
