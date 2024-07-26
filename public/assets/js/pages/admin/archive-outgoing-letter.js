jQuery(document).ready(function($){
	// Note that the name "myDropzone" is the camelized
	// id of the form.
	var headers = getHeader();
	delete(headers['Content-Type']);
	console.log(headers);
	
	Dropzone.options.myDropzone2 = {
		// Configuration options go here
		headers:headers,
		acceptedFiles:"application/pdf",
		maxFiles: 1,
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
				$('input[name="archiveFileName"]').val(file.name);
				$('input[name="archiveAttachment"]').val(response.message);
			}
		}
	  
	};
	var id = window.pageData ? window.pageData.ID: '';
	if(!id){
		$('#txtTitle').html('Tambah Surat Keluar');
		$('#existingAttachment').hide();
		$('#revisionBox').hide();
		return;				
	}else{
		$('#ID').val(id);
		$('#txtTitle').html('Update Surat Keluar');
		$('#revisionBox').show();

	}
	
	if(id){
		var url = window.APP_API_URL+'/api/admin/outgoing-letters/'+id;
		$.ajax({
			url, 
			headers:getHeader(),			
			success:function (data) {
				console.log('data',data);
				if(data.status==1){
					
					var letter = data.message;
					
					for (var key in letter) {   
						var elm = $('[name="'+key+'"]');
						if(elm.attr('data-type')=='date'){
							elm.val(toLocalDate(letter[key]));
						}else{
							elm.val(letter[key]);
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
					$('#fieldInput').prop('disabled', true);
					$('#btnArchive').click(function(e){
						e.preventDefault();
						$('#frmArchive').submit();
					});
					
					var fname = letter.no.replaceAll('\/','-')+'.docx';
					var urlContent = window.APP_API_URL+'/api/admin/file/'+letter.docxFile+'/'+fname;
					var lnkContent = '<a href="'+urlContent+'" target="_blank">Download</a>';
					$('#contentbox').html(lnkContent);
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
