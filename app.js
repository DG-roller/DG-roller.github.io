(function initGreenBox() {
  var codenameInput = document.getElementById('agent-codename');
  var storageKey = 'greenbox.agentCodename';

  if (!codenameInput) {
    return;
  }

  codenameInput.value = loadCodename(storageKey);

  codenameInput.addEventListener('input', function onCodenameInput(event) {
    var safeName = sanitizeAgentName(event.target.value);
    saveCodename(storageKey, safeName);
  });

  codenameInput.addEventListener('blur', function onCodenameBlur(event) {
    var safeName = sanitizeAgentName(event.target.value);
    event.target.value = safeName;
    saveCodename(storageKey, safeName);
  });
})();

function sanitizeAgentName(name) {
  var fallback = 'Agent UNKNOWN';

  if (typeof name !== 'string') {
    return fallback;
  }

  var trimmed = name.trim().replace(/\s+/g, ' ');

  if (!trimmed) {
    return fallback;
  }

  return trimmed.slice(0, 24);
}

function loadCodename(key) {
  var storedName = localStorage.getItem(key);
  return sanitizeAgentName(storedName);
}

function saveCodename(key, value) {
  localStorage.setItem(key, sanitizeAgentName(value));
}
