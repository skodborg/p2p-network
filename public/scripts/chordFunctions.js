$( document ).ready(prepPage);


function prepPage(){
	$( "#join" ).submit(function( event ) {
	  var ip = $("#join :input")[0].value;
	  var port = $("#join :input")[1].value;
	  $.post( "http://"+ip+":"+port+"/peerRequests/join", function( data ) {});
	  event.preventDefault();
	});

	$("#stabilize").click(function(){

		$.post( "peerRequests/stabilize", function( data ) {});
	});

	$( "#findID" ).submit(function( event ) {
	  console.log("do something");
	  var id = $("#findID :input")[0].value;
	  $.get( "peerRequests/find_successor/"+id, function( data ) {

	  	var text = createLink(data);
	  	$(".findIDResult").html(text)
	  });
	  event.preventDefault();
	});

	$("#leave").click(function(){

		$.post( "peerRequests/leave", function( data ) {});
	});

	setInterval(updatePeerData, 1000);
}
var testData = "teest";
function updatePeerData(){
	$.get( "peerRequests/successor", function( newData ) { 
		newData = JSON.parse(newData);
		$("#pred .ip").html(newData.ip);

		$("#pred .id").html(newData.id);

		$("#pred .port").html(newData.port);

		$("#pred .link").html(createLink(newData));
	});

	$.get( "peerRequests/predecessor", function( newData ) { 
		newData = JSON.parse(newData);
		$("#succ .ip").text(newData.ip);

		$("#succ .id").text(newData.id);

		$("#succ .port").text(newData.port);

		$("#succ .link").html(createLink(newData));
	});

	$.get("peerRequests/fingertable", function( newData ){

		newData = newData.fingerTable;

		var table = "<table>";
		table+= "<td>";
		table+= "ID";
		table+="</td>";
		table+= "<td>";
		table+= "IP";
		table+="</td>";
		table+= "<td>";
		table+= "PORT";
		table+="</td>";
		table+= "<td>";
		table+= "HASH";
		table+="</td>";


		for(i = 0; i < newData.length; i++){
			table+= "<tr>";
			table+="<td>";
			table+= newData[i].id;
			table+= "</td>";
			table+="<td>";
			table+= newData[i].ip;
			table+= "</td>";
			table+="<td>";
			table+= newData[i].port;
			table+= "</td>";
			table+="<td>";
			table+= newData[i].hash;
			table+= "</td>";
			table+="</tr>";
		}

		table += "</table>";
		$(".fingerTable").html(table)	
	});

}

function createLink(data){
	 return '<a href="http://'+data.ip+':'+data.port+'">Click here</a>';
}