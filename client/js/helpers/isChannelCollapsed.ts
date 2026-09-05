import {store} from "../store";

/**
 * Checks whether a channel should be rendered collapsed under its network.
 *
 * Guards against nullish inputs (returns `false`) so callers iterating over
 * partially-initialized state cannot throw.
 *
 * @param network Parent network (reads `isCollapsed`).
 * @param channel Channel to check (reads `highlight` and `type`).
 * @returns True when the channel should be hidden as collapsed.
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
