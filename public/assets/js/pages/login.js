jQuery(document).ready(function($){
	$('#loginform').submit(function(e){
		
		e.preventDefault();
		$('#btn-login').prop('disabled', true);
		
		const datax = {			
			username:$('#login-username').val(), 
			password:$('#login-password').val()
		};
	
		$.ajax({		
			type: 'POST',
			crossDomain: true,
			url: window.APP_API_URL+'/auth/login',		
			data: JSON.stringify(datax),
			headers: {
			   "X-Requested-With": "XMLHttpRequest",
			   "Content-Type": "application/json"
			},
			success(data) {				
				console.log(data);
				
				if(data.token){
					localStorage.token = data.token;
					localStorage.userID = data.userID;					
					localStorage.roleID = data.roleID;
					
					if(data.roleID == 1){//admin
						window.location = '/admin/dashboard';
					}else if(data.roleID == 2){//reviewer
						window.location = '/reviewer/dashboard';
					}else if(data.roleID == 3){//approver
						window.location = '/approver/dashboard';
					}
						
				}else{
						$('#loginform .statusbox').html('<div class="alert alert-danger">Login Salah</div>');
				}
			},
			error(data) { // if error occured
				if (data.status === 0) {
					 alert('Not connected. Verify your network.');
				}else{
					try{
						const responseText = $.parseJSON(data.responseText);
						if(responseText.error){
							$('#loginform .statusbox').html('<div class="alert alert-danger">'+responseText.error.message+'</div>');
						}
					}catch(ex){
						console.log(ex);
						alert(ex);
					}
				}
				
			}
		})
		.done(data => {
			$('#btn-login').prop('disabled', false);
		})

	});
});
