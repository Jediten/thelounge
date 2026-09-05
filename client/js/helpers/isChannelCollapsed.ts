import {store} from "../store";
import type {ClientChan, ClientNetwork} from "../types";

/**
 * Reports whether a channel should be hidden because its network is collapsed.
 *
 * Never throws: nullish network/channel input is treated as "not collapsed"
 * instead of raising a `TypeError`, so keybind navigation and filtering can
 * never crash on partially-initialized state.
 *
 * @param network Network owning the channel.
 * @param channel Channel to test.
 * @returns True when the channel should be hidden, false otherwise.
 */
export default (network: ClientNetwork, channel: ClientChan) => {
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
