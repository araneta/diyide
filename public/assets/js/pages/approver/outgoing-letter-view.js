jQuery(document).ready(function($){
	var id = window.pageData ? window.pageData.ID: '';
	if(id){
		var url = window.APP_API_URL+'/api/approver/outgoing-letters/'+id;
		$.ajax({
			url, 
			headers:getHeader(),			
			success:function (data) {
				console.log('data',data);
				if(data.status==1){
					getAllVersions(id);
					var letter = data.message;
					
					var file = letter.attachment;
					var fname = letter.fileName;
					$('#existingAttachment a').attr('href', window.APP_API_URL+'/api/approver/file/'+file+'/'+fname);
					if(file){
						$('#existingAttachment').show();
					}else{
						$('#existingAttachment').hide();
					}
					bindOpenPDF();
					var fname = letter.no.replaceAll('\/','-')+'.docx';
					var url = window.APP_API_URL+'/api/approver/file/'+letter.docxFile+'/'+fname;
					html = '<a href="'+url+'"  target="_blank"  >Download</a>';
					//$('#msg').html(html);
					$('#currtxtNo').html(letter.no);
					$('#currtxtLetterDate').html(formatTime(letter.letterDate));
					$('#currtxtSubject').html(letter.subject);
					$('#currtxtDestination').html(letter.destination);
					$('#currtxtContent').html(html);
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
		var url = window.APP_API_URL+'/api/approver/outgoing-letters/'+outgoingLetterId+'/versions';
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
								var url = window.APP_API_URL+'/api/approver/file/'+vers.attachment+'/'+vers.fileName;
								var lnk = '<a href="'+url+'" target="_blank" class="open-pdf">View</a>';
								
								var fname = vers.no.replaceAll('\/','-')+'.docx';
								var urlContent = window.APP_API_URL+'/api/approver/file/'+vers.docxFile+'/'+fname;
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
