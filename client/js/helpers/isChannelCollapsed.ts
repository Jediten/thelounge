import {store} from "../store";

/**
 * Reports whether a channel row should render collapsed.
 *
 * Null-safe: unknown/missing network or channel shapes return false (expanded)
 * instead of throwing, so partially-hydrated state never breaks the list.
 *
 * @param network - Network holding the collapsed flag.
 * @param channel - Channel to test (lobby/highlight/active never collapse).
 * @returns True when the channel should render collapsed.
 */
export default (network, channel) => {
	if (!network || !channel) {
		return false;
	}

	if (!network.isCollapsed || channel.highlight || channel.type === "lobby") {
		return false;
	}

	if (store.state.activeChannel && channel === store.state.activeChannel.channel) {
		return false;
	}

	return true;
};
