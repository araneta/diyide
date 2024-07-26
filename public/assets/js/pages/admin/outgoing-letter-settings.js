jQuery(document).ready(function($){
	var url = window.APP_API_URL+'/api/admin/outgoing-letters/settings';
	$.ajax({
		url, 
		headers:getHeader(),			
		success:function (data) {
			console.log('data',data);
			if(data.status==1){
				var settings = data.message;
				$('#nextNo').val(settings.nextNo);
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
	
	$('#btnAdd').click(function(e){
		var myModal = new bootstrap.Modal(document.getElementById('codeEntryDlg'), {keyboard: false});
		myModal.show();
	});
	
	
	var draw = 1;
	var dataTable = $('#tbl1')
		.addClass('table table-striped table-bordered')
		.DataTable({
			"dom": '<"top"i>rt<"bottom"flp><"clear">',
			"processing": true,
			"serverSide": true,
			"columns": [				
				{ "data": "ID" },
				{ "data": 'code'},               							       				
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
						
						html+= '<a data-id="'+row.ID+'" class="lnkedit">Update</a>&nbsp;&nbsp;';
						html += '<a type="submit" class=" btn-dangerx" data-id="'+row.ID+'">Delete</a>';
						
						return html;
					},
					"aTargets": [2],
					width: 140,
				},
				
			],
			"aaSorting": [[ 0, "asc" ]],
			"bFilter":false,
			"sPaginationType": "full_numbers",
			"sInfoEmpty": 'No entries to show',
			"sEmptyTable": "No Sources found currently, please add at least one.",
			"ajax":{
				"url":window.APP_API_URL+'/api/admin/outgoing-letters/codes',
				"type":"GET",
				"headers":getHeader(),	
				"dataSrc": function(json){
				   json.draw = draw;
				   json.recordsTotal = json.message.totalrecords;
				   json.recordsFiltered = json.message.totaldisplayrecords;

				   return json.message.data ? json.message.data :[];
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
    var PageInfo = $('#tbl1').DataTable().page.info();
         dataTable.column(0, { page: 'current' }).nodes().each( function (cell, i) {
            cell.innerHTML = i + 1 + PageInfo.start;
        } );
    } );	
	function bindDeleteBtn(){
		$('#tbl1 .btn-dangerx').off('click').on('click', function(e){
			e.preventDefault();
			if(!confirm('Are you sure you want to delete this data')){
				return;
			}
			var selid = $(this).attr('data-id');
			$.ajax({
				type: "DELETE",
				headers:getHeader(),	
				url: window.APP_API_URL+'/api/admin/outgoing-letters/codes/'+selid,
				data: {
					id:selid
				},
				success: function(msg){
					$('#tbl1').DataTable().ajax.reload();
				}
			});
		});
		$('#tbl1 .lnkedit').off('click').on('click', function(e){
			e.preventDefault();
			var selid = $(this).attr('data-id');
			//load ajax
			var url = window.APP_API_URL+'/api/admin/outgoing-letters/codes/'+selid;
			$.ajax({
				url, 
				headers:getHeader(),			
				success:function (data) {
					console.log('data',data);
					if(data.status==1){
						var settings = data.message;
						
						//show dlg
						var dlg = $(document.getElementById('codeEntryDlg'));
						var myModal = new bootstrap.Modal(dlg, {keyboard: false});
						dlg.find('#code').val(settings.code);
						dlg.find('#ID').val(settings.ID);
						myModal.show();
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
		
	}
	$('#searchform').on('submit', function(e){
		e.preventDefault();

		dataTable.ajax.reload();
	});
});
