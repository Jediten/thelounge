// This is a simple localStorage wrapper because browser can throw errors
// in different situations, including:
// - Unable to store data if storage is full
// - Local storage is blocked if "third-party cookies and site data" is disabled
//
// For more details, see:
// https://stackoverflow.com/q/14555347/1935861
// https://github.com/thelounge/thelounge/issues/2699
// https://www.chromium.org/for-testers/bug-reporting-guidelines/uncaught-securityerror-failed-to-read-the-localstorage-property-from-window-access-is-denied-for-this-document

/**
 * Safe `localStorage` wrapper: every method swallows storage exceptions
 * (quota, blocked cookies, SSR without `window`) so callers never need
 * their own try/catch around persistence calls.
 */
export default {
	/**
	 * Stores a string value under `key`; no-ops when storage is unavailable.
	 *
	 * @param key Storage key.
	 * @param value String value to store.
	 */
	set(key: string, value: string) {
		try {
			window.localStorage.setItem(key, value);
		} catch (e) {
			//
		}
	},
	/**
	 * Reads the value stored under `key`.
	 *
	 * @param key Storage key.
	 * @returns Stored value, or `null` when missing/unreadable.
	 */
	get(key: string) {
		try {
			return window.localStorage.getItem(key);
		} catch (e) {
			// Return null as if data is not set
			return null;
		}
	},
	/**
	 * Removes the value stored under `key`; no-ops when storage is unavailable.
	 *
	 * @param key Storage key.
	 */
	remove(key: string) {
		try {
			window.localStorage.removeItem(key);
		} catch (e) {
			//
		}
	},
	/**
	 * Clears all stored values; no-ops when storage is unavailable.
	 */
	clear() {
		try {
			window.localStorage.clear();
		} catch (e) {
			//
		}
	},
};
