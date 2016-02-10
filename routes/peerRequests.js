var express = require('express');
var router = express.Router();


router.post('/find_successor', function(req, res, next) {
  var peer = req.app.get('peer');

  var json = req.body;
  var id = json.id;

  res.setHeader('Content-Type', 'application/json');

  peer.find_successor(id, function(json){
    res.send(JSON.stringify(json));
  });


});

router.post('/notify_predecessor', function(req, res, next){
  var peer = req.app.get('peer');

  peer.notifyPredecessor();

  res.send(JSON.stringify({status : "ok"}));
});

router.post('/notify_successor', function(req, res, next){
  var peer = req.app.get('peer');

  var node = req.body;

  peer.notifySuccessor(node);

  res.send(JSON.stringify({status : "ok"}));
});

router.post('/find_predecessor', function(req, res, next) {
  var peer = req.app.get('peer');

  var json = req.body;
  var id = json.id;

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

module.exports = router;
