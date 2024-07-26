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
				{ "data": "ID" },
				{ "data": 'senderName'},               				
				{ "data": 'no'},               				
				{ "data": 'incomingDate'},               				
				{ "data": 'senderDate'},               				
				{ "data": 'subject'},               				
				{ "data": "ID" }
			],
			"aoColumnDefs": [
				{					
					"aTargets": [0],
					width: 40,
					
				},
				{					
					"aTargets": [2],
					width: 140,
					
				},
				{					
					"aTargets": [3],
					width: 140,
					"mRender": function ( data, type, row ) {
						var html = '';
						
						var t = moment(row.incomingDate);
						if(t.isValid()){
							html = t.format('D MMMM YYYY');
						}
						return html;
					},
				},
				{					
					"aTargets": [4],
					width: 140,
					"mRender": function ( data, type, row ) {
						var html = '';
						
						var t = moment(row.senderDate);
						if(t.isValid()){
							html = t.format('D MMMM YYYY');
						}
						return html;
					},
				},
				{
					"mRender": function ( data, type, row ) {
						var url = window.APP_API_URL+'/api/approver/file/'+row.attachment+'/'+row.fileName;
						//console.log(row);
						var html = '<div class="dropdown"><button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">Actions</button>';
						html += ' <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">';
						
						html += '<li><a href="/approver/incoming-letter/'+row.ID+'" class="dropdown-item">View</a></li>'+
						'<li><a href="'+url+'" target="_blank" class="dropdown-item">Download</a></li>'+
						'<li><a href="/approver/incoming-letter/'+row.ID+'/disposition" class="dropdown-item">Disposisi</a></li>';
						html += '</ul></div>';
						return html;
					},
					"aTargets": [6],
					width: 140,
				},
				
			],
			//"aaSorting": [[ 4, "desc" ]],
			"ordering": false,
			"bFilter":false,
			"sPaginationType": "full_numbers",
			"sInfoEmpty": 'No entries to show',
			"sEmptyTable": "No Sources found currently, please add at least one.",
			"ajax":{
				"url":window.APP_API_URL+'/api/approver/incoming-letters',
				"type":"GET",
				"headers":getHeader(),	
				"dataSrc": function(json){
				   json.draw = draw;
				   json.recordsTotal = json.message.totalrecords;
				   json.recordsFiltered = json.message.totaldisplayrecords;

				   return json.message.data ? json.message.data :[];
				},
				"data":{
					senderName:function () {
						return $('input[name="senderName"]').val();
					},
					no:function () {
						return $('input[name="no"]').val();
					},
					incomingDateStart:function () {
						return toServerDate($('input[name="incomingDateStart"]').val());
					},
					incomingDateEnd:function () {
						return toServerDate($('input[name="incomingDateEnd"]').val());
					},
					senderDateStart:function () {
						return toServerDate($('input[name="senderDateStart"]').val());
					},
					senderDateEnd:function () {
						return toServerDate($('input[name="senderDateEnd"]').val());
					}
				},
				complete: function(data) {
					
				}
			},
			"fnInitComplete": function (oSettings, json) {
				
			},

		});
	dataTable.on( 'xhr', function () {
		var data = dataTable.ajax.params();
		draw = data.draw;
		console.log('ajax params',data);
		
	} );	
	
	$('#searchform').on('submit', function(e){
		e.preventDefault();

		dataTable.ajax.reload();
	});
});
