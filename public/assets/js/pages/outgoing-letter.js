function formatApprovalStatus(row){
	var status = row.approvalStatus;
	var html = '';
	if(row.isArchived){
		return 'Arsip';
	}
	switch(status){
		case 1:
			html = 'Draft';
		break;
		case 2:
			html = 'Menunggu Approval';
		break;
		case 3:
			html = 'Approved';
		break;
		case 4:
			html = 'Ditolak Reviewer';
		break;
		case 5:
			html = 'Ditolak Approver';
		break;
	}
	return html;
}
jQuery(document).ready(function($){
	function prepend(value, array) {
		var newArray = array.slice();
		newArray.unshift(value);
		return newArray;
	}
	
	var url = window.APP_API_URL+'/api/admin/outgoing-letters/codes?page-size=10000';
	$.ajax({
		url, 
		headers:getHeader(),			
		success:function (data) {
			console.log('data',data);
			if(data.status==1){
				var cats = data.message.data;
				/*
				var dataCats = $.map(cats, function (obj) {
					
					obj.id = obj.code;
					obj.text = obj.code;
					return obj;
					
				});
				dataCats = prepend({id:0,text:'Pilih..'}, dataCats);
				$("#notype").select2({
					width: '200px',
					theme: 'bootstrap4',
					data: dataCats
				});
				$('#notype').on("select2:select", function(e) { 
					var valuex = e.params.data;
					console.log('va',valuex);
					if(valuex.id==0){
						isValid = false;
					}else{
						isValid = true;
						
					}
				});*/
				var $dropdown = $("#notype");
				$dropdown.append($("<option />").val('').text('Pilih...'));
				$.each(cats, function() {
					$dropdown.append($("<option />").val(this.code).text(this.code));
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
	
});
