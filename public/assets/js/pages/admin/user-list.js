jQuery(document).ready(function($){
	console.log('reacy');
	var draw = 1;
	var dataTable = $('#tbl')
		.addClass('table table-striped table-bordered')
		.DataTable({
			"dom": '<"top"i>rt<"bottom"flp><"clear">',
			"processing": true,
			"serverSide": true,
			"columns": [
				{ "data": 'fullName'},               				
				{ "data": 'roleID'},               				
				{ "data": 'email'},               				
				{ "data": 'mobileNo'},               				
				{ "data": "ID" }
			],
			"aoColumnDefs": [
				{
					"mRender": function ( data, type, row ) {
						//console.log(row);
						var html = '';
						switch(row.roleID){
							case 1:{
								html = 'Admin';
								break;
							}
							case 2:{
								html = 'Reviewer';
								break;
							}
							case 3:{
								html = 'Approver';
								break;
							}
						}
						return html;
					},
					"aTargets": [1],
					width: 140,
				},
				{
					"mRender": function ( data, type, row ) {
						//console.log(row);
						var html = '<a href="/admin/user/'+row.ID+'" class="btn btn-warning">Edit</a>&nbsp;'+
							'<button type="submit" class="btn btn-danger" data-id="'+row.ID+'">Delete</button>';
						return html;
					},
					"aTargets": [4],
					width: 140,
				},
				
			],
			"aaSorting": [[ 0, "asc" ]],
			"bFilter":false,
			"sPaginationType": "full_numbers",
			"sInfoEmpty": 'No entries to show',
			"sEmptyTable": "No Sources found currently, please add at least one.",
			"ajax":{
				"url":window.APP_API_URL+'/api/admin/users/search',
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
				url: window.APP_API_URL+'/api/admin/users/'+selid,
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
