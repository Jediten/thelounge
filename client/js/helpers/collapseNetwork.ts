import storage from "../localStorage";
import type {ClientNetwork} from "../types";

/**
 * Persists a network's collapsed/expanded state to localStorage.
 *
 * Never throws: corrupted stored JSON is ignored (treated as empty) and
 * storage failures degrade to an in-memory-only update, so a full or blocked
 * localStorage can never break sidebar toggling.
 *
 * @param network Network whose collapsed state changed.
 * @param isCollapsed Whether the network is now collapsed.
 */
export default (network: ClientNetwork, isCollapsed: boolean) => {
	let networks: Set<string>;

	try {
		const stored = storage.get("thelounge.networks.collapsed");
		const parsed: unknown = stored ? JSON.parse(stored) : [];
		networks = new Set(Array.isArray(parsed) ? parsed : []);
	} catch {
		// Corrupted JSON (e.g. hand-edited localStorage): start fresh instead
		// of throwing inside a click handler.
		networks = new Set();
	}

	network.isCollapsed = isCollapsed;

	if (isCollapsed) {
		networks.add(network.uuid);
	} else {
		networks.delete(network.uuid);
	}

	try {
		storage.set("thelounge.networks.collapsed", JSON.stringify([...networks]));
	} catch {
		// Storage full/blocked: the in-memory `isCollapsed` above still applies
		// for this session; persistence is best-effort.
	}
};
