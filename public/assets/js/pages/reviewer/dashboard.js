jQuery(document).ready(function($){
	console.log('reacy');
	
	var url = window.APP_API_URL+'/api/reviewer/letter-stats';
	$.ajax({
		url, 
		headers:getHeader(),			
		success:function (data) {
			console.log('data',data);
			if(data.status==1){
				var stats = data.message;
				$('#txtTotalIncomingLetter').html(stats.totalIncomingLetters);
				$('#txtTotalOutgoingLetter').html(stats.totalOutgoingLetters);
			}else{
				
			}
			
		}.bind(this),
		error:function(error){			
			console.log(error);
			if(error.statusText!="abort"){
				alert('Request Failed: '+error.responseText, 'error');
			}
		}
	}).done(function(){
		
		//that.setState({loading:false});
	});
	
	

});
