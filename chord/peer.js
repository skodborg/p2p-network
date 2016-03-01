var http = require('http');
var https = require('https');

const crypto = require('crypto');

var nano = require('nano')('http://localhost:5984');

var nullPeer = { id : "null", ip : "null", port: "null" };

function peer(port, succ_port, pred_port) {
  var _successor;
  var _predecessor;
  var _fingerTable = [];
  var _hashLength = 3;
  var _resourceList = [];

  nano.db.create("port" + port);
  var dbOnPort = nano.db.use("port" + port);

  function hashId(id){
    if (process.env.NOHASHING == 'true') {
      return port
    }

    if(typeof process.env.HASH !== 'undefined'){
      return parseInt(process.env.HASH);
    }

    var hashString = crypto.createHash('sha256').update(id).digest('hex');
    hashString = hashString.slice(0, _hashLength);

    return parseInt(hashString, 16);
  }

  function createPeer(ip, port){
    return {id : hashId(ip + port), ip : ip, port: parseInt(port)};
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
                var i = _resourceList.length;

                while(i--){
                  postRequest(_successor, '/peerRequests/registerPhoton', _resourceList[i], function(response){ });
                }

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
      getRequest(closestPreceedingFinger(id), '/peerRequests/find_successor/'+id, function(response){
            callback(JSON.parse(response));
      }, function(){
        getRequest(_successor, '/peerRequests/find_successor/'+id, function(response){
          callback(JSON.parse(response));
        });
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
      getRequest(closestPreceedingFinger(id), '/peerRequests/find_predecessor/'+id, function(response){
            callback(JSON.parse(response));
      });
    }
  }

  function notify(peer) {
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
            getRequest(_successor, '/peerRequests/find_predecessor/'+_successor.id, function(response){
              _predecessor = JSON.parse(response);
              
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

  function fix_fingers() {
    if(_successor.id == "null" ){
      return;
    }
    // find the successor peer of the key corresponding to the ith finger table
    // entry and update the table with this peer
    var i = Math.floor(Math.random() * (_fingerTable.length - 1)) + 1;
    ith_finger_start = fingerStart(i);

    getRequest(_successor, '/peerRequests/find_successor/'+ith_finger_start, function(response){
      fingerTableEntry = JSON.parse(response);
      fingerTableEntry.fingerID = fingerStart(i);
      _fingerTable[i] = fingerTableEntry;
    });
  }

  function postRequest(peer, link, content, callback, errorCallback) {
    httpRequest(peer, link, content, callback, "POST", errorCallback);
  }

  function getRequest(peer, link, callback, errorCallback, tries){
     if(typeof tries !== 'undefined'){
      tries = 3;
     }
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
    }).on('error', function(err) {
        if(typeof errorCallback !== 'undefined' && tries == 0){
          errorCallback();
        }else{
          getRequest(peer, link, callback, errorCallback, (tries--));
      }
    });
  }

  function getRequestOut(link, callback){
     var get_options = {
        host : 'api.spark.io',
        path : link, 
        //port: 80,
        //url: link,
        //url: "www.simonfischer.com",
        followAllRedirects: true,
        agent: false
    };
    https.get(get_options, function(res) {
      var response = "";
      res.on('data', function(chunk) {
        response += chunk;
      });

      res.on('end', function() {
        callback(response);
      });
    });
  }

  function deleteRequest(peer, link, callback, errorCallback) {
    httpRequest(peer, link, "", callback, "DELETE", errorCallback);
  }

  function putRequest(peer, link, content, callback, errorCallback) {
    httpRequest(peer, link, content, callback, "PUT", errorCallback);
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
    if (typeof i === 'undefined') {
      i = 1;
    }
    if (i >= _hashLength*4) {
      postRequest(_successor, '/peerRequests/notify', _this , function(response) {
        updateOthers();
      });
      return;
    }
    var fingerID = fingerStart(i+1);
    if(fingerID >= _this.id && fingerID < _fingerTable[i].id){
      _fingerTable[i+1] = JSON.parse(JSON.stringify(_fingerTable[i]));
      _fingerTable[i+1].fingerID = fingerID;
      initFingertable(i+1);
    }
    else {
      getRequest(_successor, '/peerRequests/find_successor/'+fingerID, function(response) {
        returnedSuccessor = JSON.parse(response);

        returnedSuccessor.fingerID = fingerID;

        _fingerTable[i+1] = returnedSuccessor;
        initFingertable(i+1);
      });
    }
  }

  function updateOthers(i){
      if (typeof i === 'undefined') {
        i = 1;
      }
      if (i > _hashLength*4) {
        putRequest(_successor, '/peerRequests/resourceList', {}, function(response){});
        return;
      }
    
      var pred_search_id = (_this.id - Math.pow(2, i-1)).mod(Math.pow(2, _hashLength*4));
      getRequest(_successor, '/peerRequests/find_predecessor/'+pred_search_id, function(response){
        returnedPredecessor = JSON.parse(response);
        postRequest(returnedPredecessor, '/peerRequests/updateFingerTable', {peer : _this, i : i}, function(response){});
        updateOthers(i+1); 
      });
    
  }

  function is_between(this_id, between_peer, ith_finger, i) {
    // WHEN JOINING: this_id equals ith_finger, true when joining
    if(ith_finger == this_id){
      if(between_peer > this_id) {
        if(fingerStart(i) <= between_peer) {
          return true;
        }
      }

      if(between_peer < this_id){
        if(fingerStart(i) > this_id || fingerStart(i) <= between_peer){
          return true;
        }
      }
    }


    if (!(between_peer >= fingerStart(i) || 
         (ith_finger < fingerStart(i) && between_peer < ith_finger))) {
      // if between_peer is smaller than the finger table id it is supposed to be the immediate
      // successor of, then it obviously isn't, and we return false

      // otherwise, if the ith_finger is smaller than the finger table id it is the immediate
      // successor of, we are handling the over-the-top case, and we need to make sure that
      // the new between_peer is smaller than the previous ith_finger (to jump 'less' over the top)
      return false;
    }
    
    if (this_id <= between_peer && between_peer < ith_finger) {
      return true;
    }

    else if (ith_finger < this_id && between_peer < ith_finger) {
      return true;
    }

    else if (ith_finger < this_id && between_peer > this_id) {
      return true;
    }
    return false;
  }

  function updateFingerTable(peer, i){


    var hashMaxLength = (_hashLength * 4)-1;
    var ith_finger_node = _fingerTable[i].id;

    if(is_between(_this.id, peer.id, ith_finger_node, i)){
      peer.fingerID = _fingerTable[i].fingerID;
      _fingerTable[i] = peer;
      postRequest(_predecessor, '/peerRequests/updateFingerTable', {peer : peer, i : i}, function(response){
      });
    }
  }

  function fingerStart(k){
    return (_this.id + Math.pow(2, k-1)) % Math.pow(2, _hashLength*4);
  }

  function closestPreceedingFinger(key) {
    for(i = _fingerTable.length-1; i > 0; i--) {
      if((_fingerTable[i].id >= _this.id && _fingerTable[i].id <= key) ||
         (key < _this.id && (_fingerTable[i].id > _this.id || _fingerTable[i].id < key))) {
        if(_fingerTable[i].id != _this.id) {
          return _fingerTable[i];
        }
      }
    }
    return _successor;
  }

  /////////////////////////
  //// FINGERTABLES END ///
  /////////////////////////


  function registerPhoton(photon){
    var hashedID = hashId(photon.photonId);
    find_successor(hashedID, function(data){
      var index = listContains(photon, _resourceList);
      if(_this.id == data.id){

        if(index == -1){

          _resourceList.push(photon);
        }

      }else{

        if(index != -1){

          _resourceList.pop(_resourceList[index]);
        }
        postRequest(data, '/peerRequests/registerPhoton', photon , function(response){});

      }
    });


  }

  function listContains(object, list){
    var i = list.length;
    while(i--){
      if(list[i].photonId == object.photonId) break;
    }
    return i;
  }

  function getResourceList(){
    return _resourceList;
  }

  function moveResourceKeys(){
    var i = _resourceList.length;
    while(i--){
      registerPhoton(_resourceList[i]);
    }
  }

  function find_resource(id, callback){

    find_successor(hashId(id), callback);
  }

  function httpRequest(peer, link, content, callback, method, errorCallback, tries) {
    if(typeof tries !== 'undefined'){
      tries = 3;
    }
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
          tries = -1;
        });
    });
    post_req.write(JSON.stringify( content ));

    post_req.on('error', function(err) {
      if(typeof errorCallback !== 'undefined' && tries == 0){
        errorCallback();
      }else{
        httpRequest(peer, link, content, callback, method, errorCallback, (tries--));
      }
    });

    post_req.end();
  }


  function logResourceList(){
    var i = _resourceList.length;
    while(i--){
      var host = "https://api.spark.io";
      var base = "/v1/devices/"+ _resourceList[i].photonId+"/";
      var link = base + "light?access_token="+ _resourceList[i].accessToken;
      var link2 = base + "diode?access_token="+ _resourceList[i].accessToken;
      var photonId = _resourceList[i].photonId;

      getRequestOut(link, function(response){
        var lightData = JSON.parse(response);
        getRequestOut(link2, function(reponse){
          var diodeData = JSON.parse(reponse);
          logResourceData(lightData.result, diodeData.result, photonId);
        });
      });
        //"/v1/devices/"+ photon.photonId+"/light?access_token="+ photon.accessToken
    }
  }


  function getResourceData(callback, i){
    
    var keys = {keys : []};
    var i = _resourceList.length;
    var returnValue = { resourceList : []};
    while(i--){
      keys.keys.push("dataId" + _resourceList[i].photonId);
    }
    dbOnPort.fetch(keys, function(err, body){
      var values = body.rows;
      var returnValue = {resourceList : []};

      i = values.length;

      while(i--){
        var tempDoc = values[i].doc;
        delete tempDoc['_rev'];
        var id = tempDoc._id;

        id = id.slice(6, id.length);

        delete tempDoc['_id']

        tempDoc.id = id;

        returnValue.resourceList.push(tempDoc);
      }
      callback(returnValue);
    });
  }

  function logResourceData(lightData, diodeData, dataId){

     dbOnPort.get("dataId"+dataId, function(err, body){
      if(err || typeof body == 'undefined'){
        body = {
          lightData : [],
          diodeData : [],
          timeStamps : []
        }
      }

      body.lightData.push(lightData);
      body.diodeData.push(diodeData);
      body.timeStamps.push(new Date().getTime());
      dbOnPort.insert(body, "dataId"+dataId);

    }); 
  }

  if(process.env.STABILIZE == 'ON'){
    setInterval(stabilize, 1000);
    setInterval(fix_fingers, 1000);
    setInterval(logResourceList, 5000);
  }




  return {
      find_successor : find_successor,
      find_predecessor : find_predecessor,
      find_resource : find_resource,
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
      updateFingerTable : updateFingerTable,
      fix_fingers : fix_fingers,
      registerPhoton : registerPhoton,
      getResourceList : getResourceList,
      moveResourceKeys : moveResourceKeys,
      getResourceData : getResourceData
    }


}

Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
};

module.exports = new peer(process.env.PORT, process.env.PORTSUCC, process.env.PORTPRED);
if (process.env.JOIN == 'true') {
  module.exports.join( {ip:'localhost', port:4000} )
}
