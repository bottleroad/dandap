// 세션별 단답 모드(dandap/chodandap/off)를 파일로 읽고 쓰는 상태 저장 모듈.
const fs = require('fs');
const os = require('os');
const path = require('path');

const VALID_MODES = new Set(['dandap', 'chodandap', 'off']);

function stateDir() {
  if (process.env.DANDAP_STATE_DIR) return process.env.DANDAP_STATE_DIR;
  const base = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  return path.join(base, '.dandap-sessions');
}

// session_id는 파일명이 되므로 경로 문자를 막는다.
function validateSessionId(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id) ? id : null;
}

function modePath(sessionId) {
  const sid = validateSessionId(sessionId);
  return sid ? path.join(stateDir(), `${sid}.mode`) : null;
}

function readMode(sessionId) {
  const p = modePath(sessionId);
  if (!p) return null;
  try {
    const mode = fs.readFileSync(p, 'utf8').trim();
    return VALID_MODES.has(mode) ? mode : null;
  } catch (e) {
    return null;
  }
}

function writeMode(sessionId, mode) {
  const p = modePath(sessionId);
  if (!p || !VALID_MODES.has(mode)) return;
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, mode);
}

function isActive(mode) {
  return mode === 'dandap' || mode === 'chodandap';
}

module.exports = { stateDir, validateSessionId, readMode, writeMode, isActive };
