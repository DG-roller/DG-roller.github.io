(function initGreenBox() {
  var codenameInput = document.getElementById('agent-codename');
  var targetInput = document.getElementById('target-number');
  var rollD100Button = document.getElementById('roll-d100-button');
  var lethalityToggle = document.getElementById('lethality-toggle');
  var lethalityInput = document.getElementById('lethality-rating');
  var rollLethalityButton = document.getElementById('roll-lethality-button');
  var polyButtons = document.querySelectorAll('[data-die-sides]');
  var logView = document.getElementById('roll-log');
  var storageKey = 'greenbox.agentCodename';

  if (!codenameInput || !targetInput || !rollD100Button || !lethalityToggle || !lethalityInput || !rollLethalityButton || !logView) {
    return;
  }

  codenameInput.value = loadCodename(storageKey);
  updateLethalityState(lethalityToggle.checked, lethalityInput, rollLethalityButton);

  codenameInput.addEventListener('input', function onCodenameInput(event) {
    var safeName = sanitizeAgentName(event.target.value);
    saveCodename(storageKey, safeName);
  });

  codenameInput.addEventListener('blur', function onCodenameBlur(event) {
    var safeName = sanitizeAgentName(event.target.value);
    event.target.value = safeName;
    saveCodename(storageKey, safeName);
  });

  rollD100Button.addEventListener('click', function onManualRoll() {
    var target = parseBoundedInt(targetInput.value, 1, 100);

    if (target === null) {
      appendSystemMessage(logView, 'Invalid target number. Enter a value from 1 to 100.');
      return;
    }

    targetInput.value = String(target);

    var roll = rollD100();
    var outcome = getSkillOutcome(roll, target);
    var agent = sanitizeAgentName(codenameInput.value);

    appendLogLine(logView, agent + ' rolled ' + padD100(roll) + ' vs ' + target + ' [' + outcome.toUpperCase() + ']');
  });

  lethalityToggle.addEventListener('change', function onLethalityToggle(event) {
    updateLethalityState(event.target.checked, lethalityInput, rollLethalityButton);
  });

  rollLethalityButton.addEventListener('click', function onLethalityRoll() {
    var rating = parseBoundedInt(lethalityInput.value, 1, 100);

    if (rating === null) {
      appendSystemMessage(logView, 'Invalid lethality rating. Enter a value from 1 to 100.');
      return;
    }

    lethalityInput.value = String(rating);

    var roll = rollD100();
    var result = getLethalityOutcome(roll, rating);
    var agent = sanitizeAgentName(codenameInput.value);

    if (result.outcome === 'Lethal') {
      appendLogLine(logView, agent + ' rolled lethality ' + padD100(roll) + ' vs ' + rating + ' [LETHAL]');
      return;
    }

    appendLogLine(logView, agent + ' rolled lethality ' + padD100(roll) + ' vs ' + rating + ' [DAMAGE ' + result.damage + ']');
  });

  polyButtons.forEach(function attachPolyListener(button) {
    button.addEventListener('click', function onPolyRoll() {
      var sides = parseBoundedInt(button.getAttribute('data-die-sides'), 2, 1000);

      if (sides === null) {
        appendSystemMessage(logView, 'Invalid die selected.');
        return;
      }

      var roll = rollDie(sides);
      var agent = sanitizeAgentName(codenameInput.value);
      appendLogLine(logView, agent + ' rolled d' + sides + ' = ' + roll);
    });
  });
})();

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function rollD100() {
  return rollDie(100);
}

function isMatchingDigitRoll(value) {
  if (value === 100) {
    return true;
  }

  if (value < 11 || value > 99) {
    return false;
  }

  var tens = Math.floor(value / 10);
  var ones = value % 10;

  return tens === ones;
}

function getSkillOutcome(roll, target) {
  var isSuccess = roll <= target;
  var isMatch = isMatchingDigitRoll(roll);

  if (isSuccess && isMatch) {
    return 'Critical Success';
  }

  if (!isSuccess && isMatch) {
    return 'Fumble';
  }

  return isSuccess ? 'Success' : 'Failure';
}

function getLethalityOutcome(roll, rating) {
  if (roll <= rating) {
    return {
      outcome: 'Lethal',
      damage: null
    };
  }

  return {
    outcome: 'Damage',
    damage: getLethalityDamage(roll)
  };
}

function getLethalityDamage(roll) {
  if (roll === 100) {
    return 10;
  }

  var tens = Math.floor(roll / 10);
  var ones = roll % 10;

  return tens + ones;
}

function parseBoundedInt(value, min, max) {
  var parsed = parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

function appendLogLine(logView, text) {
  var shouldStickToBottom = isNearBottom(logView);
  var line = document.createElement('p');
  line.textContent = '> ' + text;
  logView.appendChild(line);

  if (shouldStickToBottom) {
    logView.scrollTop = logView.scrollHeight;
  }
}

function appendSystemMessage(logView, message) {
  appendLogLine(logView, 'System: ' + message);
}

function isNearBottom(element) {
  var threshold = 24;
  var distance = element.scrollHeight - element.scrollTop - element.clientHeight;
  return distance <= threshold;
}

function padD100(value) {
  if (value === 100) {
    return '100';
  }

  return String(value).padStart(2, '0');
}

function updateLethalityState(enabled, lethalityInput, rollButton) {
  lethalityInput.disabled = !enabled;
  rollButton.disabled = !enabled;
}

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
