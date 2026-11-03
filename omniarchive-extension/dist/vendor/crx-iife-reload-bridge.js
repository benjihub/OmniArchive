import(chrome.runtime.getURL("vendor/crx-client-port.js"))
  .then(({ HMRPort }) => new HMRPort())
  .catch(console.error)
