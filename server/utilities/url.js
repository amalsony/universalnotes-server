// getCleanURL
function getCleanURL(url) {
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);
  const whitelist = ["v", "q", "search_query"]; // Whitelist

  // Filter parameters based on the whitelist
  const cleanParams = new URLSearchParams();
  for (const [key, value] of params) {
    if (whitelist.includes(key)) {
      cleanParams.append(key, value);
    }
  }

  // Reconstruct the URL with only the whitelisted parameters
  urlObj.search = cleanParams.toString();

  // Clean the base URL without affecting the query string
  let base = urlObj.origin + urlObj.pathname;

  // Remove trailing slash if present
  if (base.endsWith("/")) {
    base = base.slice(0, -1);
  }

  // Re-append the query string if it exists
  const finalUrl = base.toLowerCase() + (urlObj.search ? urlObj.search : "");

  return finalUrl;
}

// getURLDomain
function getURLDomain(url) {
  return new URL(url).hostname.replace(/(https?:\/\/)?(www.)?/i, "");
}

// getURLPathname
function getURLPathname(url) {
  return new URL(url).pathname;
}

module.exports = {
  getCleanURL,
  getURLDomain,
  getURLPathname,
};
