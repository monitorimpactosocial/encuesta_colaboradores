
function login(username, password) {
  username = normalizeText_(username).toLowerCase();
  password = normalizeText_(password);
  if (!username || !password) throw new Error('Credenciales incompletas.');

  hashSeedUsers_();
  var users = getRowsAsObjects_(APP_CFG.SHEETS.USERS);
  var user = users.filter(function(r) {
    return normalizeText_(r.username).toLowerCase() === username && String(r.active).toUpperCase() === 'TRUE';
  })[0];
  if (!user) throw new Error('Usuario no encontrado.');

  var expected = normalizeText_(user.password_hash);
  var provided = sha256Hex_(username + '|' + password);
  if (expected !== provided) throw new Error('Credenciales inválidas.');

  var token = uuid_();
  var payload = {
    username: username,
    display_name: user.display_name || username,
    role: user.role || 'viewer',
    expiresAt: Date.now() + APP_CFG.SESSION_HOURS * 3600 * 1000
  };
  PropertiesService.getScriptProperties().setProperty('session_' + token, jsonStringify_(payload));
  auditLog_(username, payload.role, 'login', 'session', token, {});
  return {
    token: token,
    user: {
      username: payload.username,
      displayName: payload.display_name,
      role: payload.role
    }
  };
}

function validateSession_(token) {
  token = normalizeText_(token);
  if (!token) return null;
  var raw = PropertiesService.getScriptProperties().getProperty('session_' + token);
  if (!raw) return null;
  var session = jsonParse_(raw, null);
  if (!session || !session.expiresAt || session.expiresAt < Date.now()) {
    PropertiesService.getScriptProperties().deleteProperty('session_' + token);
    return null;
  }
  return {
    username: session.username,
    displayName: session.display_name || session.username,
    role: session.role
  };
}

function logout(token) {
  var user = validateSession_(token);
  if (user) auditLog_(user.username, user.role, 'logout', 'session', token, {});
  PropertiesService.getScriptProperties().deleteProperty('session_' + token);
  return { ok: true };
}
