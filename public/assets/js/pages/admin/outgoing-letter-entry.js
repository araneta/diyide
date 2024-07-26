jQuery(document).ready(function($){
	// Note that the name "myDropzone" is the camelized
	// id of the form.
	//tinymce.init({selector:'textarea'});
	var headers = getHeader();
	delete(headers['Content-Type']);
	console.log(headers);
	
	
	Dropzone.options.contentDropzone = {
		// Configuration options go here
		headers:headers,
		
		acceptedFiles:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
				$('input[name="docxFile"]').val(response.message);
			}
		}
	  
	};
	
	Dropzone.options.myDropzone = {
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
				$('input[name="fileName"]').val(file.name);
				$('input[name="attachment"]').val(response.message);
			}
		}	  
	};
	$('#btnSubmit').click(function(e){
		$('#outgoing-letter-form').submit();
	});
	var id = window.pageData ? window.pageData.ID: '';
	if(!id){
		$('#txtTitle').html('Tambah Surat Keluar');
		$('#existingAttachment').hide();
		$('#existingContent').hide();
		$('#revisionBox').hide();
				
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
					getAllVersions(id);
					var letter = data.message;
					if(letter.approvalStatus == 3){//approved
						$('#approvalBox').hide();
					}
					for (var key in letter) {   
						var elm = $('[name="'+key+'"]');
						if(elm.attr('data-type')=='date'){
							elm.val(toLocalDate(letter[key]));
						}else{
							elm.val(letter[key]);
						}					 
					}
					//content
					var filecontent = $('input[name="docxFile"]').val();
					var fname = letter.no.replaceAll('\/','-')+'.docx';
					$('#existingContent a').attr('href', window.APP_API_URL+'/api/admin/file/'+filecontent+'/'+fname);
					if(filecontent){
						$('#existingContent').show();
					}else{
						$('#existingContent').hide();
					}
					//attachment
					var file = $('input[name="attachment"]').val();
					var fname = $('input[name="fileName"]').val();
					$('#existingAttachment a').attr('href', window.APP_API_URL+'/api/admin/file/'+file+'/'+fname);
					if(file){
						$('#existingAttachment').show();
					}else{
						$('#existingAttachment').hide();
					}
					bindOpenPDF();
					
					var arrno = letter.no.split('/');
					$('#name-2').val(arrno[0]);
					$('#notype').val(arrno[1]);
					$('#monthyear').val(arrno[2]);
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
	}else{
		var url = window.APP_API_URL+'/api/admin/outgoing-letters/no';
		$.ajax({
			url, 
			headers:getHeader(),			
			success:function (data) {
				console.log('data',data);
				if(data.status==1){
					$('#name-2').val(data.message);
					var date = new Date();
					var mx = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
					var m = date.getMonth();
					var yy = date.getFullYear();
					$('#monthyear').val(mx[m]+'.'+yy);
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
	
	function getAllVersions(outgoingLetterId){
		var id = localStorage.roleID;
		var url = window.APP_API_URL+'/api/admin/outgoing-letters/'+outgoingLetterId+'/versions';
		$.ajax({
			url, 
			headers:getHeader(),			
			success:function (data) {
				console.log('data',data);
				if(data.status==1){
					var versions = data.message;
					if(!versions){
						return;
					}
					for(var i=0;i<versions.length;i++){
						var vers = versions[i];
						var t1 = formatTime(vers.createdAt);
						var creator = 'Diupdate oleh: '+vers.createdByName + ' ('+vers.createdByRoleName+')';
						var comment = '';
						if(vers.comment){
							comment = 'Komentar: '+vers.comment+'<br>';
						}
						var reviewerName = '';
						if(vers.reviewerName){
							reviewerName = '<br />Reviewer: '+vers.reviewerName;
						}
						var status = '<br />Status: '+formatApprovalStatus(vers)+reviewerName;
						var link = '<a href="#" data-id="'+vers.ID+'" class="lnkversion">Lihat Surat Versi Ini</a>';
						var tpl = '<div class="mb-3">'+t1+'<br>'+creator+status+'<br>'+comment+link+'</div>';
						
						$('#revisionBox .card-body').append(tpl);
					}
					$('.lnkversion').on('click',function(e){
						var id = $(e.target).attr('data-id');
						console.log('id',id);
						//find the id
						for(var i=0;i<versions.length;i++){
							var vers = versions[i];
							if(vers.ID==id){
								var url = window.APP_API_URL+'/api/admin/file/'+vers.attachment+'/'+vers.fileName;
								var lnk = '<a href="'+url+'" target="_blank" class="open-pdf">View</a>';
								
								var fname = vers.no.replaceAll('\/','-')+'.docx';
								var urlContent = window.APP_API_URL+'/api/admin/file/'+vers.docxFile+'/'+fname;
								var lnkContent = '<a href="'+urlContent+'" target="_blank">Download</a>';
								
								$('#detailDlg #txtNo').html(vers.no);
								$('#detailDlg #txtLetterDate').html(formatTime(vers.letterDate));
								$('#detailDlg #txtSubject').html(vers.subject);
								$('#detailDlg #txtDestination').html(vers.no);
								$('#detailDlg #txtContent').html(lnkContent);
								$('#detailDlg #txtAttachment').html(lnk);
								var myModal = new bootstrap.Modal(document.getElementById('detailDlg'), {keyboard: false});
								myModal.show();
								bindOpenPDF();
								break;
							}
						}
						
						

						
					});
					
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
