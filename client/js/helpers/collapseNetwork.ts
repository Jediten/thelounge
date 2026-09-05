import storage from "../localStorage";

/**
 * Reads the set of collapsed network UUIDs from local storage.
 *
 * Never throws: corrupted JSON degrades to an empty set so one bad
 * value cannot break rendering.
 *
 * @returns Set of collapsed network UUIDs.
 */
function readCollapsedNetworks(): Set<string> {
	const stored = storage.get("thelounge.networks.collapsed");

	if (!stored) {
		return new Set();
	}

	try {
		const parsed: unknown = JSON.parse(stored);
		return new Set(Array.isArray(parsed) ? parsed : []);
	} catch {
		return new Set();
	}
}

/**
 * Persists a network's collapsed state and mirrors it to local storage.
 *
 * @param network Network object to update in place.
 * @param isCollapsed Whether the network is collapsed.
 */
export default (network, isCollapsed) => {
	const networks = readCollapsedNetworks();

	network.isCollapsed = isCollapsed;

	if (isCollapsed) {
		networks.add(network.uuid);
	} else {
		networks.delete(network.uuid);
	}

	storage.set("thelounge.networks.collapsed", JSON.stringify([...networks]));
};
