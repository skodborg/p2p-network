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

	$("#fixfingers").click(function(){
		$.post( "peerRequests/fixfingers", function( data ) {});
	});



	$( "#findID" ).submit(function( event ) {
	  var id = $("#findID :input")[0].value;
	  $.get( "peerRequests/find_successor/"+id, function( data ) {

	  	var text = createLink(data);
	  	$(".findIDResult").html(text)
	  });
	  event.preventDefault();
	});

	$( "#searchID" ).submit(function( event ) {
	  var id = $("#searchID :input")[0].value;
	  $.get( "peerRequests/find_resource/"+id, function( data ) {

	  	var text = createLink(data);
	  	$(".searchIDResult").html(text)
	  });
	  event.preventDefault();
	});


	$( "#photonDevice" ).submit(function( event ) {
	  
	  var id = $("#photonDevice :input")[0].value;

	  var accessToken = $("#photonDevice :input")[1].value;

	  $.post( "peerRequests/registerPhoton",  { photonId : id, accessToken : accessToken }, function( data ) {

	  	/*var text = createLink(data);
	  	$(".findIDResult").html(text)*/
	  	alert("Photon is registered");
	  });
	  event.preventDefault();
	});

	$("#leave").click(function(){

		$.post( "peerRequests/leave", function( data ) {});
	});

	setInterval(updatePeerData, 5000);
	createDataTable();
	
}
var testData = "teest";
function updatePeerData(){
	createDataTable();
	$.get( "peerRequests/successor", function( newData ) { 
		newData = JSON.parse(newData);
		$("#succ .ip").html(newData.ip);

		$("#succ .id").html(newData.id);

		$("#succ .port").html(newData.port);

		$("#succ .link").html(createLink(newData));
	});

	$.get( "peerRequests/predecessor", function( newData ) { 
		newData = JSON.parse(newData);
		$("#pred .ip").text(newData.ip);

		$("#pred .id").text(newData.id);

		$("#pred .port").text(newData.port);

		$("#pred .link").html(createLink(newData));
	});

	$.get("peerRequests/fingertable", function( newData ){

		newData = newData.fingerTable;

		var table = "<table>";
		table+= "<td>";
		table+= "FINGERID";
		table+="</td>";
		table+= "<td>";
		table+= "IP";
		table+="</td>";
		table+= "<td>";
		table+= "PORT";
		table+="</td>";
		table+= "<td>";
		table+= "ID";
		table+="</td>";


		for(i = 0; i < newData.length; i++){
			if(typeof(newData[i]) !== 'undefined' && newData[i] != null){
				table+= "<tr>";
				table+="<td>";
				table+= newData[i].fingerID;
				table+= "</td>";
				table+="<td>";
				table+= newData[i].ip;
				table+= "</td>";
				table+="<td>";
				table+= newData[i].port;
				table+= "</td>";
				table+="<td>";
				table+= newData[i].id;
				table+= "</td>";
				table+="</tr>";
			}
		}

		table += "</table>";
		$(".fingerTable").html(table)	
	});

	
	updateResourceList();
}

function updateResourceList(){
	$.get("peerRequests/resourceList", function( newData ){
	newData = JSON.parse(newData);
		newData = newData.resourceList;

		var table = "<h3>ResourceList</h3><table>";
		table+= "<td>";
		table+= "Photon Id";
		table+="</td>";
		table+= "<td>";
		table+= "AccessToken";
		table+="</td>";
		table+= "<td>";
		table+= "Diode status";
		table+="</td>";
		table+= "<td>";
		table+= "Light status";
		table+="</td>";
		table+= "<td>";
		table+="</td>";


		for(i = 0; i < newData.length; i++){
			if(typeof(newData[i]) !== 'undefined' && newData[i] != null){
				table+= "<tr>";
				table+="<td>";
				table+= newData[i].photonId;
				table+= "</td>";
				table+="<td>";
				table+= newData[i].accessToken;
				table+= "</td>";
				table+='<td id="'+newData[i].photonId + 'diode">';
				table+="</td>";
				table+='<td id="'+newData[i].photonId + 'light">';
				table+="</td>";
				table+="<td>";
				table+='<input type="button" value="Toggle diode" onclick="toggleDiode(\''+newData[i].photonId+'\',\''+newData[i].accessToken+'\')">';
				table+="</td>";
				table+="</tr>";

				var callBackFunction = function(photon){

					$.get("https://api.spark.io/v1/devices/"+ photon.photonId+"/light?access_token="+ photon.accessToken, function(data){
						$("#"+photon.photonId + "light").html(data.result);
				
					});

					$.get("https://api.spark.io/v1/devices/"+ photon.photonId+"/diode?access_token="+ photon.accessToken, function(data){
						var answer = "on";

						if(data.result == false){
							answer = "off";
						}

						$("#"+photon.photonId + "diode").html(answer);

					});


				}
				callBackFunction(newData[i]);
				

			}
		}

		table += "</table>";
		$(".resourceList").html(table)	
	});
}

function toggleDiode(photonId, accessToken){
	$.post("https://api.spark.io/v1/devices/"+ photonId+"/toggleDiode?access_token="+ accessToken, function(data){ updateResourceList() });		
}

function createLink(data){
	 return '<a href="http://'+data.ip+':'+data.port+'">Click here</a>';
}

function createDataTable(){
	
	$.get( "peerRequests/resourceTable", function(response){
		console.log(response);


		var dataList = response.resourceList;

		var i = dataList.length;

		var data = [];

		while(i--){

			var lightData = dataList[i].lightData;
			var timeStamps = dataList[i].timeStamps;
			var diodeData = dataList[i].diodeData;

			var trace1 = { x : timeStamps, y : lightData, type : 'scatter', name: dataList[i].id};
			//var trace2 = { x : timeStamps, y : diodeData, type : 'scatter', name: dataList[i].id};
			data.push(trace1);
			//data.push(trace2);

		}

		Plotly.newPlot('graph', data);
	});
	

}

