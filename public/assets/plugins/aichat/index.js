
(function() {
  class AIChatPlugin extends Plugin {
    init(manager) {
		console.log("AIChatPlugin initialized.");
		// Interact with the manager or host application
		createRightToolbarButton('AI Chat', function(e){
			e.stopPropagation();			
			createRightPaneBox('AIChatOverlay','AI Chat', '/assets/plugins/aichat/dialog.html',function(){				
				
			});			
			
		});
		
    }
  }

  // Register the plugin instance with the PluginManager
  pluginManager.registerPluginInstance(new AIChatPlugin());
})();


