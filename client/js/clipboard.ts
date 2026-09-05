/**
 * Copies a multi-element chat selection via a temporary off-screen container.
 *
 * Never throws: missing `chat` container, empty selection, or DOM errors are
 * no-ops, so clipboard handling can never break message rendering. The
 * temporary node is always removed (even on error) to avoid leaking a
 * `js-copy-hack` element into the chat on repeated copies.
 *
 * @param chat Chat container used to host the temporary copy node.
 */
export default function (chat: HTMLDivElement) {
	try {
		if (!chat || typeof chat.appendChild !== "function") {
			return;
		}

		// Disable in Firefox as it already copies flex text correctly
		// @ts-expect-error Property 'InstallTrigger' does not exist on type 'Window & typeof globalThis'.ts(2339)
		if (typeof window.InstallTrigger !== "undefined") {
			return;
		}

		const selection = window.getSelection();

		if (!selection || selection.rangeCount === 0) {
			return;
		}

		// If selection does not span multiple elements, do nothing
		if (selection.anchorNode === selection.focusNode) {
			return;
		}

		const range = selection.getRangeAt(0);
		const documentFragment = range.cloneContents();
		const div = document.createElement("div");

		div.id = "js-copy-hack";
		div.appendChild(documentFragment);
		chat.appendChild(div);

		selection.selectAllChildren(div);

		window.setTimeout(() => {
			try {
				if (div.parentNode === chat) {
					chat.removeChild(div);
				}

				selection.removeAllRanges();
				selection.addRange(range);
			} catch {
				// Best-effort restore: never throw from a timer callback.
			}
		}, 0);
	} catch {
		// Clipboard helpers must never break rendering.
	}
}
