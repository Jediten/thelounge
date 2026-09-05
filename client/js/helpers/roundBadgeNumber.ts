/**
 * Formats an unread-count badge, rounding thousands to one decimal (e.g. 1234 -> "1.2k").
 *
 * Guards against non-finite or negative input so badge rendering never shows
 * "NaNk": invalid values fall back to "0".
 *
 * @param count - Unread message count.
 * @returns Badge label such as "123" or "1.2k".
 */
export default (count: number) => {
	if (!Number.isFinite(count) || count <= 0) {
		return "0";
	}

	if (count < 1000) {
		return Math.floor(count).toString();
	}

	return (count / 1000).toFixed(2).slice(0, -1) + "k";
};
