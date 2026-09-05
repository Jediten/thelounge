/**
 * Checks whether a keybind event should be ignored because the user is typing.
 *
 * Returns `false` for events without a form-field target instead of throwing
 * on missing `target`/`tagName` access.
 *
 * @param event Mouse or keyboard event to inspect.
 * @returns True when focus is in a non-empty input/textarea (keybind ignored).
 */
export default (event: MouseEvent | Mousetrap.ExtendedKeyboardEvent) => {
	const target = event?.target as HTMLElement | null;

	if (!target || (target.tagName !== "TEXTAREA" && target.tagName !== "INPUT")) {
		return false;
	}

	// If focus is in a textarea, do not handle keybinds if user has typed anything
	// This is done to prevent keyboard layout binds conflicting with ours
	// For example alt+shift+left on macos selects a word
	return !!(target as HTMLInputElement).value;
};
