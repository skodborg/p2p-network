var express = require('express');
var router = express.Router();




/* GET home page. */
router.get('/', function(req, res, next) {
  var peer = req.app.get('peer');


  res.render('index', { title: 'Succes: ' + peer.find_sucessor(0)  });
});

module.exports = router;
