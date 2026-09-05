import {MessageType, SharedMsg} from "../../../shared/types/msg";

/**
 * Extracts up to `limit` self-authored message texts, most-recent first.
 *
 * Defensive: tolerates null/undefined inputs (returns []) so late-arriving
 * socket payloads can never throw during history merges.
 *
 * @param messages - Messages to scan.
 * @param limit - Maximum number of entries to return.
 * @returns Message texts, most-recent first.
 */
export function extractInputHistory(
	messages: SharedMsg[] | null | undefined,
	limit: number
): string[] {
	if (!Array.isArray(messages) || !Number.isFinite(limit) || limit <= 0) {
		return [];
	}

	return (
		messages
			.filter((m) => !!m && m.self && m.text && m.type === MessageType.MESSAGE)
			// TS is too stupid to see the guard in .filter(), so we monkey patch it
			// to please the compiler
			.map((m) => m.text!)
			.reverse()
			.slice(0, Math.floor(limit))
	);
}
