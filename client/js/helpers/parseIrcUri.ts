export type ParsedIrcUri = {
	name: string;
	host: string;
	port: string;
	join: string;
	tls: boolean;
};

/**
 * Parses an irc:// or ircs:// URI into connect-form defaults.
 *
 * Never throws: non-string or unparseable input yields a blank result object,
 * and unknown schemes yield undefined so callers can fall back cleanly.
 * Hostnames are lowercased and ports validated to keep router query params
 * well-formed.
 *
 * @param stringUri - URI such as "ircs://example.com:6697/#chan".
 * @returns Parsed host/port/join/tls fields, {} for bad hosts, or undefined
 * for non-IRC schemes.
 */
export default (stringUri: string): ParsedIrcUri | Record<string, never> | undefined => {
	const data: ParsedIrcUri = {
		name: "",
		host: "",
		port: "",
		join: "",
		tls: false,
	};

	if (typeof stringUri !== "string" || !stringUri) {
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

		if (uri.port && !/^\d+$/.test(uri.port)) {
			return {};
		}

		data.host = data.name = uri.hostname.toLowerCase();
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
