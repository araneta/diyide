jQuery(document).ready(function($){
	console.log('reacy');
	document.title = "Alur Disposisi";
	//load user
	var id = pageData.ID;
	if(!id){
		return;				
	}
	
	getRole(id);
	function getRole(roleID){
		var url = window.APP_API_URL+'/api/admin/roles/'+roleID;
		$.ajax({
			url, 
			headers:getHeader(),			
			success:function (data) {
				console.log('data',data);
				if(data.status==1){
					var role = data.message;
					$('#txtRoleName').html(role.name);
					$('input[name="return-url"]').val('/admin/role/'+roleID+'/disposition-flow');
					$('#dispositionFlowForm').attr('action','/api/admin/roles/'+roleID+'/disposition-flow');
					$('input[name="fromRoleID"]').val(roleID);
					setTarget(roleID);
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
	
	function setTarget(exceptRoleID){
		var url = window.APP_API_URL+'/api/admin/roles';
		$.ajax({
			url, 
			headers:getHeader(),			
			success:function (data) {
				console.log('data',data);
				if(data.status==1){
					var roles = data.message;
					var dataRoles = $.map(roles, function (obj) {
						if(obj.ID != exceptRoleID){
							obj.id = obj.id || obj.ID;
							obj.text = obj.name;
							return obj;
						}
					});
					$("#targetroles").select2({
					  data: dataRoles
					})
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
	
	//load targets
	var draw = 1;
	var dataTable = $('#tbl')
		.addClass('table table-striped table-bordered')
		.DataTable({
			"dom": '<"top"i>rt<"bottom"flp><"clear">',
			"processing": true,
			"serverSide": true,
			"columns": [
				{ "data": 'toRoleName'},               				
				{ "data": "ID" }
			],
			"aoColumnDefs": [
				
				{
					"mRender": function ( data, type, row ) {
						//console.log(row);
						var html = 
							'<button type="submit" class="btn btn-danger" data-id="'+row.ID+'">Delete</button>';
						return html;
					},
					"aTargets": [1],
					width: 140,
				},
				
			],
			"aaSorting": [[ 0, "asc" ]],
			"bFilter":false,
			"sPaginationType": "full_numbers",
			"sInfoEmpty": 'No entries to show',
			"sEmptyTable": "No Sources found currently, please add at least one.",
			"ajax":{
				"url":window.APP_API_URL+'/api/admin/roles/'+id+'/disposition-flow/search',
				"type":"GET",
				"headers":getHeader(),	
				"dataSrc": function(json){
				   json.draw = draw;
				   json.recordsTotal = json.message.totalrecords;
				   json.recordsFiltered = json.message.totaldisplayrecords;

				   return json.message.data ? json.message.data :[];
				},
				"data":{
					filter:function () {
						return $('#txtTerm').val();
					}
				},
				complete: function(data) {
					bindDeleteBtn();
				}
			},
			"fnInitComplete": function (oSettings, json) {
				bindDeleteBtn();
			},

		});
	dataTable.on( 'xhr', function () {
		var data = dataTable.ajax.params();
		draw = data.draw;
		console.log('ajax params',data);
		
	} );	
	function bindDeleteBtn(){
		$('#tbl .btn-danger').off('click').on('click', function(e){
			e.preventDefault();
			if(!confirm('Are you sure you want to delete this data')){
				return;
			}
			var selid = $(this).attr('data-id');
			$.ajax({
				type: "DELETE",
				headers:getHeader(),	
				url: window.APP_API_URL+'/api/admin/disposition-flow/'+selid,
				data: {
					id:selid
				},
				success: function(msg){
					$('#tbl').DataTable().ajax.reload();
				}
			});
		})
	}
	$('#searchform').on('submit', function(e){
		e.preventDefault();

		dataTable.ajax.reload();
	});
	
	
});


