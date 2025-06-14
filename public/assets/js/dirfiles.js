
// Hex decode function
function hexDecode(hex) {
	
	let str = '';
	if (typeof hex !== 'string') {
		return str;
	}
	hex = hex.replace(/^0x/, ''); // Remove "0x" if present
	for (let i = 0; i < hex.length; i += 2) {
		str += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
	}
	return str;
}
function hexEncode(str) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
}


function openDir(dir){
	
	$('#dirtree')
		.jstree({
			'core' : {
				'data' : {
					'url' : '/api/files/filetree',
					'data' : function (node) {				
										
						return { 'dir' : node.id,'basedir':dir };
						
					}
				},
				'check_callback' : function(o, n, p, i, m) {
					if(m && m.dnd && m.pos !== 'i') { return false; }
					if(o === "move_node" || o === "copy_node") {
						if(this.get_node(n).parent === this.get_node(p).id) { return false; }
					}
					return true;
				},
				'themes' : {
					'responsive' : false,
					'variant' : 'small',
					'stripes' : true
				}
			},
			'sort' : function(a, b) {
				return this.get_type(a) === this.get_type(b) ? (this.get_text(a) > this.get_text(b) ? 1 : -1) : (this.get_type(a) >= this.get_type(b) ? 1 : -1);
			},
			'contextmenu' : {
				'items' : function(node) {
					var tmp = $.jstree.defaults.contextmenu.items();
					delete tmp.create.action;
					tmp.create.label = "New";
					tmp.create.submenu = {
						"create_folder" : {
							"separator_after"	: true,
							"label"				: "Folder",
							"action"			: function (data) {
								var inst = $.jstree.reference(data.reference),
									obj = inst.get_node(data.reference);
								inst.create_node(obj, { type : "default" }, "last", function (new_node) {
									setTimeout(function () { inst.edit(new_node); },0);
								});
							}
						},
						"create_file" : {
							"label"				: "File",
							"action"			: function (data) {
								var inst = $.jstree.reference(data.reference),
									obj = inst.get_node(data.reference);
								inst.create_node(obj, { type : "file" }, "last", function (new_node) {
									setTimeout(function () { inst.edit(new_node); },0);
								});
							}
						}
					};
					tmp.refresh = {
						"label":"Refresh",
						"action"			: function (data) {
							
							var inst = $.jstree.reference(data.reference),
									obj = inst.get_node(data.reference);
							
							$('#dirtree').jstree(true).refresh_node(obj.id)
						}
					};
					if(this.get_type(node) === "file") {
						delete tmp.create;
					}
					return tmp;
				}
			},
			'types' : {
				'default' : { 'icon' : 'folder' },
				'file' : { 'valid_children' : [], 'icon' : 'file' }
			},
			'unique' : {
				'duplicate' : function (name, counter) {
					return name + ' ' + counter;
				}
			},
			'plugins' : ['state','dnd','sort','types','contextmenu','unique']
		})
		.on('delete_node.jstree', function (e, data) {
			if(!window.confirm('Are you sure?')){
				data.instance.refresh();
				return;
			}
			const formData = { 'id' : hexDecode(data.node.id) };
			$.ajax({
				url: 'api/files/delete',
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(formData),
				success: function(datax) {
					if(datax.id){
						//data.instance.set_id(data.node, d.id);
						const npath = parentPath+'/'+data.node.text;
						
						data.instance.set_id(data.node, hexEncode(npath));
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					console.error('Error: ' + textStatus, errorThrown);
					alert('Error: ' + textStatus);
					data.instance.refresh();
				}
			});	
			
		})
		.on('create_node.jstree', function (e, data) {
			const parentPath = hexDecode(data.node.parent);
			const formData = { 'type' : data.node.type, 'id' : parentPath, 'text' : data.node.text };
			$.ajax({
				url: 'api/files/create',
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(formData),
				success: function(datax) {
					if(datax.id){
						//data.instance.set_id(data.node, d.id);
						const npath = parentPath+'/'+data.node.text;
						
						data.instance.set_id(data.node, hexEncode(npath));
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					console.error('Error: ' + textStatus, errorThrown);
					data.instance.refresh();
				}
			});	
						
		})
		.on('rename_node.jstree', function (e, data) {
			const parentPath = hexDecode(data.node.parent);
			
			const prev = hexDecode(data.node.id);
			const formData = { 'id' : prev, 'text' : data.text};
						
			var obj = data.instance.get_node(data.node.parent);
			
			$.ajax({
				url: 'api/files/rename',
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(formData),
				success: function(datax) {
					if(datax.id){
						//data.instance.set_id(data.node, d.id);
						const npath = parentPath+'/'+data.text;
						
						data.instance.set_id(data.node, hexEncode(npath));						
					}
					console.log('refres',obj.id);
					$('#dirtree').jstree(true).refresh_node(obj.id);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					console.error('Error: ' + textStatus, errorThrown);
					data.instance.refresh();
				}
			});	
			
		})
		.on('move_node.jstree', function (e, data) {
			const formData = { 'id' : hexDecode(data.node.id), 'parent' : hexDecode(data.parent)};
			$.ajax({
				url: 'api/files/move',
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(formData),
				success: function(datax) {					
					data.instance.refresh();					
				},
				error: function(jqXHR, textStatus, errorThrown) {
					console.error('Error: ' + textStatus, errorThrown);
					data.instance.refresh();
				}
			});	
			
		})
		.on('copy_node.jstree', function (e, data) {
			const formData = { 'id' : hexDecode(data.original.id), 'parent' : hexDecode(data.parent)};
			$.ajax({
				url: 'api/files/copy',
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(formData),
				success: function(datax) {					
					data.instance.refresh();					
				},
				error: function(jqXHR, textStatus, errorThrown) {
					console.error('Error: ' + textStatus, errorThrown);
					data.instance.refresh();
				}
			});				
		})
		.on('changed.jstree', function (e, data) {
			if(data && data.selected && data.selected.length) {
				
				if(data.selected && data.selected.length==1){
					const ext = '#'+data.selected;
					
					var dtype = $(ext).attr('data-type');
					
					if(dtype=='d'){
						const dirx = data.selected.join(':');
						setStatusProcess('Reading: '+dirx);
						$.get('/api/files/filetree?dir=' + dirx, function (d) {
							setStatusProcess('Done Reading: '+dirx);
							if(d && typeof d.type !== 'undefined') {
								$('#data .content').hide();
								switch(d.type) {
									case 'text':
									case 'txt':
									case 'md':
									case 'htaccess':
									case 'log':
									case 'sql':
									case 'php':
									case 'js':
									case 'json':
									case 'css':
									case 'html':
										$('#data .code').show();
										$('#code').val(d.content);
										break;
									case 'png':
									case 'jpg':
									case 'jpeg':
									case 'bmp':
									case 'gif':
										$('#data .image img').one('load', function () { $(this).css({'marginTop':'-' + $(this).height()/2 + 'px','marginLeft':'-' + $(this).width()/2 + 'px'}); }).attr('src',d.content);
										$('#data .image').show();
										break;
									default:
										$('#data .default').html(d.content).show();
										break;
								}
							}
						});
					}else if(dtype=='f'){
						
						let file = hexDecode(data.selected[0]);
						openFileThenAddToTab(file);
					}
				}
				
				
			}
			else {
				$('#data .content').hide();
				$('#data .default').html('Select a file from the tree.').show();
			}
		});
}
