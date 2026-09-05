/**
 * Parses an `irc://` or `ircs://` URI into connection details.
 *
 * Never throws: non-string or malformed input yields a default (empty)
 * result, an unsupported scheme yields `undefined`, and a missing hostname
 * yields `{}` (preserving historical behavior relied upon by callers/tests).
 *
 * @param stringUri IRC URI to parse (e.g. `ircs://example.com:6697/#chan`).
 * @returns Parsed `{name, host, port, join, tls}` data, `{}` when the
 * hostname is missing, or `undefined` for unsupported schemes.
 */
export default (stringUri: string) => {
	const data = {
		name: "",
		host: "",
		port: "",
		join: "",
		tls: false,
	};

	if (typeof stringUri !== "string") {
		return data;
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
		// do nothing on invalid uri
	}

	return data;
};
