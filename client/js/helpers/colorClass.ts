/**
 * Maps a string (typically a nick) to a deterministic "color-N" CSS class.
 *
 * Coerces non-string input to "" so undefined nicks render the default color
 * instead of throwing, and normalizes the hash into [1, 32] (handles the
 * INT32-overflow negative case via (((h % 32) + 32) % 32)).
 *
 * @param str - Input string to hash.
 * @returns Class name from "color-1" to "color-32".
 */
export default (str: string) => {
	const input = typeof str === "string" ? str : "";
	let hash = 0;

	for (let i = 0; i < input.length; i++) {
		hash = (hash + input.charCodeAt(i)) | 0;
	}

	/*
		Modulo 32 lets us be case insensitive for ascii
		due to A being ascii 65 (100 0001)
		 while a being ascii 97 (110 0001)
	*/
	const bucket = ((hash % 32) + 32) % 32;
	return "color-" + (1 + bucket).toString();
};
