
(function() {
  class AIChatPlugin extends Plugin {
    init(manager) {
		console.log("AIChatPlugin initialized.");
		// Interact with the manager or host application
		createBottomToolbarButton('AI Chat', function(e){
			e.stopPropagation();			
			createOverlayBox('AIChatOverlay','AI Chat', '/assets/plugins/aichat/dialog.html',function(){				
				
			});			
			
		});
		
    }
  }

  // Register the plugin instance with the PluginManager
  pluginManager.registerPluginInstance(new AIChatPlugin());
})();


