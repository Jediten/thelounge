// This is a thin wrapper around `window.location`, in order to contain the
// side-effects. Do not add logic to it as it cannot be tested, only mocked.
/**
 * Thin test-seam wrapper around `window.location`.
 *
 * Never throws: missing `window`/`location` (SSR, workers) is a no-op.
 */
export default {
	/**
	 * Reloads the current page; no-ops when `window.location` is unavailable.
	 */
	reload() {
		try {
			window.location.reload();
		} catch {
			// Non-browser environment: nothing to reload.
		}
	},
};
