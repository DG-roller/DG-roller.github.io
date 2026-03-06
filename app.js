(function initGreenBox() {
  var codenameInput = document.getElementById('agent-codename');
  var targetInput = document.getElementById('target-number');
  var rollD100Button = document.getElementById('roll-d100-button');
  var lethalityToggle = document.getElementById('lethality-toggle');
  var lethalityInput = document.getElementById('lethality-rating');
  var rollLethalityButton = document.getElementById('roll-lethality-button');
  var polyButtons = document.querySelectorAll('[data-die-sides]');
  var logView = document.getElementById('roll-log');
  var characterFileInput = document.getElementById('character-file');
  var clearCharacterButton = document.getElementById('clear-character-button');
  var characterStatus = document.getElementById('character-status');
  var characterSummary = document.getElementById('character-summary');
  var importedSkillsView = document.getElementById('imported-skills');
  var storageKey = 'greenbox.agentCodename';

  if (!codenameInput || !targetInput || !rollD100Button || !lethalityToggle || !lethalityInput || !rollLethalityButton || !logView) {
    return;
  }

  codenameInput.value = loadCodename(storageKey);
  updateLethalityState(lethalityToggle.checked, lethalityInput, rollLethalityButton);

  var loadedCharacter = loadCharacterFromLocalStorage();
  renderCharacterState(loadedCharacter, characterStatus, characterSummary, importedSkillsView, codenameInput, logView);

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

  if (characterFileInput) {
    characterFileInput.addEventListener('change', function onCharacterFileChange(event) {
      var selectedFile = event.target.files && event.target.files[0];

      if (!selectedFile) {
        return;
      }

      importCharacterFile(selectedFile, function onImported(character) {
        loadedCharacter = character;
        saveCharacterToLocalStorage(character);
        renderCharacterState(character, characterStatus, characterSummary, importedSkillsView, codenameInput, logView);
        appendSystemMessage(logView, 'Character file imported: ' + character.name + '.');
      }, function onImportError(errorMessage) {
        if (characterStatus) {
          characterStatus.textContent = errorMessage;
        }

        appendSystemMessage(logView, errorMessage);
      });

      event.target.value = '';
    });
  }

  if (clearCharacterButton) {
    clearCharacterButton.addEventListener('click', function onClearCharacter() {
      loadedCharacter = null;
      clearStoredCharacter();
      renderCharacterState(null, characterStatus, characterSummary, importedSkillsView, codenameInput, logView);
      appendSystemMessage(logView, 'Imported character cleared.');
    });
  }
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

function importCharacterFile(file, onSuccess, onError) {
  if (!file || typeof FileReader === 'undefined') {
    onError('Character import is not available in this browser.');
    return;
  }

  var reader = new FileReader();

  reader.onload = function onReaderLoad(event) {
    var rawText = event.target && event.target.result;
    var parsedCharacter = parseCharacterFile(rawText);

    if (!parsedCharacter) {
      onError('Malformed character JSON. Please select a valid file.');
      return;
    }

    onSuccess(parsedCharacter);
  };

  reader.onerror = function onReaderError() {
    onError('Unable to read the selected file.');
  };

  reader.readAsText(file);
}

function parseCharacterFile(jsonText) {
  if (typeof jsonText !== 'string') {
    return null;
  }

  var raw;

  try {
    raw = JSON.parse(jsonText);
  } catch (error) {
    return null;
  }

  return normalizeCharacterData(raw);
}

function normalizeCharacterData(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  var name = readFirstString(raw, ['name', 'characterName', 'agentName']);
  var profession = readFirstString(raw, ['profession', 'occupation', 'job', 'archetype']);
  var derivedStats = readDerivedStats(raw);
  var skills = dedupeSkills(extractSkills(raw));

  if (!name && skills.length === 0) {
    return null;
  }

  return {
    id: readFirstString(raw, ['id', 'characterId']) || null,
    name: sanitizeCharacterText(name, 'Unnamed Character'),
    profession: sanitizeCharacterText(profession, ''),
    derived: derivedStats,
    skills: skills
  };
}

function readDerivedStats(raw) {
  var hp = readFirstNumber(raw, ['hp', 'HP', 'hitPoints']);
  var wp = readFirstNumber(raw, ['wp', 'WP', 'willpower']);
  var san = readFirstNumber(raw, ['san', 'SAN', 'sanity']);

  return {
    hp: hp,
    wp: wp,
    san: san
  };
}

function extractSkills(raw) {
  var skills = [];

  collectSkillsFromArray(raw.skills, skills);
  collectSkillsFromObject(raw.skills, skills);

  if (raw.statistics && raw.statistics.skills) {
    collectSkillsFromArray(raw.statistics.skills, skills);
    collectSkillsFromObject(raw.statistics.skills, skills);
  }

  if (raw.attributes && raw.attributes.skills) {
    collectSkillsFromArray(raw.attributes.skills, skills);
    collectSkillsFromObject(raw.attributes.skills, skills);
  }

  return skills;
}

function collectSkillsFromArray(rawSkills, result) {
  if (!Array.isArray(rawSkills)) {
    return;
  }

  rawSkills.forEach(function eachSkill(item) {
    if (!item || typeof item !== 'object') {
      return;
    }

    var baseLabel = readFirstString(item, ['label', 'name', 'skill', 'key']);
    var typeName = readFirstString(item, ['type', 'specialization', 'focus', 'subskill']);
    var value = readFirstNumber(item, ['value', 'score', 'target', 'rating']);

    if (value === null) {
      return;
    }

    var normalized = normalizeSkill(baseLabel, typeName, value);

    if (normalized) {
      result.push(normalized);
    }
  });
}

function collectSkillsFromObject(rawSkills, result) {
  if (!rawSkills || typeof rawSkills !== 'object' || Array.isArray(rawSkills)) {
    return;
  }

  Object.keys(rawSkills).forEach(function eachKey(key) {
    var value = rawSkills[key];

    if (typeof value === 'number' || typeof value === 'string') {
      var score = parseBoundedInt(value, 0, 100);
      var simpleSkill = normalizeSkill(key, null, score);
      if (simpleSkill) {
        result.push(simpleSkill);
      }
      return;
    }

    if (!value || typeof value !== 'object') {
      return;
    }

    var scoreFromObject = readFirstNumber(value, ['value', 'score', 'target', 'rating']);

    if (scoreFromObject !== null) {
      var typeName = readFirstString(value, ['type', 'specialization', 'focus', 'subskill']);
      var objectSkill = normalizeSkill(key, typeName, scoreFromObject);
      if (objectSkill) {
        result.push(objectSkill);
      }
    }

    Object.keys(value).forEach(function eachNested(nestedKey) {
      var nestedValue = value[nestedKey];
      var nestedScore = parseBoundedInt(nestedValue, 0, 100);

      if (nestedScore === null) {
        return;
      }

      var nestedSkill = normalizeSkill(key, nestedKey, nestedScore);
      if (nestedSkill) {
        result.push(nestedSkill);
      }
    });
  });
}

function normalizeSkill(label, typeName, value) {
  var boundedValue = parseBoundedInt(value, 0, 100);

  if (boundedValue === null || !label) {
    return null;
  }

  var cleanLabel = sanitizeCharacterText(label, '');
  if (!cleanLabel) {
    return null;
  }

  var cleanType = sanitizeCharacterText(typeName, '');

  return {
    key: normalizeSkillKey(cleanLabel),
    label: normalizeSkillLabel(cleanLabel, cleanType),
    baseLabel: cleanLabel,
    typed: Boolean(cleanType),
    value: boundedValue
  };
}

function normalizeSkillLabel(key, typeName) {
  if (!typeName) {
    return key;
  }

  return key + ' (' + typeName + ')';
}

function normalizeSkillKey(label) {
  return label.toLowerCase().replace(/\s+/g, ' ').trim();
}

function dedupeSkills(skills) {
  var groups = {};

  skills.forEach(function eachSkill(skill) {
    if (!groups[skill.key]) {
      groups[skill.key] = [];
    }

    groups[skill.key].push(skill);
  });

  var deduped = [];

  Object.keys(groups).forEach(function eachGroup(key) {
    var group = groups[key];
    var typedSkills = group.filter(function onlyTyped(item) {
      return item.typed;
    });
    var genericZero = group.some(function hasGenericZero(item) {
      return !item.typed && item.value === 0;
    });

    if (typedSkills.length > 0 && genericZero) {
      group = group.filter(function removeGenericZero(item) {
        return item.typed || item.value > 0;
      });
    }

    var seenLabels = {};
    group.forEach(function keepHighest(skill) {
      var labelKey = skill.label.toLowerCase();
      var existing = seenLabels[labelKey];

      if (!existing || skill.value > existing.value) {
        seenLabels[labelKey] = skill;
      }
    });

    Object.keys(seenLabels).forEach(function pushSkill(labelKey) {
      deduped.push(seenLabels[labelKey]);
    });
  });

  deduped.sort(function sortSkills(a, b) {
    return a.label.localeCompare(b.label);
  });

  return deduped;
}

function readFirstString(source, keys) {
  if (!source || typeof source !== 'object') {
    return '';
  }

  for (var i = 0; i < keys.length; i += 1) {
    var value = source[keys[i]];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return '';
}

function readFirstNumber(source, keys) {
  if (!source || typeof source !== 'object') {
    return null;
  }

  for (var i = 0; i < keys.length; i += 1) {
    var parsed = parseBoundedInt(source[keys[i]], 0, 100);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function sanitizeCharacterText(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }

  var trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return fallback;
  }

  return trimmed.slice(0, 60);
}

function saveCharacterToLocalStorage(character) {
  localStorage.setItem('greenbox.character', JSON.stringify(character));
}

function loadCharacterFromLocalStorage() {
  var raw = localStorage.getItem('greenbox.character');

  if (!raw) {
    return null;
  }

  return parseCharacterFile(raw);
}

function clearStoredCharacter() {
  localStorage.removeItem('greenbox.character');
}

function renderCharacterState(character, statusNode, summaryNode, skillsNode, codenameInput, logView) {
  if (!statusNode || !summaryNode || !skillsNode) {
    return;
  }

  statusNode.textContent = character ? 'Loaded: ' + character.name : 'No character loaded.';
  renderCharacterSummary(character, summaryNode);
  renderSkillButtons(character, skillsNode, codenameInput, logView);
}

function renderCharacterSummary(character, node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }

  if (!character) {
    return;
  }

  var nameLine = document.createElement('p');
  nameLine.textContent = 'Name: ' + character.name;
  node.appendChild(nameLine);

  if (character.profession) {
    var professionLine = document.createElement('p');
    professionLine.textContent = 'Profession: ' + character.profession;
    node.appendChild(professionLine);
  }

  var statParts = [];
  if (character.derived.hp !== null) {
    statParts.push('HP ' + character.derived.hp);
  }
  if (character.derived.wp !== null) {
    statParts.push('WP ' + character.derived.wp);
  }
  if (character.derived.san !== null) {
    statParts.push('SAN ' + character.derived.san);
  }

  if (statParts.length > 0) {
    var statLine = document.createElement('p');
    statLine.textContent = 'Derived: ' + statParts.join(' | ');
    node.appendChild(statLine);
  }
}

function renderSkillButtons(character, skillsNode, codenameInput, logView) {
  while (skillsNode.firstChild) {
    skillsNode.removeChild(skillsNode.firstChild);
  }

  if (!character || character.skills.length === 0) {
    var emptyLine = document.createElement('p');
    emptyLine.className = 'section-note';
    emptyLine.textContent = 'No imported skills available.';
    skillsNode.appendChild(emptyLine);
    return;
  }

  character.skills.forEach(function eachSkill(skill) {
    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = skill.label + ' (' + skill.value + ')';
    button.addEventListener('click', function onSkillRoll() {
      var roll = rollD100();
      var outcome = getSkillOutcome(roll, skill.value);
      var actor = character.name || sanitizeAgentName(codenameInput.value);
      appendLogLine(logView, actor + ' rolled ' + skill.label + ' ' + padD100(roll) + ' vs ' + skill.value + ' [' + outcome.toUpperCase() + ']');
    });
    skillsNode.appendChild(button);
  });
}
