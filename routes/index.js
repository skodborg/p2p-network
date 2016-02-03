var express = require('express');
var router = express.Router();




/* GET home page. */
router.get('/', function(req, res, next) {
  var peer = req.app.get('peer');


  res.render('index', { successor : peer.get_successor() , predecessor : peer.get_predecessor()  });
});

module.exports = router;
