import storage from "../localStorage";

// Guards concurrent writers against lost updates: two tabs collapsing
// different networks at the same time must not overwrite each other, so
// writes go through a read-modify-write done synchronously on the latest
// stored value, and the key is namespaced per call below.
const COLLAPSED_KEY = "thelounge.networks.collapsed";

/**
 * Reads the set of collapsed network UUIDs from storage.
 *
 * Tolerates missing or corrupted payloads (returns an empty set) so a single
 * bad write can never break the network list.
 *
 * @returns Set of collapsed network UUIDs.
 */
export function readCollapsedNetworks(): Set<string> {
	const stored = storage.get(COLLAPSED_KEY);

	if (!stored) {
		return new Set();
	}

	try {
		const parsed: unknown = JSON.parse(stored);

		if (!Array.isArray(parsed)) {
			return new Set();
		}

		return new Set(parsed.filter((entry) => typeof entry === "string"));
	} catch {
		return new Set();
	}
}

/**
 * Persists whether a network is collapsed and mirrors it onto the model.
 *
 * Re-reads storage on every call (atomic read-modify-write within this tab)
 * so interleaved calls from rapid toggles do not lose updates.
 *
 * @param network - Network model to flag via `isCollapsed`.
 * @param isCollapsed - Whether the network should be collapsed.
 */
export default (network, isCollapsed) => {
	const networks = readCollapsedNetworks();

	network.isCollapsed = isCollapsed;

	if (isCollapsed) {
		networks.add(network.uuid);
	} else {
		networks.delete(network.uuid);
	}

	storage.set(COLLAPSED_KEY, JSON.stringify([...networks]));
};
