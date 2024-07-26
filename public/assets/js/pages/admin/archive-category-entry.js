jQuery(document).ready(function($){
	var fields = [];
	var id = window.pageData ? window.pageData.ID: '';
	if(!id){
		$('#txtTitle').html('Tambah Kategori Arsip');
				
	}else{
		$('#ID').val(id);
		$('#txtTitle').html('Update  Kategori Arsip');
		

	}
	if(id){
		var url = window.APP_API_URL+'/api/admin/archive-categories/'+id;
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
					if(letter.fields){
						fields = letter.fields.split(',');
						renderTable();
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
	
	
	renderTable();
	$('#btnAddField').click(function(e){
		var newfield = $('#txtField').val();
		newfield = newfield.replace(/[^a-z0-9\s-]/ig,'')
		  .trim()
		  .replace(/\s+/g, '-')
		  ;
		if(fields.indexOf(newfield)>=0){
			alert('Field sudah ada');
			return;
		}
		fields.push(newfield);
		$('#txtField').val('');
		renderTable();
	});
	
	function renderTable(){
		$('#tblFields tbody').empty();
		for(var i=0;i<fields.length;i++){
			var newrow = '<tr><td>'+fields[i]+'</td><td><a href="" data-id="'+i+'"  class="btnDelete">Delete</a></tr>';
			$('#tblFields tbody').append(newrow);
		}
		$('#txtFields').val(fields.toString());
		bindDeleteBtn();
	}
	
	function bindDeleteBtn(){
		$('.btnDelete').click(function(e){
			e.preventDefault();
			var btn = $(e.target);
			var index = btn.attr('data-id');
			fields.splice(index, 1); // 2nd parameter means remove one item only
			renderTable();
		})
	}
	
	
});
