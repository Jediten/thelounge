import {store} from "../store";

/**
 * Checks whether the General settings tab should be shown.
 *
 * Reads live store state on each call (no caching), so concurrent settings
 * updates cannot observe a stale snapshot.
 *
 * @returns True when the server is non-public or file upload is enabled.
 */
export function shouldShowGeneralSettings() {
	const config = store.state.serverConfiguration;
	return !config?.public || !!config?.fileUpload;
}
