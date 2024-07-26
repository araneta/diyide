jQuery(document).ready(function($){
	var headers = getHeader();
	delete(headers['Content-Type']);
	console.log(headers);
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
	
	var isValid = false;
	var fields = [];
	var id = window.pageData ? window.pageData.ID: '';
	if(!id){
		$('#txtTitle').html('Tambah Arsip');
		$('#existingAttachment').hide();		
	}else{
		$('#ID').val(id);
		$('#txtTitle').html('Update Arsip');		

	}
	$('#btnSubmit').click(function(e){
		$('#frmArchive').submit();
	});
	$('#frmArchive').submit(function(e){
		var $target = $(e.target);
		var $status = $target.find('.statusbox');
		e.preventDefault();
		var catID  = parseInt($('#categoryID').val(),10);
		var data = {
			ID: parseInt($('input[name="ID"]').val(),10),
			name: $('input[name="name"]').val(),
			categoryID: catID,
			attachment: $('input[name="attachment"]').val(),
			fileName: $('input[name="fileName"]').val(),
		};
		data.fields = [];
		var inputs = $('#fieldsBox :input');
		for(var i=0;i<inputs.length;i++){
			//console.log(inputs[i]);
			var elm = $(inputs[i]);
			var fid = elm.attr('data-field-id');
			var valx = elm.val();
			data.fields.push({
				fieldValue:valx,
				fieldID: parseInt(fid,10)
			});			
		}
		var success = false;
		var url = window.APP_API_URL+'/api/admin/archives';
		if(id){
			method = 'PUT';
			url = window.APP_API_URL+'/api/admin/archives/'+id;
		}else{
			method = 'POST';
		}
		
		$.ajax({
			type: method,
			url:url, 
			data: JSON.stringify(data),
			headers:getHeader(),			
			success:function (data) {
				console.log('data',data);
				if(data.status==1){
					success = true;
					if($status){						
						var ret = $target.find('input[name="success-message"]').val();
						if(ret){
							$status.html('<div class="alert alert-success">'+ret+'</div>');					
						}else{
							$status.html('<div class="alert alert-success">'+data.message+'</div>');					
						}
						
					}
				}else{
					if($status){
						$status.html('<div class="alert alert-danger">'+data.message+'</div>');
					}
				}
				
			}.bind(this),
			error:function(error){			
				console.log(error);
				if(error.statusText!="abort"){
					alert('Request Failed: '+error.responseText, 'error');
				}
			}
		}).done(function(response){
			
			if(success){
				var ret = $target.find('input[name="return-url"]').val();
				if(response && response.returnurl){
					ret = response.returnurl;
				}
				
				if(ret){
					setTimeout(function(){window.location.href = ret;},800);
				}
			}
		});
	});
	
	loadArchiveCategories();
	
	function prepend(value, array) {
		var newArray = array.slice();
		newArray.unshift(value);
		return newArray;
	}
	
	function loadFields(catID, letter){
		var url = window.APP_API_URL+'/api/admin/archive-categories/'+catID;
		$.ajax({
			url, 
			headers:getHeader(),			
			success:function (data) {
				console.log('data',data);
				if(data.status==1){
					
					if(data.message.fields){
						var container = $('#fieldsBox');	
						container.empty();
						var fields = data.message.fieldDetails;
						if(fields.length>0){
							for(var i=0;i<fields.length;i++){
								var field = fields[i];
								var tpl = '<div class="mb-3"><label class="form-label">'+field.fieldName+'</label><input class="form-control" data-field-id="'+field.ID+'" type="text" name="'+field.fieldName+'" required></div>';
								container.append(tpl);
							}
						}
						if(letter){
							if(letter.fields){
							var fields = letter.fields;
							for(var i=0;i<fields.length;i++){
								var fieldx = fields[i];
								$('input[data-field-id="'+fieldx.fieldID+'"]').val(fieldx.fieldValue);
							}
						}
						}
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
	
	function loadArchiveCategories(){
		var url = window.APP_API_URL+'/api/admin/archive-categories?page-size=10000';
		$.ajax({
			url, 
			headers:getHeader(),			
			success:function (data) {
				console.log('data',data);
				if(data.status==1){
					var cats = data.message.data;
					var dataCats = $.map(cats, function (obj) {
						
						obj.id = obj.id || obj.ID;
						obj.text = obj.name;
						return obj;
						
					});
					dataCats = prepend({id:0,text:'Pilih..'}, dataCats);
					$("#categoryID").select2({
					  data: dataCats
					});
					$('#categoryID').on("select2:select", function(e) { 
						var valuex = e.params.data;
						console.log('va',valuex);
						if(valuex.id==0){
							isValid = false;
						}else{
							isValid = true;
							loadFields(valuex.id);
						}
					});
					
					if(id){
						loadEntity(id);
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
	
	function loadEntity(id){
		var url = window.APP_API_URL+'/api/admin/archives/'+id;
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
					loadFields(letter.categoryID,letter);
					$('#categoryID').val(letter.categoryID).trigger('change');
					var file = $('input[name="attachment"]').val();
					var fname = $('input[name="fileName"]').val();
					$('#existingAttachment a').attr('href', window.APP_API_URL+'/api/admin/file/'+file+'/'+fname);
					if(file){
						$('#existingAttachment').show();
					}else{
						$('#existingAttachment').hide();
					}
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
