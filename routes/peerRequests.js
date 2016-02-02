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

router.get('/find_predecessor', function(req, res, next) {
  var peer = req.app.get('peer');


  res.setHeader('Content-Type', 'application/json');
  
  res.send(JSON.stringify(peer.find_predecessor(0)));
});


router.get('/join', function(req, res, next) {
  var peer = req.app.get('peer');


  res.setHeader('Content-Type', 'application/json');
  
  res.send(JSON.stringify(peer.join(0)));
});




module.exports = router;
