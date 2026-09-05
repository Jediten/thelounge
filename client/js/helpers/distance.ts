/**
 * Computes the Euclidean distance between two 2D points.
 *
 * Returns NaN (rather than throwing on destructuring) when given malformed
 * touch coordinates, so gesture handlers degrade gracefully.
 *
 * @param a - First point as [x, y].
 * @param b - Second point as [x, y].
 * @returns Euclidean distance, or NaN for invalid input.
 */
function distance(a: [number, number], b: [number, number]) {
	if (
		!Array.isArray(a) ||
		!Array.isArray(b) ||
		a.length < 2 ||
		b.length < 2 ||
		!Number.isFinite(a[0]) ||
		!Number.isFinite(a[1]) ||
		!Number.isFinite(b[0]) ||
		!Number.isFinite(b[1])
	) {
		return NaN;
	}

	return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export default distance;
