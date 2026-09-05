import {nextTick} from "vue";

import socket from "../socket";
import {store} from "../store";
import {extractInputHistory} from "../helpers/inputHistory";
import {markMsgsRaw, unshiftMany} from "../chan";

// Serializes concurrent "more" (scrollback) responses per channel: each
// response mutates the same messages/inputHistory arrays, so without a
// per-channel promise chain two overlapping fetches can interleave (concat +
// prepend + trim in different orders) and drop or duplicate rows.
const moreChains = new Map<number, Promise<void>>();

socket.on("more", (data) => {
	const key = data?.chan;
	const prev = moreChains.get(key) ?? Promise.resolve();
	const next = prev
		.catch(() => undefined)
		.then(() => handleMore(data))
		.catch(() => undefined);
	moreChains.set(key, next);

	// Bound the map: channels that never request again must not leak entries.
	void next.then(() => {
		if (moreChains.get(key) === next) {
			moreChains.delete(key);
		}
	});
});

async function handleMore(data) {
	const channel = store.getters.findChannel(data.chan)?.channel;

	if (!channel) {
		return;
	}

	// Remaining capacity can go negative once 100 entries are buffered;
	// clamp to 0 so extractInputHistory never sees a negative limit.
	const remaining = Math.max(0, 100 - channel.inputHistory.length);

	if (Array.isArray(data.messages) && data.messages.length > 0 && remaining > 0) {
		try {
			channel.inputHistory = channel.inputHistory.concat(
				extractInputHistory(data.messages, remaining)
			);
		} catch {
			// History is best-effort: never let it break scrollback rendering.
		}
	}

	channel.moreHistoryAvailable =
		data.moreHistoryAvailable ??
		(data.totalMessages !== undefined &&
			data.totalMessages > channel.messages.length + data.messages.length);

	// Drop page messages already present: rows fetched from the database get
	// fresh session ids on every request, but carry the stable storage id
	// of their row, so identity comparison works again (unlike timestamps).
	const known = new Set(channel.messages.map((m) => messageKey(m)));
	const fresh = markMsgsRaw(data.messages).filter((m) => !known.has(messageKey(m)));

	// Chunked prepend: a single spread call blows the call stack on large
	// history batches (see unshiftMany). Mirror the server's scrollback cap
	// so both sides evict the same oldest messages and anchors stay valid.
	unshiftMany(channel.messages, fresh);

	const batchSize = store.state.settings.statusMessages !== "shown" ? 1000 : 100;
	const maxBuffered = 3 * batchSize;

	if (channel.messages.length > maxBuffered) {
		channel.messages.splice(0, channel.messages.length - maxBuffered);
	}

	try {
		await nextTick();
	} finally {
		channel.historyLoading = false;
	}
}

// Stable identity for dedupe: the storage row id when known, otherwise the
// session id (unique within a session for anything never reloaded).
function messageKey(m: {id: number; storageId?: number}): string {
	return m.storageId !== undefined && m.storageId !== null ? `s${m.storageId}` : `m${m.id}`;
}
