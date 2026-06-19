const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

function createPluginInstance() {
	class BasePlugin {}
	const BDFDB = {
		ArrayUtils: {
			is: Array.isArray,
			remove: (array, value, removeAll = false) => {
				if (!Array.isArray(array)) return array;
				for (let index = array.length - 1; index >= 0; index--) {
					if (array[index] != value) continue;
					array.splice(index, 1);
					if (!removeAll) break;
				}
				return array;
			}
		},
		DataUtils: {
			load: () => ({}),
			save: () => {}
		},
		DiscordObjects: {
			Message: class Message {
				constructor(data) {
					Object.assign(this, data);
				}
			}
		},
		ObjectUtils: {
			isEmpty: object => !object || !Object.keys(object).length
		},
		LibraryStores: {
			ChannelStore: {
				getChannel: () => null
			},
			SelectedChannelStore: {
				getChannelId: () => "channel-1"
			}
		},
		UserUtils: {
			me: {id: "current-user"}
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
	plugin.settings = {
		general: {
			protectQuotedText: true,
			usePerChatTranslation: true,
			showOriginalMessage: false,
			showOriginalDirectly: false
		},
		exceptions: {
			wordStart: ["!"],
			protectedTerms: [],
			wrapperPairs: []
		},
		engines: {
			translator: "googleapi",
			backup: "----"
		},
		filters: {
			skipSameLanguageReceivedMessages: true,
			treatLanguageVariantsAsSame: true,
			dropSimilarTranslations: true,
			translationSimilarityThreshold: 0.9
		},
		choices: {
			received: {input: "auto", output: "en"},
			sent: {input: "auto", output: "en"}
		}
	};
	plugin.defaults = {
		choices: {
			received: {value: {input: "auto", output: "en"}},
			sent: {value: {input: "auto", output: "en"}}
		},
		general: {}
	};
	plugin.isTranslationEnabled = () => false;
	plugin.isReceivedAutoTranslationEnabled = () => false;
	plugin.isOwnMessage = () => false;
	plugin.lockManualTranslationScroll = () => {};
	plugin.scheduleTranslationRerender = () => {};
	return plugin;
}

test("manual message translate ignores hidden auto-translation state when master switch is off", async () => {
	const plugin = createPluginInstance();
	const channel = {id: "channel-1"};
	const message = {
		id: "message-1",
		channel_id: channel.id,
		content: "hola",
		embeds: [],
		author: {id: "other-user"}
	};

	plugin.applyStoredTranslationToMessage(message, {
		channelId: channel.id,
		auto: true,
		content: "hello\n> hola",
		translatedContent: "hello",
		originalContent: "hola"
	});

	assert.equal(plugin.getActiveMessageTranslation(message, channel.id), null);

	let translateCalls = 0;
	plugin.translateText = (_text, _place, callback) => {
		translateCalls++;
		callback("hello", {id: "es"}, {id: "en"}, {});
	};

	const result = await plugin.translateMessage(message, channel, {manual: true, independentOfTextAreaSwitch: true});
	assert.equal(result, true);
	assert.equal(translateCalls, 1);

	const activeTranslation = plugin.getActiveMessageTranslation(message, channel.id);
	assert.ok(activeTranslation);
	assert.equal(activeTranslation.translatedContent, "hello");
	assert.equal(activeTranslation.auto, false);
	assert.equal(activeTranslation.manual, true);
	assert.equal(activeTranslation.independentOfTextAreaSwitch, true);
});
