jQuery(document).ready(function($){
	console.log('reacy');
	var draw = 1;
	var dataTable = $('#tbl1')
		.addClass('table table-striped table-bordered')
		.DataTable({
			"dom": '<"top"i>rt<"bottom"flp><"clear">',
			"processing": true,
			"serverSide": true,
			"columns": [				
				{ "data": "ID" },
				{ "data": 'name'},     
				{ "data": 'archiveCategoryName'},               							       				
				{ "data": "ID" }
			],
			"aoColumnDefs": [
				{					
					"aTargets": [0],
					width: 40,
					
				},
				
				{
					"mRender": function ( data, type, row ) {
						//console.log(row);
						var html = '';
						if(row.attachment){
							var url = window.APP_API_URL+'/api/reviewer/file/'+row.attachment+'/'+row.fileName;
							html+= '<a href="'+url+'" target="_blank" class="open-pdf">View</a>&nbsp;&nbsp;';
						}
						html+= '<a href="'+url+'" target="_blank" class="print-pdf">Cetak</a>&nbsp;&nbsp;';
						html+= '<a href="'+url+'" target="_blank" class="">Download</a>&nbsp;&nbsp;';
						
						
						return html;
					},
					"aTargets": [3],
					width: 220,
				},
				
			],
			//"aaSorting": [[ 0, "asc" ]],
			"bFilter":false,
			"sPaginationType": "full_numbers",
			"sInfoEmpty": 'No entries to show',
			"sEmptyTable": "No Sources found currently, please add at least one.",
			"ajax":{
				"url":window.APP_API_URL+'/api/reviewer/archives',
				"type":"GET",
				"headers":getHeader(),	
				"dataSrc": function(json){
				   json.draw = draw;
				   json.recordsTotal = json.message.totalrecords;
				   json.recordsFiltered = json.message.totaldisplayrecords;

				   return json.message.data ? json.message.data :[];
				},
				"data":{					
					name:function () {
						return $('input[name="name"]').val();
					},
				},
				complete: function(data) {
					bindButtons();
				}
			},
			"fnInitComplete": function (oSettings, json) {
				bindButtons();
			},

		});
	dataTable.on( 'xhr', function () {
		var data = dataTable.ajax.params();
		draw = data.draw;
		console.log('ajax params',data);
		
	} );	
	dataTable.on( 'draw.dt', function () {
    var PageInfo = $('#tbl1').DataTable().page.info();
         dataTable.column(0, { page: 'current' }).nodes().each( function (cell, i) {
            cell.innerHTML = i + 1 + PageInfo.start;
        } );
    } );
	
	$('#searchform').on('submit', function(e){
		e.preventDefault();

		dataTable.ajax.reload();
	});
	
	function bindButtons(){
		bindOpenPDF();
		bindPrintPDF();
	}
});
