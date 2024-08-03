
class Plugin {
  init() {
    throw "Plugin init() method must be implemented.";
  }
}
// app.js
class PluginManager {
  constructor() {
    this.plugins = [];
  }

  loadPlugin(plugin) {
    if (plugin && typeof plugin.init === 'function') {
      this.plugins.push(plugin);
      plugin.init(this);
      console.log(`Plugin ${plugin.constructor.name} loaded.`);
    } else {
      console.error("Invalid plugin.");
    }
  }

  loadPluginScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => {
        // Plugin class should be registered during script load
        const pluginInstance = this.pendingPluginInstance;
        if (pluginInstance) {
          this.loadPlugin(pluginInstance);
          resolve(pluginInstance);
          this.pendingPluginInstance = null; // Clear the pending plugin instance
        } else {
          reject(new Error(`Plugin instance not found for script ${url}`));
        }
      };
      script.onerror = () => reject(new Error(`Failed to load script ${url}`));
      document.head.appendChild(script);
    });
  }

  registerPluginInstance(pluginInstance) {
    this.pendingPluginInstance = pluginInstance;
  }
}

const pluginManager = new PluginManager();
