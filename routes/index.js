var express = require('express');
var router = express.Router();


function handleBaseDesign(req, res, next){
  var peer = req.app.get('peer');
  res.render('index', 
    { thisId : peer.get_this().id , successor : peer.get_successor() , predecessor : peer.get_predecessor(), searchResult : ""});
}

/* GET home page. */
router.get('/', handleBaseDesign);
router.get('/join', handleBaseDesign);
router.get('/stabilize', handleBaseDesign);
router.get('/findID', handleBaseDesign);

router.post('/join', function(req, res, next) {
  var peer = req.app.get('peer');

  peer.join(req.body);

  res.render('index', { thisId : peer.get_this().id , successor : peer.get_successor() , predecessor : peer.get_predecessor(), searchResult : ""  });
});

router.post('/stabilize', function(req, res, next) {
  var peer = req.app.get('peer');

  peer.stabilize();
  res.render('index', { thisId : peer.get_this().id , successor : peer.get_successor() , predecessor : peer.get_predecessor(), searchResult : ""  });
});

router.get('/leave', function(req, res, next) {
  var peer = req.app.get('peer');

  peer.leave();
  res.render('index', { thisId : peer.get_this().id , successor : peer.get_successor() , predecessor : peer.get_predecessor(), searchResult : ""  });
});

router.post('/findID', function(req, res, next) {
  var peer = req.app.get('peer');
  peer.find_successor(req.body.id, function(json){

  	var searchResultText = json;
    res.render('index', {thisId : peer.get_this().id ,  successor : peer.get_successor() , predecessor : peer.get_predecessor(), searchResult : searchResultText  });
  });

  peer.stabilize();
  
});

module.exports = router;
