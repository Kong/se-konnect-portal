function removeElementFromDOMById (id) {
  return document.getElementById(id)?.remove()
}

export default removeElementFromDOMById
