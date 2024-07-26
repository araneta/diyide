jQuery(document).ready(function($){
	var id = window.pageData ? window.pageData.ID: '';
	if(!id){
		
		return;				
	}else{
		
	}
	
	if(id){
		
		var url = window.APP_API_URL+'/api/approver/incoming-letters/'+id;
		$.ajax({
			url, 
			headers:getHeader(),			
			success:function (data) {
				console.log('data',data);
				if(data.status==1){
					var msg = data.message;
					for (var key in msg) {   
						var elm = $('#'+key);
						if(elm.attr('data-type')=='date'){
							elm.html(toLocalDate(data.message[key]));
						}else{
							elm.html(data.message[key]);
						}					 
					}
					var file = msg.attachment;
					var fname = msg.fileName
					$('#existingAttachment a').attr('href', window.APP_API_URL+'/api/admin/file/'+file+'/'+fname);
					$('#existingAttachment').show();
					bindOpenPDF();
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
