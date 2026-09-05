import {store} from "../store";

/**
 * Whether the general settings tab should be shown.
 *
 * On public instances the general tab is hidden unless file uploads are
 * enabled; missing server configuration defaults to visible rather than
 * throwing so first paint never breaks.
 *
 * @returns True when the general settings section should render.
 */
export function shouldShowGeneralSettings() {
	const config = store.state.serverConfiguration;
	return !config?.public || !!config?.fileUpload;
}
