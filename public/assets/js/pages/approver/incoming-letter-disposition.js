jQuery(document).ready(function($){
	var id = window.pageData ? window.pageData.ID: '';
	if(!id){
		
		return;				
	}else{
		
	}
	
	if(id){
		getAllFlows();
		var url = window.APP_API_URL+'/api/approver/incoming-letters/'+id;
		$.ajax({
			url, 
			headers:getHeader(),			
			success:function (data) {
				console.log('data',data);
				if(data.status==1){
					var msg = data.message;
					$('#txtTitle').html(msg.subject);
					$('input[name="incomingLetterID"]').val(id);
					$('#frmDisposition').attr('action',window.APP_API_URL+'/api/approver/incoming-letters/'+id+'/dispositions');
					$('input[name="return-url"]').val('/approver/incoming-letter/'+id+'/disposition');
					getAllDispositions(id)
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
	
	function getAllFlows(){
		var id = localStorage.roleID;
		var url = window.APP_API_URL+'/api/approver/disposition-flow/search?pageSize=100';
		$.ajax({
			url, 
			headers:getHeader(),			
			success:function (data) {
				console.log('data',data);
				if(data.status==1){
					var targetRoles = data.message.data;
					var box = $('#targetRole');
					
					for(var i=0;i<targetRoles.length;i++){
						var flow = targetRoles[i];
						var elm = '<div class="form-check"><input name="toRoleID" class="form-check-input" type="checkbox" data-type="int" id="formCheck-'+flow.ID+'" value="'+flow.toRoleID+'"><label class="form-check-label" for="formCheck-'+flow.ID+'">'+flow.toRoleName+'</label></div>';
						box.append(elm);
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
	
	function getAllDispositions(incomingLetterId){
		var id = localStorage.roleID;
		var url = window.APP_API_URL+'/api/approver/incoming-letters/'+incomingLetterId+'/dispositions';
		$.ajax({
			url, 
			headers:getHeader(),			
			success:function (data) {
				console.log('data',data);
				if(data.status==1){
					var dispos = data.message;
					if(!dispos){
						return;
					}
					for(var i=0;i<dispos.length;i++){
						var dispo = dispos[i];
						var t1 = formatTime(dispo.createdAt);
						var actions = formatActionType(dispo.actions);
						var tpl = '<div class="disposition-item mb-4"><strong>'+t1+'</strong><br><strong>'+dispo.fromRoleName+'</strong> mendisposisi surat ke <strong>'+dispo.toRoleName+'</strong><br><strong>Petunjuk</strong>: '+actions+'<br><strong>Catatan</strong>: ';
						tpl += dispo.instructions+'</div>';
						$('#historybox').append(tpl);
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
	
	function formatActionType(actionids){
		var datax = [
		/*{ID:4, name:'Setuju'}, 
		{ID:5, name:'Tolak'}, 
		{ID:6, name:'Teliti dan Pendapat'}, 
		{ID:7, name:'Untuk Diketahui'}, 
		{ID:8, name:'Sesuai Catatan'}, 
		{ID:9, name:'Untuk Diperhatikan'}, 
		{ID:10, name:'Edarkan'}, 
		{ID:11, name:'Jawab'}, 
		{ID:12, name:'Perbaiki'}, 
		{ID:13, name:'Bicarakan Dengan Saya'}, 
		{ID:14, name:'Ingatkan'}, 
		{ID:15, name:'Disiapkan'}, 
		{ID:5, name:'Harap Dihadiri dan Diwakili'}, 
		*/
		{ID:1, name:'Tindak Lanjut'}, 
		{ID:2, name:'Koordinasi'}, 
		{ID:3, name:'Arsip'}
		
		];
		var result = [];
		var a = actionids.split(',');
		var n = a.length, i = 0, m = datax.length, j = 0;
		console.log('a',a);
		for(;i<n;i++){	
			console.log('asasdas',i);
			for(j=0;j<m;j++){	
				console.log('x',datax[i].ID);
				if(datax[j].ID == a[i]){
					result.push(datax[j].name);
				}
			}
		}
		return result.join(', ');
	}
});
