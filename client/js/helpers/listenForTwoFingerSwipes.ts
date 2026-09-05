import distance from "./distance";

export type SwipeDirection = "n" | "e" | "s" | "w";

type TouchCenter = [number, number];

type SwipePoint = {
	center: TouchCenter;
	timestamp: number;
};

// onTwoFingerSwipe will be called with a cardinal direction ("n", "e", "s" or
// "w") as its only argument.
//
// Never throws: a non-function callback is ignored, and listener setup is
// skipped outside a DOM environment, so importing this module on the server
// (SSR/tests) cannot crash. History is reset after every gesture (`touchend`
// and `touchcancel`), so concurrent or interrupted touches cannot leak state
// into the next swipe (no cross-gesture race).
/**
 * Listens for two-finger swipe gestures and reports their cardinal direction.
 *
 * @param onTwoFingerSwipe Callback invoked with `"n" | "e" | "s" | "w"`.
 */
function listenForTwoFingerSwipes(onTwoFingerSwipe: (direction: SwipeDirection) => void) {
	if (typeof onTwoFingerSwipe !== "function") {
		return;
	}

	if (typeof document === "undefined" || typeof window === "undefined") {
		return;
	}

	let history: SwipePoint[] = [];

	document.body.addEventListener(
		"touchmove",
		function (event) {
			if (event.touches.length !== 2) {
				return;
			}

			const a = event.touches.item(0);
			const b = event.touches.item(1);

			if (!a || !b) {
				return;
			}

			const timestamp = window.performance.now();
			const center: TouchCenter = [(a.screenX + b.screenX) / 2, (a.screenY + b.screenY) / 2];

			if (history.length > 0) {
				const last = history[history.length - 1];
				const centersAreEqual =
					last.center[0] === center[0] && last.center[1] === center[1];

				if (last.timestamp === timestamp || centersAreEqual) {
					// Touches with the same timestamps or center don't help us
					// see the speed of movement. Ignore them.
					return;
				}
			}

			history.push({timestamp, center});
		},
		{passive: true}
	);

	document.body.addEventListener(
		"touchend",
		function (event) {
			if (event.touches.length >= 2) {
				return;
			}

			try {
				const direction = getSwipe(history);

				if (direction) {
					onTwoFingerSwipe(direction);
				}
			} finally {
				history = [];
			}
		},
		{passive: true}
	);

	document.body.addEventListener(
		"touchcancel",
		function () {
			history = [];
		},
		{passive: true}
	);
}

// Returns the cardinal direction of the swipe or null if there is no swipe.
function getSwipe(hist: SwipePoint[]): SwipeDirection | null {
	// Speed is in pixels/millisecond. Must be maintained throughout swipe.
	const MIN_SWIPE_SPEED = 0.2;

	if (!Array.isArray(hist) || hist.length < 2) {
		return null;
	}

	for (let i = 1; i < hist.length; ++i) {
		const previous = hist[i - 1];
		const current = hist[i];

		if (!previous || !current) {
			return null;
		}

		const timeDelta = Math.abs(previous.timestamp - current.timestamp);

		if (!Number.isFinite(timeDelta) || timeDelta <= 0) {
			return null;
		}

		const speed = distance(previous.center, current.center) / timeDelta;

		if (!Number.isFinite(speed) || speed < MIN_SWIPE_SPEED) {
			return null;
		}
	}

	const first = hist[0];
	const last = hist[hist.length - 1];

	if (!first || !last) {
		return null;
	}

	return getCardinalDirection(first.center, last.center);
}

function getCardinalDirection([x1, y1]: TouchCenter, [x2, y2]: TouchCenter): SwipeDirection {
	// Guard non-finite touch coordinates (can occur on synthetic events):
	// fall back to a deterministic direction instead of NaN comparisons.
	if (
		!Number.isFinite(x1) ||
		!Number.isFinite(y1) ||
		!Number.isFinite(x2) ||
		!Number.isFinite(y2)
	) {
		return "e";
	}

	if (x1 === x2) {
		return y1 < y2 ? "s" : "n";
	}

	// If θ is the angle of the vector then this is tan(θ)
	const tangent = (y2 - y1) / (x2 - x1);

	// All values of |tan(-45° to 45°)| are less than 1, same for 145° to 225°
	if (Math.abs(tangent) < 1) {
		return x1 < x2 ? "e" : "w";
	}

	return y1 < y2 ? "s" : "n";
}

export default listenForTwoFingerSwipes;
