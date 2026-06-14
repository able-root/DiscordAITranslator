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
	plugin.settings = {
		general: {
			protectQuotedText: true,
			usePerChatTranslation: true
		},
		exceptions: {
			wordStart: ["!"],
			protectedTerms: ["BUG team", "ChatGPT Plus"],
			wrapperPairs: ['"|"', "“|”", "`|`"]
		},
		engines: {
			translator: "googleapi",
			backup: "----"
		}
	};
	return plugin;
}

function runProtection(text, place = "sent") {
	const plugin = createPluginInstance();
	const [maskedText, excepts, shouldTranslate] = plugin.removeExceptions(text, place);
	return {
		maskedText,
		excepts,
		protectedValues: Object.values(excepts),
		shouldTranslate,
		restoredText: plugin.addExceptions(maskedText, excepts)
	};
}

test("纯三反引号代码块会整体保护并跳过翻译", () => {
	const source = "```js\nconst model = \"deepseek-v3\";\n```";
	const result = runProtection(source, "sent");

	assert.equal(result.shouldTranslate, false);
	assert.deepEqual(result.protectedValues, [source]);
	assert.equal(result.restoredText, source);
});

test("行内反引号和手动保护词会一起保留", () => {
	const source = "Use `default` for BUG team and ChatGPT Plus only";
	const result = runProtection(source, "sent");

	assert.match(result.maskedText, /\{\{0\}\}/);
	assert.match(result.maskedText, /\{\{1\}\}/);
	assert.match(result.maskedText, /\{\{2\}\}/);
	assert.ok(result.protectedValues.includes("`default`"));
	assert.ok(result.protectedValues.includes("BUG team"));
	assert.ok(result.protectedValues.includes("ChatGPT Plus"));
	assert.equal(result.restoredText, source);
});

test("URL 域名 邮箱 模型名会自动保护", () => {
	const source = "Docs https://api.deepseek.com/chat/completions via platform.openai.com contact name@example.com and Claude 3.7 Sonnet";
	const result = runProtection(source, "sent");

	assert.ok(result.protectedValues.includes("https://api.deepseek.com/chat/completions"));
	assert.ok(result.protectedValues.includes("platform.openai.com"));
	assert.ok(result.protectedValues.includes("name@example.com"));
	assert.ok(result.protectedValues.includes("Claude 3.7 Sonnet"));
	assert.equal(result.restoredText, source);
});

test("接收消息里的 Discord 特殊对象仍会被保护", () => {
	const source = "hello <@!123456789> <:wave:456789> world";
	const result = runProtection(source, "received");

	assert.ok(result.protectedValues.includes("<@!123456789>"));
	assert.ok(result.protectedValues.includes("<:wave:456789>"));
	assert.equal(result.restoredText, source);
});

test("普通版本号不会被误判成域名或模型名", () => {
	const source = "版本 3.1 不应该被自动保护";
	const result = runProtection(source, "sent");

	assert.deepEqual(result.protectedValues, []);
	assert.equal(result.shouldTranslate, true);
	assert.equal(result.restoredText, source);
});
