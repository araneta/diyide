jQuery(document).ready(function($){
	var id = window.pageData ? window.pageData.ID: '';
	if(id){
		var url = window.APP_API_URL+'/api/reviewer/outgoing-letters/'+id;
		$.ajax({
			url, 
			headers:getHeader(),			
			success:function (data) {
				console.log('data',data);
				if(data.status==1){
					
					var letter = data.message;
					
					
					$('#msg').html(letter.content);
					window.print();
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
	}
	
});
