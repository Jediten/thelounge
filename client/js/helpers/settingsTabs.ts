import {store} from "../store";

/**
 * Reports whether the General section of the settings dialog should be shown.
 *
 * Never throws: a missing `serverConfiguration` is treated as "show" (the
 * pre-connect default) instead of raising on property access.
 *
 * @returns True when General settings should be visible.
 */
export function shouldShowGeneralSettings() {
	const config = store.state.serverConfiguration;
	return !config?.public || !!config?.fileUpload;
}
