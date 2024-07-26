jQuery(document).ready(function($){
	// Note that the name "myDropzone" is the camelized
	  // id of the form.
	  var headers = getHeader();
	  delete(headers['Content-Type']);
	  console.log(headers);
	  Dropzone.options.myDropzone = {
		// Configuration options go here
		headers:headers,
		maxFiles: 1,
		acceptedFiles:"application/pdf",
		init: function() {
			this.on("addedfile", file => {
			  console.log("A file has been added");
			});
			this.on('error', function (file, errorMessage, xhrError) {
				this.removeFile(file);
				alert(errorMessage);
			});
		},
		success: function(file, response){
			//Here you can get your response.
			console.log(file, response);
			if(response.status==1){					
				$('input[name="fileName"]').val(file.name);
				$('input[name="attachment"]').val(response.message);
			}
		}
		  
	  };
	$('#btnSubmit').click(function(e){
		$('#frmEntry').submit();
	});
	var id = window.pageData ? window.pageData.ID: '';
	if(!id){
		$('#txtTitle').html('Tambah Surat Masuk');
		$('#existingAttachment').hide();
		return;				
	}else{
		$('#ID').val(id);
		$('#txtTitle').html('Update Surat Masuk');
		
	}
	
	if(id){
		var url = window.APP_API_URL+'/api/admin/incoming-letters/'+id;
		$.ajax({
			url, 
			headers:getHeader(),			
			success:function (data) {
				console.log('data',data);
				if(data.status==1){
					for (var key in data.message) {   
						var elm = $('[name="'+key+'"]');
						if(elm.attr('data-type')=='date'){
							elm.val(toLocalDate(data.message[key]));
						}else{
							elm.val(data.message[key]);
						}					 
					}
					var file = $('input[name="attachment"]').val();
					var fname = $('input[name="fileName"]').val();
					$('#existingAttachment a').attr('href', window.APP_API_URL+'/api/admin/file/'+file+'/'+fname);
					if(file){
						$('#existingAttachment').show();
					}else{
						$('#existingAttachment').hide();
					}
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
