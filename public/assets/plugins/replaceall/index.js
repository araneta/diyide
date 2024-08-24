
(function() {
  class ReplaceAllPlugin extends Plugin {
    init(manager) {
		console.log("ReplaceAllPlugin initialized.");
		// Interact with the manager or host application
		createBottomToolbarButton('Replace All', function(e){
			e.stopPropagation();			
			var modal = createOverlayBox('replaceAllOverlay','Replace All', '/assets/plugins/replaceall/dialog.html',function(){				
				
			});			
			$(modal).css({height:'100px'});
			
		});
		
    }
  }

  // Register the plugin instance with the PluginManager
  pluginManager.registerPluginInstance(new ReplaceAllPlugin());
})();


