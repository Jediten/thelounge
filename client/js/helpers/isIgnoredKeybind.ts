/**
 * Reports whether a keybind handler should ignore this event because the user
 * is typing in an input field with content.
 *
 * Never throws: events without a target (or with a non-element target) are
 * reported as "not ignored" instead of raising a `TypeError` on `.tagName`.
 *
 * @param event Key/mouse event to test.
 * @returns True when the keybind should be skipped, false otherwise.
 */
export default (event: MouseEvent | Mousetrap.ExtendedKeyboardEvent) => {
	const target = event?.target as HTMLElement | null | undefined;
	const tagName = target && typeof target.tagName === "string" ? target.tagName : "";

	if (tagName !== "TEXTAREA" && tagName !== "INPUT") {
		return false;
	}

	// If focus is in a textarea, do not handle keybinds if user has typed anything
	// This is done to prevent keyboard layout binds conflicting with ours
	// For example alt+shift+left on macos selects a word
	return !!(target as unknown as {value?: unknown}).value;
};
