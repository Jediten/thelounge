const matchFormatting =
	/\x02|\x1D|\x1F|\x16|\x0F|\x11|\x1E|\x03(?:[0-9]{1,2}(?:,[0-9]{1,2})?)?|\x04(?:[0-9a-f]{6}(?:,[0-9a-f]{6})?)?/gi;

/**
 * Strips IRC formatting/control codes from a message and trims it.
 *
 * Coerces non-string input to "" so unexpected payloads degrade to an empty
 * string instead of throwing on `.replace`.
 *
 * @param message - Raw IRC message, possibly containing control codes.
 * @returns Plain-text message with formatting removed.
 */
export function cleanIrcMessage(message: string) {
	if (typeof message !== "string") {
		return "";
	}

	return message.replace(matchFormatting, "").trim();
}

// Normalize an IRCv3 account value: `false` (logged out), `"*"`, and `""`
// all mean "no account". Anything else is a services account name.
/**
 * Normalizes an IRCv3 account value to a services account name or undefined.
 *
 * `false` (logged out), `"*"`, and `""` all mean "no account"; anything else
 * must be a non-empty string to be returned.
 *
 * @param account - Raw account tag value from the IRC message.
 * @returns Account name, or undefined when logged out/unknown.
 */
export function normalizeAccountName(account: unknown): string | undefined {
	return typeof account === "string" && account !== "" && account !== "*" ? account : undefined;
}

/**
 * Message types eligible for condensed (collapsed) display in the UI.
 */
export const condensedTypes = new Set([
	"away",
	"back",
	"chghost",
	"join",
	"kick",
	"mass_event",
	"mode",
	"nick",
	"part",
	"quit",
]);
