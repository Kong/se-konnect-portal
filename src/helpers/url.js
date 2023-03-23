const absoluteUrlRegex = /^(?:[a-z+]+:)?\/\//i

export function isExternalUrl (url) {
  if (!absoluteUrlRegex.test(url)) {
    return false
  }

  try {
    const u = new URL(url)

    return u.origin !== new URL(document.baseURI).origin
  } catch (e) {
    // fallback to true - untrusted
    return true
  }
}
