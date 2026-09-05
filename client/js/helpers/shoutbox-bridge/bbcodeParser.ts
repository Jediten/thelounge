import {h as createElement, type VNode} from "vue";
import parse from "../parse";
import type {ClientMessage, ClientNetwork} from "../../types";

type BbcodeNode = {
	tag: string;
	attr?: string;
	children: BbcodeChild[];
};

type BbcodeChild = BbcodeNode | string;

const supportedTags = new Set([
	"b",
	"i",
	"u",
	"s",
	"code",
	"color",
	"size",
	"font",
	"left",
	"center",
	"right",
	"quote",
	"spoiler",
	"note",
	"alert",
	"table",
	"tr",
	"td",
	"list",
	"url",
	"img",
	"video",
	"li",
]);

const tagRegexSource = /\[(\/)?([a-z*]+)(?:=([^\]]+))?\]/.source;
const tagRegexFlags = "gi";

function appendText(node: BbcodeNode, text: string) {
	if (text) {
		node.children.push(text);
	}
}

function findLastTagIndex(stack: BbcodeNode[], tagName: string) {
	for (let index = stack.length - 1; index >= 0; index -= 1) {
		if (stack[index].tag === tagName) {
			return index;
		}
	}

	return -1;
}

// Only these URL schemes are safe to render as clickable links. Anything
// else (javascript:, data:, vbscript:, ...) is dropped to plain text so a
// malicious `[url=javascript:...]` cannot execute script on click.
const SAFE_URL_SCHEMES = new Set(["http:", "https:", "mailto:"]);

function sanitizeUrl(href: string): string | null {
	if (typeof href !== "string") {
		return null;
	}

	const trimmed = href.trim();

	if (trimmed.length === 0) {
		return null;
	}

	try {
		const parsed = new URL(trimmed, window.location.origin);

		if (SAFE_URL_SCHEMES.has(parsed.protocol)) {
			return trimmed;
		}

		return null;
	} catch {
		return null;
	}
}

// Allow only safe CSS color values (hex, rgb()/hsl(), plain color names) so
// a `[color=...]` attr cannot inject arbitrary style declarations.
function sanitizeColor(value: string | undefined): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	const trimmed = value.trim();

	if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) {
		return trimmed;
	}

	if (/^(rgb|rgba|hsl|hsla)\(.*\)$/i.test(trimmed)) {
		return trimmed;
	}

	if (/^[a-z]+$/i.test(trimmed)) {
		return trimmed;
	}

	return undefined;
}

// Font sizes arrive as raw attr text appended with "px" at render time;
// accept only a finite number so `[size=...]` cannot inject CSS.
function sanitizeSize(value: string | undefined): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	const num = Number.parseFloat(value);

	if (!Number.isFinite(num)) {
		return undefined;
	}

	const clamped = Math.min(Math.max(num, 1), 72);
	return `${clamped}px`;
}

// Font families arrive as raw attr text; strip CSS delimiters so one attr
// cannot break out into additional declarations.
function sanitizeFont(value: string | undefined): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	const cleaned = value
		.replace(/[;"'\\]/g, "")
		.trim()
		.slice(0, 100);

	return cleaned.length > 0 ? cleaned : undefined;
}

function parseBbcode(text: string) {
	if (typeof text !== "string") {
		return [];
	}

	const root: BbcodeNode = {tag: "root", children: []};
	const stack = [root];
	let lastIndex = 0;

	// Build a fresh RegExp per call instead of reusing a shared `g`-flag one:
	// `String.matchAll` seeds the matcher from the regex's `lastIndex`, so a
	// shared instance would let one parse shift the next (cross-message race).
	const localTagRegex = new RegExp(tagRegexSource, tagRegexFlags);

	for (const match of text.matchAll(localTagRegex)) {
		const [fullMatch, isClosing, rawTag, rawAttr] = match;
		const current = stack[stack.length - 1];

		if (!current || typeof rawTag !== "string") {
			continue;
		}

		const matchIndex = match.index ?? lastIndex;
		appendText(current, text.slice(lastIndex, matchIndex));
		lastIndex = matchIndex + fullMatch.length;

		const tag = rawTag.toLowerCase();

		if (isClosing) {
			if (tag === "list" && stack[stack.length - 1].tag === "li") {
				stack.pop();
			}

			if (stack[stack.length - 1].tag === tag) {
				stack.pop();
			} else {
				appendText(current, fullMatch);
			}

			continue;
		}

		if (tag === "*") {
			const listIndex = findLastTagIndex(stack, "list");

			if (listIndex === -1) {
				appendText(current, fullMatch);
				continue;
			}

			while (stack.length - 1 > listIndex && stack[stack.length - 1].tag !== "li") {
				stack.pop();
			}

			if (stack[stack.length - 1].tag === "li") {
				stack.pop();
			}

			const list = stack[listIndex];
			const item: BbcodeNode = {tag: "li", children: []};
			list.children.push(item);
			stack.push(item);
			continue;
		}

		if (!supportedTags.has(tag)) {
			appendText(current, fullMatch);
			continue;
		}

		if (tag === "list") {
			const listNode: BbcodeNode = {tag, attr: rawAttr, children: []};
			current.children.push(listNode);
			stack.push(listNode);
			continue;
		}

		const node: BbcodeNode = {tag, attr: rawAttr, children: []};
		current.children.push(node);
		stack.push(node);
	}

	const top = stack[stack.length - 1] ?? root;
	appendText(top, text.slice(lastIndex));

	return root.children;
}

function collectText(nodes: BbcodeChild[]): string {
	return nodes
		.map((node) => {
			if (typeof node === "string") {
				return node;
			}

			return collectText(node.children);
		})
		.join("");
}

function flatten(
	nodes: Array<VNode | string | Array<VNode | string> | undefined>
): Array<VNode | string> {
	const out: Array<VNode | string> = [];

	for (const node of nodes) {
		if (node === undefined) {
			continue;
		}

		if (Array.isArray(node)) {
			out.push(...flatten(node));
		} else {
			out.push(node);
		}
	}

	return out;
}

function renderChildren(
	nodes: BbcodeChild[],
	message?: ClientMessage,
	network?: ClientNetwork
): Array<VNode | string> {
	if (!Array.isArray(nodes)) {
		return [];
	}

	return nodes.flatMap((node) => renderNode(node, message, network));
}

function renderNode(
	node: BbcodeChild,
	message?: ClientMessage,
	network?: ClientNetwork
): Array<VNode | string> {
	if (typeof node === "string") {
		const parsed = parse(node, message, network) as unknown as Array<
			VNode | string | Array<VNode | string> | undefined
		>;

		return flatten(parsed);
	}

	if (!node || typeof node !== "object" || !Array.isArray(node.children)) {
		return [];
	}

	const children = renderChildren(node.children, message, network);

	switch (node.tag) {
		case "root":
			return children;
		case "b":
			return [createElement("span", {class: ["irc-bold"]}, children)];
		case "i":
			return [createElement("span", {class: ["irc-italic"]}, children)];
		case "u":
			return [createElement("span", {class: ["irc-underline"]}, children)];
		case "s":
			return [createElement("span", {class: ["irc-strikethrough"]}, children)];
		case "code":
			return [createElement("span", {class: ["irc-monospace"]}, collectText(node.children))];
		case "color": {
			const color = sanitizeColor(node.attr);
			return [
				createElement(
					"span",
					{
						style: color ? {color} : undefined,
					},
					children
				),
			];
		}

		case "size": {
			const fontSize = sanitizeSize(node.attr);
			return [
				createElement(
					"span",
					{
						style: fontSize ? {fontSize} : undefined,
					},
					children
				),
			];
		}

		case "font": {
			const fontFamily = sanitizeFont(node.attr);
			return [
				createElement(
					"span",
					{
						style: fontFamily ? {fontFamily} : undefined,
					},
					children
				),
			];
		}

		case "left":
		case "center":
		case "right":
			return [
				createElement(
					"div",
					{
						style: {textAlign: node.tag},
					},
					children
				),
			];

		case "quote": {
			const quoteHeader = node.attr
				? [
						createElement("cite", {class: ["bbcode-cite"]}, [
							createElement("i", {class: ["fas", "fa-quote-left"]}),
							`Quoting ${node.attr}:`,
						]),
					]
				: [];

			return [
				createElement("blockquote", {class: ["bbcode-quote"]}, [
					...quoteHeader,
					...children,
				]),
			];
		}

		case "spoiler":
			return [
				createElement("details", {class: ["bbcode-spoiler"]}, [
					createElement("summary", {class: ["bbcode-spoiler-header"]}, [
						`${node.attr ?? "Spoiler"}`,
					]),
					createElement("div", {class: ["bbcode-spoiler-content"]}, children),
				]),
			];
		case "note":
		case "alert":
			return [createElement("div", {class: [`bbcode-${node.tag}`]}, children)];
		case "table":
			return [createElement("table", {class: ["bbcode-table"]}, children)];
		case "tr":
			return [createElement("tr", undefined, children)];
		case "td":
			return [createElement("td", undefined, children)];

		case "list": {
			const ordered = node.attr && /^\d+$/.test(node.attr);
			return [createElement(ordered ? "ol" : "ul", {class: ["bbcode-list"]}, children)];
		}

		case "li":
			return [createElement("li", undefined, children)];

		case "url": {
			const rawHref = node.attr || collectText(node.children);
			const href = sanitizeUrl(rawHref);

			if (!href) {
				return children;
			}

			return [
				createElement(
					"a",
					{
						href,
						dir: "auto",
						target: "_blank",
						rel: "noopener",
					},
					children
				),
			];
		}

		case "img":
		case "video":
			return children;
		default:
			return children;
	}
}

/**
 * Renders shoutbox BBCode into Vue nodes for display.
 *
 * Never throws: non-string input yields an empty list and per-node render
 * failures degrade to plain text, so one malformed bridged message cannot
 * break the whole channel view.
 *
 * @param text Raw message text containing BBCode tags.
 * @param message Message context forwarded to the IRC parser for plain text.
 * @param network Network context forwarded to the IRC parser.
 * @returns Flat array of Vue nodes/strings to render.
 */
export default function bbcodeParser(
	text: string,
	message?: ClientMessage,
	network?: ClientNetwork
) {
	if (typeof text !== "string") {
		return [];
	}

	try {
		return flatten(renderChildren(parseBbcode(text), message, network));
	} catch {
		return [text];
	}
}
