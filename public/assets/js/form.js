jQuery(document).ready(function($){
	$('.datepicker').datepicker({
		format:'dd/mm/yyyy',		
	});
	function endsWith(str, suffix) {
		return str.indexOf(suffix, str.length - suffix.length) !== -1;
	}
	
	function objectifyForm(formArray) {
		//serialize data function
		var returnArray = {};
		for (var i = 0; i < formArray.length; i++){
			returnArray[formArray[i]['name']] = formArray[i]['value'];
		}
		return returnArray;
	}
	$(".ajax-form").submit(function(event){
		event.preventDefault(); //prevent default action 
		var $target = $(event.target);
		var $status = $target.find('.statusbox');
		var submit = $target.find('input[type="submit"]');
		if(submit.length==0){
			submit = $target.find('button[type="submit"]');
		}
		if(submit){
			submit.prop('disabled', true);
		}
		var ID = $target.find('input[name="ID"]').val();
		var post_url = $(document.activeElement).attr('formaction') || $(this).attr('action');
		
		var request_method = $(this).attr("method"); //get form GET/POST method
		//var form_data = $(this).serialize(); //Encode form elements for submission
		var formData = new FormData(this);
		console.log('formdata',formData);
		formData.delete('return-url');
		formData.delete('success-message');
		
		if(ID){
			request_method = "PUT";
			post_url += "/"+ID;			
		}
		
		var object = {};
		formData.forEach(function(value, key){
			//check data type
			var datatype = $target.find(':input[name="'+key+'"]').attr('type');
			var ctype = $target.find(':input[name="'+key+'"]').attr('data-type');
			if(ctype){
				datatype = ctype;
			}
			var xvalue = value;
			console.log('data',key,value,datatype);
			if(datatype=='int'){
				xvalue = parseInt(value,10);
			}else if(datatype=='date'){
				var cdate = moment(value,'DD/MM/YYYY');
				if(cdate.isValid()){
					xvalue = cdate.format("YYYY-MM-DD");
				}
			}else if(datatype=='file'){
			}else{
			}
			if(endsWith(key,'[]')){
				var xkey = key.replace('[]','');
				if(!Array.isArray(object[xkey])){
					object[xkey] = [];	
				}
				object[xkey].push(xvalue);
			}else{
				object[key] = xvalue;
			}
		});
		object = JSON.stringify(object);
		console.log(object);
		//return;
		var success = false;
		$.ajax({
			url : post_url,
			type: request_method,
			data : object,			
			cache: false,
			contentType: false,
			processData: false,
			headers:getHeader(),		
			success(data){				
				console.log('success',data);
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
						if (
							typeof data.message === 'object' &&
							!Array.isArray(data.message) &&
							data.message !== null
						) {
							$status.html('<div class="alert alert-danger">'+data.message.Message+'</div>');
						}else{
							$status.html('<div class="alert alert-danger">'+data.message+'</div>');
						}
						
					}
				}
				if($status){
					$status.attr("tabindex",-1).focus();
				}
			},
			error(data) { // if error occured
				console.log('error',data);
				if (data.status === 0) {
					 alert('Not connected. Verify your network.');
				}else{
					try{
						const responseText = $.parseJSON(data.responseText);
						if(responseText.error){
							if($status){
								$status.html('<div class="alert alert-danger">'+responseText.error+'</div>');
							}
						}		
						if(responseText.message){							
							//sequilize error
							var msg = '';
							if(responseText.message !== null && typeof responseText.message === 'object'){
								for (var propname in responseText.message) {
									//console.log('da',responseText.message[propname]);
									msg += responseText.message[propname].msg+"<br />";
								}
							}else{
								msg = responseText.message;
							}
							if($status){
								$status.html('<div class="alert alert-danger">'+msg+'</div>');
							}
						}		
						if($status){
							$status.attr("tabindex",-1).focus();
						}
					}catch(ex){
						console.log(ex);
						alert(ex+" "+data.responseText);
						if(Sentry){
							Sentry.captureException(err);
						}
					}
					if(submit){				
						submit.prop('disabled', false);
					}
				}
			}
		}).done(function(response){ //			
			console.log('done');
			if(submit){				
				submit.prop('disabled', false);
			}
			if(success){
				var ret = $target.find('input[name="return-url"]').val();
				if(response && response.returnurl){
					ret = response.returnurl;
				}
				
				if(ret){
					setTimeout(function(){window.location.href = ret;},800);
				}
			}
			if($status){
				$status.attr("tabindex",-1).focus();
			}
		});
	});
	
	
	
});
function toLocalDate(dbDate){
	//console.log('ldate',dbDate);
	var date = moment(dbDate, 'YYYY-MM-DD');
	if(date.isValid()){
		return date.format('DD/MM/YYYY');
	}
	return '';
}
function toServerDate(localDate){
	var cdate = moment(localDate,'DD/MM/YYYY');
	if(cdate.isValid()){
		return cdate.format("YYYY-MM-DD");
	}
	return '';
}
function formatTime(t){
	var html = '';
	var t = moment(t);
	if(t.isValid()){
		html = t.format('D MMM YYYY H:mm:ss');
	}
	return html;
}
