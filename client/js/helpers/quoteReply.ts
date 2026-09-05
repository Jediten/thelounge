// Quote-style replies: paste an IRC-formatted quote of a message into the
// input box. This is independent of IRCv3 protocol replies and works on any
// network, including ones without +reply support.

/**
 * Formats a quote-style reply (`<nick>: "..."`) from a nick and message text.
 *
 * Uses the first non-empty line (truncated to 200 chars) so multiline pastes
 * collapse to a single-line quote; returns null when there is nothing quotable.
 *
 * @param nick - Nick of the message author.
 * @param text - Raw message text, possibly multiline.
 * @returns IRC-formatted quote, or null when nick/text are empty.
 */
export function formatQuoteReply(nick: string, text: string): string | null {
	if (typeof nick !== "string" || typeof text !== "string" || !nick || !text) {
		return null;
	}

	const firstLine = text.split("\n").find((line) => line.trim().length > 0) ?? "";
	const content = firstLine.substring(0, 200);

	if (!content) {
		return null;
	}

	// Strip IRC formatting/control codes from the quoted nick so the bold
	// markers we add cannot be broken or spoofed by control characters.
	const cleanNick = nick.replace(/[\x00-\x1F\x7F]/g, "");

	if (!cleanNick) {
		return null;
	}

	return `\x02${cleanNick}\x02: \x0314,99"\x1D${content}\x1D"\x03`;
}
