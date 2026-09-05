import storage from "../localStorage";

/**
 * Persists a network's collapsed state and mirrors it to localStorage.
 *
 * Never throws: corrupted stored JSON is discarded (reset to empty) instead
 * of propagating a `SyntaxError` into UI event handlers.
 *
 * @param network Network object to update (mutates `isCollapsed` in place).
 * @param isCollapsed Whether the network should be collapsed.
 */
export default (network, isCollapsed) => {
	let networks: Set<unknown>;

	try {
		const stored = storage.get("thelounge.networks.collapsed");
		networks = stored ? new Set(JSON.parse(stored)) : new Set();
	} catch {
		networks = new Set();
	}

	network.isCollapsed = isCollapsed;

	if (isCollapsed) {
		networks.add(network.uuid);
	} else {
		networks.delete(network.uuid);
	}

	storage.set("thelounge.networks.collapsed", JSON.stringify([...networks]));
};
