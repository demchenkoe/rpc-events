

function eventNameToMethodName(prefix, str) {
  return prefix +
    (str.substr(0,1).toUpperCase() + str.substr(1).toLowerCase())
    .replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); })
}

function eventNameFromMethodName(prefix, str) {
  return str.substr(prefix.length).toUpperCase()
}

module.exports = { eventNameToMethodName, eventNameFromMethodName }