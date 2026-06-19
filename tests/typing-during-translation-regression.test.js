const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

function createPluginInstance() {
	class BasePlugin {}
	const BDFDB = {
		ArrayUtils: {
			is: Array.isArray
		}
	};
	global.BdApi = {
		React: {
			Component: class Component {}
		}
	};
	global.window = {
		BDFDB_Global: {
			loaded: true,
			started: true,
			PluginUtils: {
				buildPlugin: () => [BasePlugin, BDFDB]
			}
		}
	};

	const pluginPath = path.resolve(__dirname, "..", "DiscordAITranslator.plugin.js");
	delete require.cache[pluginPath];
	const PluginClass = require(pluginPath);
	const plugin = new PluginClass();
	plugin.isTranslationEnabled = () => true;
	return plugin;
}

test("channel text area editor is not disabled while translations are running", () => {
	const plugin = createPluginInstance();
	const props = {
		channel: {id: "channel-1"},
		disabled: false
	};

	plugin.processChannelTextAreaEditor({
		instance: {props}
	});

	assert.equal(props.disabled, false);
});
