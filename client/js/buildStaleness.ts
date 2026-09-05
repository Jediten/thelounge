import {ref} from "vue";

// Build hash baked in at compile time (see vite.config.ts `define`). Polled
// against the server's /version-hash endpoint: a mismatch means this tab is
// running a stale client build from before a server rebuild/redeploy.
declare const __BUILD_HASH__: string;

const buildHash = typeof __BUILD_HASH__ !== "undefined" ? __BUILD_HASH__ : "dev";

const isStale = ref(false);

// Guard against overlapping polls: a slow `fetch` must never interleave with
// the next interval tick and produce out-of-order `isStale` writes.
let inFlight: Promise<void> | null = null;

async function checkStaleness() {
	if (isStale.value) {
		return;
	}

	if (inFlight) {
		return;
	}

	inFlight = (async () => {
		let response: Response | null;

		try {
			response = await fetch("version-hash", {cache: "no-store"});
		} catch {
			// Server unreachable - not a stale build, just offline. Try again
			// at the next interval.
			return;
		}

		if (!response.ok) {
			return;
		}

		let serverHash = "";

		try {
			serverHash = (await response.text()).trim();
		} catch {
			return;
		}

		if (serverHash && serverHash !== buildHash) {
			isStale.value = true;
		}
	})();

	try {
		await inFlight;
	} finally {
		inFlight = null;
	}
}

let started = false;

/**
 * Starts polling the server build hash to detect stale client builds.
 *
 * Idempotent: only the first call installs the interval, so repeated mounts
 * cannot leak duplicate timers or cause overlapping polls.
 */
export function startStalenessChecks() {
	if (started) {
		return;
	}

	started = true;

	// Once on load plus every 10 minutes after that
	void checkStaleness();
	window.setInterval(() => void checkStaleness(), 10 * 60 * 1000);
}

export {isStale};
