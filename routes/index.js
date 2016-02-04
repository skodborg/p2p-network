var express = require('express');
var router = express.Router();




/* GET home page. */
router.get('/', function(req, res, next) {
  var peer = req.app.get('peer');
  res.render('index', { successor : peer.get_successor() , predecessor : peer.get_predecessor()  });
});

router.post('/', function(req, res, next) {
  var peer = req.app.get('peer');

  peer.join(req.body);
  res.render('index', { successor : peer.get_successor() , predecessor : peer.get_predecessor()  });
});

router.post('/stabilize', function(req, res, next) {
  var peer = req.app.get('peer');

  peer.stabilize();
  res.render('index', { successor : peer.get_successor() , predecessor : peer.get_predecessor()  });
});

module.exports = router;
