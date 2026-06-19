const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

function createPluginInstance() {
	class BasePlugin {}
	const BDFDB = {
		ArrayUtils: {
			is: Array.isArray
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
			usePerChatTranslation: true
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
			skipMixedReceivedMessages: false,
			skipSameLanguageReceivedMessages: true,
			treatLanguageVariantsAsSame: true,
			dropSimilarTranslations: true,
			translationSimilarityThreshold: 0.9
		},
		choices: {
			received: {input: "auto", output: "zh-CN"},
			sent: {input: "auto", output: "en"}
		}
	};
	plugin.defaults = {
		choices: {
			received: {value: {input: "auto", output: "zh-CN"}},
			sent: {value: {input: "auto", output: "en"}}
		},
		general: {}
	};
	plugin.isTranslationEnabled = () => true;
	plugin.isReceivedAutoTranslationEnabled = () => true;
	plugin.isOwnMessage = () => false;
	return plugin;
}

test("symbol-only received messages are skipped before auto-translate", () => {
	const plugin = createPluginInstance();
	const message = {
		id: "message-symbol-only",
		content: "?",
		embeds: [],
		author: {id: "other-user"}
	};
	const channel = {id: "channel-symbol-only"};

	assert.equal(plugin.shouldAutoTranslateReceivedMessage(message, channel, null, true), false);
});

test("cached skip decisions stop the same received message from re-entering auto-translate", () => {
	const plugin = createPluginInstance();
	const message = {
		id: "message-skip-cache",
		content: "hello world",
		embeds: [],
		author: {id: "other-user"}
	};
	const channel = {id: "channel-skip-cache"};
	const originalContentData = {content: message.content, embeds: []};
	const signature = plugin.createReceivedTranslationSignature(message, channel.id, originalContentData);

	plugin.persistReceivedSkipDecision(message.id, signature, "ai_skip_signal", message.content);

	assert.equal(plugin.getCachedReceivedSkipDecision(message, channel.id, originalContentData).reason, "ai_skip_signal");
	assert.equal(plugin.shouldAutoTranslateReceivedMessage(message, channel, originalContentData, true), false);
});

test("link-only received messages are skipped even when Discord has an embed preview", () => {
	const plugin = createPluginInstance();
	const message = {
		id: "message-link-only",
		content: "https://github.com/MK6657/zcode2api",
		embeds: [{
			title: "GitHub - MK6657/zcode2api",
			description: "Contribute to MK6657/zcode2api development by creating an account on GitHub."
		}],
		author: {id: "other-user"}
	};
	const channel = {id: "channel-link-only"};
	const originalContentData = plugin.extractOriginalContentData(message);

	assert.equal(plugin.isLinkOnlyReceivedContent(originalContentData), true);
	assert.equal(plugin.getReceivedAutoTranslateSkipReason(originalContentData, channel.id), "link_only");
	assert.equal(plugin.shouldAutoTranslateReceivedMessage(message, channel, originalContentData, true), false);
});
