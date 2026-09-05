/**
 * Opens a URL in a new tab with `noopener noreferrer`.
 *
 * Validates the href up-front (rejects empty, non-http(s) schemes such as
 * `javascript:`) so a malicious link can never be opened from the app, and
 * no-ops safely when there is no DOM (SSR/tests) or when popup blockers
 * prevent the synthetic click.
 *
 * @param href - Absolute or relative URL to open.
 */
export function openInNewTab(href: string) {
	if (!href) {
		return;
	}

	let url: URL | null = null;

	try {
		url = new URL(href, window.location.href);
	} catch {
		return;
	}

	if (url.protocol !== "http:" && url.protocol !== "https:") {
		return;
	}

	if (typeof document === "undefined") {
		return;
	}

	try {
		Object.assign(document.createElement("a"), {
			target: "_blank",
			rel: "noopener noreferrer",
			href: url.toString(),
		}).click();
	} catch {
		// Popup blockers or missing DOM: opening is best-effort only.
	}
}
