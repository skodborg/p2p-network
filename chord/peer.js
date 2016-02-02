function peer(id){

    var _id = id;
    var _successor = id;
    var _predecessor = id;



    function find_successor(id){


      return { successor : _successor };
    }

    function find_predecessor(id){

      return { successor : _successor };
    }


    function join(node){

      return { successor : _successor };

    }

    return {
      find_successor : find_successor,
      find_predecessor : find_predecessor,
      join : join
    }



}

module.exports = new peer(process.env.PORT);