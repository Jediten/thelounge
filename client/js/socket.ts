import io, {Socket as rawSocket} from "socket.io-client";
import type {ServerToClientEvents, ClientToServerEvents} from "../../shared/types/socket-events";

type Socket = rawSocket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Parses the socket.io transports list rendered into the page.
 *
 * Never throws: malformed JSON degrades to the default transports so a
 * bad server template cannot prevent connecting.
 *
 * @returns Configured transports, or the polling+websocket default.
 */
function parseTransports(): string[] {
	const fallback = ["polling", "websocket"];
	const raw = document.body.dataset.transports;

	if (!raw) {
		return fallback;
	}

	try {
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : fallback;
	} catch {
		return fallback;
	}
}

const socket: Socket = io({
	transports: parseTransports(),
	path: window.location.pathname + "socket.io/",
	autoConnect: false,
	reconnection: !document.body.classList.contains("public"),
});

// Ease debugging socket during development
if (import.meta.env.DEV) {
	window.socket = socket;
}

declare global {
	interface Window {
		socket: Socket;
	}
}

export default socket;

/**
 * Message for use when the socket disconnects and will not reconnect
 * (e.g. forced disconnects after auth failures)
 */
export const tryAgainMessage = "Disconnected from the server. Please try again later.";
