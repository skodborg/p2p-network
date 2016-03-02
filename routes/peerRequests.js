var express = require('express');
var router = express.Router();
//require('longjohn');



router.delete('/predecessor', function(req, res, next){
  var peer = req.app.get('peer');

  peer.notifyPredecessor();
  res.send(JSON.stringify({status : "ok"}));
});

router.get('/predecessor', function(req, res, next){
  var peer = req.app.get('peer');

  
  res.send(JSON.stringify(peer.get_predecessor()));
});


router.put('/successor', function(req, res, next){
  var peer = req.app.get('peer');

  var node = req.body;
  peer.notifySuccessor(node);

  res.send(JSON.stringify({status : "ok"}));
});

router.get('/successor', function(req, res, next){
  var peer = req.app.get('peer');

  
  res.send(JSON.stringify(peer.get_successor()));
});

router.get('/find_successor/:id*', function(req, res, next) {
  var peer = req.app.get('peer');
  var id = req.params.id;



  res.setHeader('Content-Type', 'application/json');

  peer.find_successor(id, function(json){
    res.set("Connection", "close");
    res.send(JSON.stringify(json));
  });
});

router.get('/find_resource/:id*', function(req, res, next) {
  var peer = req.app.get('peer');
  var id = req.params.id;



  res.setHeader('Content-Type', 'application/json');

  peer.find_resource(id, function(json){
    res.set("Connection", "close");
    res.send(JSON.stringify(json));
  });

});

router.get('/fingertable', function(req, res, next) {
  var peer = req.app.get('peer');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({fingerTable : peer.getFingertable()}));
});

router.get('/find_predecessor/:id*', function(req, res, next) {
  var peer = req.app.get('peer');

  var id = req.params.id;
  res.set("Connection", "close");
  res.setHeader('Content-Type', 'application/json');

  peer.find_predecessor(id, function(json){
    res.send(JSON.stringify(json));
  });
});

router.post('/notify', function(req, res, next){
  var peer = req.app.get('peer');

  var newPeer = req.body;

  peer.notify(newPeer);
  res.send(JSON.stringify({status : "ok"}));
});

router.post('/join', function(req, res, next){
  var peer = req.app.get('peer');

  var newPeer = req.body;
  peer.join(req.body);
  res.send(JSON.stringify({status : "ok"}));
});

router.post('/leave', function(req, res, next) {
  var peer = req.app.get('peer');

  peer.leave();
  res.send(JSON.stringify({status : "ok"}));
});

router.post('/stabilize', function(req, res, next) {
  var peer = req.app.get('peer');
  
  peer.stabilize();
  res.send(JSON.stringify({status: "ok"}));
});

router.post('/fixfingers', function(req, res, next) {
  var peer = req.app.get('peer');
  
  peer.fix_fingers();
  res.send(JSON.stringify({status: "ok"}));
});

router.post('/updateFingerTable', function(req, res, next) {
  var peer = req.app.get('peer');
  var body = req.body;

  peer.updateFingerTable(body.peer, body.i);
  res.send(JSON.stringify({status: "ok"}));
});

router.post('/registerPhoton', function(req, res, next) {
  var peer = req.app.get('peer');
  var body = req.body;

  peer.registerPhoton(body);

  res.send(JSON.stringify({status: "ok"}));
});

router.get('/resourceList', function(req, res, next){
  var peer = req.app.get('peer');
  res.send(JSON.stringify({resourceList : peer.getResourceList()}));
});

router.put('/resourceList', function(req, res, next){
  var peer = req.app.get('peer');
  peer.moveResourceKeys();
  res.send(JSON.stringify({status : "ok"}));
});


router.put('/updateBackup', function(req, res, next){
  var peer = req.app.get('peer');
  var body = req.body;

  peer.updateBackup(body, function(){
   res.send(JSON.stringify({status : "OK"}));
  });


});

router.get('/resourceTable', function(req, res, next) {
  var peer = req.app.get('peer');

  var id = req.params.id;


  res.set("Connection", "close");
  res.setHeader('Content-Type', 'application/json');

  peer.getResourceData(function(json){
    res.send(JSON.stringify(json));
  });
});

router.get('/resourceTable/:timeStamp*', function(req, res, next) {
  var peer = req.app.get('peer');
  var timeStamp = req.params.timeStamp;
  

  res.set("Connection", "close");
  res.setHeader('Content-Type', 'application/json');
  
  peer.getResourceDataFiltered(timeStamp, function(json){
    res.send(JSON.stringify(json));
  });
});


module.exports = router;
