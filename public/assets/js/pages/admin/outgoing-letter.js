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
				{ "data": 'no'},               				
				{ "data": 'letterDate'},               								
				{ "data": 'subject'}, 
				{ "data": 'destination'},  
				{ "data": 'approvalStatus'},               				
				{ "data": "ID" }
			],
			"aoColumnDefs": [
				{					
					"aTargets": [0],
					width: 40,
					
				},
				{					
					"aTargets": [2],
					width: 180,
					"mRender": function ( data, type, row ) {
						var html = '';
						
						var t = moment(row.letterDate);
						if(t.isValid()){
							html = t.format('D MMMM YYYY');
						}
						return html;
					},
				},
				{					
					"aTargets": [5],
					width: 120,
					"mRender": function ( data, type, row ) {
						var html = formatApprovalStatus(row);
						
						return html;
					},
				},
				
				{
					"mRender": function ( data, type, row ) {
						//console.log(row);
						var html = '<div class="dropdown"><button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">Actions</button>';
						html += ' <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">';
						
						html+= '<li><a href="/admin/outgoing-letter/'+row.ID+'/view" class="dropdown-item" >View</a></li>';
						if(row.approvalStatus != 3){
							html+= '<li><a href="/admin/outgoing-letter/'+row.ID+'" class="dropdown-item" >Update</a></li>';
						}
						//html+= '<li><a href="/admin/outgoing-letter/'+row.ID+'/print" class="dropdown-item"  target="_blank">Cetak</a></li>';
						var fname = row.no.replaceAll('\/','-')+'.docx';
						var url = window.APP_API_URL+'/api/admin/file/'+row.docxFile+'/'+fname;
						html += '<li><a href="'+url+'"  target="_blank" class="dropdown-item" >Cetak</a></li>';
						if(row.approvalStatus == 3){//approved
							
							if(!row.isArchived){
								
								html += '<li><a href="/admin/outgoing-letter/'+row.ID+'/archive" class="dropdown-item" >Arsipkan</a></li>';
							}else{
								if(row.archiveFileName){//has archived
									var url = window.APP_API_URL+'/api/admin/file/'+row.archiveAttachment+'/'+row.archiveFileName;
									html += '<li><a onclick="printJS(\''+url+'\')"  target="_blank" class="dropdown-item" >Cetak Arsip</a></li>';
								}
							}
						}
						
						if(row.approvalStatus != 3){
							html += '<li><a type="submit" class="dropdown-item btn-dangerx" data-id="'+row.ID+'">Delete</a></li>';
						}
						html += '</ul></div>';
						return html;
					},
					"aTargets": [6],
					width: 140,
				},
				
			],
			//"aaSorting": [[ 0, "asc" ]],
			"bFilter":false,
			"ordering": false,
			"sPaginationType": "full_numbers",
			"sInfoEmpty": 'No entries to show',
			"sEmptyTable": "No Sources found currently, please add at least one.",
			"ajax":{
				"url":window.APP_API_URL+'/api/admin/outgoing-letters',
				"type":"GET",
				"headers":getHeader(),	
				"dataSrc": function(json){
				   json.draw = draw;
				   json.recordsTotal = json.message.totalrecords;
				   json.recordsFiltered = json.message.totaldisplayrecords;

				   return json.message.data ? json.message.data :[];
				},
				"data":{
					
					no:function () {
						return $('input[name="no"]').val();
					},
					destination:function () {
						return $('input[name="destination"]').val();
					},
					subject:function () {
						return $('input[name="subject"]').val();
					},
					letterDateStart:function () {
						return toServerDate($('input[name="letterDateStart"]').val());
					},
					letterDateEnd:function () {
						return toServerDate($('input[name="letterDateEnd"]').val());
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
	dataTable.on( 'draw.dt', function () {
    var PageInfo = $('#tbl').DataTable().page.info();
         dataTable.column(0, { page: 'current' }).nodes().each( function (cell, i) {
            cell.innerHTML = i + 1 + PageInfo.start;
        } );
    } );
	function bindDeleteBtn(){
		$('#tbl .btn-dangerx').off('click').on('click', function(e){
			e.preventDefault();
			if(!confirm('Are you sure you want to delete this data')){
				return;
			}
			var selid = $(this).attr('data-id');
			$.ajax({
				type: "DELETE",
				headers:getHeader(),	
				url: window.APP_API_URL+'/api/admin/outgoing-letters/'+selid,
				data: {
					id:selid
				},
				success: function(msg){
					console.log('msg',msg);
					if(msg ){
						if(msg.status==1){
						}else{
							alert(msg.message.Message);
						}
						$('#tbl').DataTable().ajax.reload();
					}
					
				}
			});
		})
	}
	$('#searchform').on('submit', function(e){
		e.preventDefault();

		dataTable.ajax.reload();
	});
});
