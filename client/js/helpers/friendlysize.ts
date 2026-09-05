const sizes = ["Bytes", "KiB", "MiB", "GiB", "TiB", "PiB"];

/**
 * Formats a byte count as a human-readable string (e.g. "50 KiB").
 *
 * Guards against non-finite, negative, and out-of-range inputs so callers
 * never render "NaN undefined" or throw: invalid values fall back to "0 Bytes"
 * and indices beyond PiB are clamped to the largest known unit.
 *
 * @param size - Size in bytes.
 * @returns Human-readable size such as "1.2 MiB".
 */
export default (size: number) => {
	// Loosely inspired from https://stackoverflow.com/a/18650828/1935861
	if (!Number.isFinite(size) || size <= 0) {
		return "0 Bytes";
	}

	const rawIndex = Math.floor(Math.log(size) / Math.log(1024));
	const i = Math.min(rawIndex, sizes.length - 1);
	const fixedSize = parseFloat((size / Math.pow(1024, i)).toFixed(1));
	return `${fixedSize} ${sizes[i]}`;
};
