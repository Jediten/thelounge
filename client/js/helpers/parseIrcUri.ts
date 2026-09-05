export type ParsedIrcUri = {
	name: string;
	host: string;
	port: string;
	join: string;
	tls: boolean;
};

/**
 * Parses an `irc://` or `ircs://` URI into connect-window fields.
 *
 * Never throws: non-string or unparsable input yields an empty object (`{}`),
 * and unexpected `URL` errors degrade to the empty default instead of
 * crashing query-param handling. Returns `undefined` for well-formed URLs
 * with a non-IRC scheme so callers can tell "not an IRC link" apart from
 * "malformed IRC link" (`{}`).
 *
 * @param stringUri Raw URI string (e.g. from `?uri=` query param).
 * @returns Parsed `{name, host, port, join, tls}`, `{}` when malformed, or
 * `undefined` when the scheme is not `irc:`/`ircs:`.
 */
export default (stringUri: string): ParsedIrcUri | Record<string, never> | undefined => {
	const data: ParsedIrcUri = {
		name: "",
		host: "",
		port: "",
		join: "",
		tls: false,
	};

	if (typeof stringUri !== "string" || stringUri.length === 0) {
		return {};
	}

	try {
		// https://tools.ietf.org/html/draft-butcher-irc-url-04
		const uri = new URL(stringUri);

		// Replace protocol with a "special protocol" (that's what it's called in WHATWG spec)
		// So that the uri can be properly parsed
		if (uri.protocol === "irc:") {
			uri.protocol = "http:";

			if (!uri.port) {
				uri.port = "6667";
			}
		} else if (uri.protocol === "ircs:") {
			uri.protocol = "https:";

			if (!uri.port) {
				uri.port = "6697";
			}

			data.tls = true;
		} else {
			return;
		}

		if (!uri.hostname) {
			return {};
		}

		data.host = data.name = uri.hostname;
		data.port = uri.port;

		let channel = "";

		if (uri.pathname.length > 1) {
			channel = uri.pathname.substr(1); // Remove slash
		}

		if (uri.hash.length > 1) {
			channel += uri.hash;
		}

		// We don't split channels or append # here because the connect window takes care of that
		data.join = channel;
	} catch (e) {
		// Malformed URI (bad port, invalid URL, ...): report empty instead of
		// leaking a half-filled default or throwing inside query-param handling.
		return {};
	}

	return data;
};
