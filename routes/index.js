var express = require('express');
var router = express.Router();




/* GET home page. */
router.get('/', function(req, res, next) {
  var peer = req.app.get('peer');
  res.render('index', 
  	{ successor : peer.get_successor() , predecessor : peer.get_predecessor(), searchResult : ""});
});

router.post('/', function(req, res, next) {
  var peer = req.app.get('peer');

  peer.join(req.body);
  res.render('index', { successor : peer.get_successor() , predecessor : peer.get_predecessor(), searchResult : ""  });
});

router.post('/stabilize', function(req, res, next) {
  var peer = req.app.get('peer');

  peer.stabilize();
  res.render('index', { successor : peer.get_successor() , predecessor : peer.get_predecessor(), searchResult : ""  });
});

router.get('/leave', function(req, res, next) {
  var peer = req.app.get('peer');

  peer.leave();
  res.render('index', { successor : peer.get_successor() , predecessor : peer.get_predecessor(), searchResult : ""  });
});

router.post('/findID', function(req, res, next) {
  var peer = req.app.get('peer');
  peer.find_successor(req.body.id, function(json){

  	var searchResultText = json;
    res.render('index', { successor : peer.get_successor() , predecessor : peer.get_predecessor(), searchResult : searchResultText  });
  });

  peer.stabilize();
  
});

module.exports = router;
