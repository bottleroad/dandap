// 관리자 권한·개발자 모드가 없는 Windows처럼 파일 symlink 생성에 EPERM을 던지게 만드는 테스트용 preload 모듈.
const fs = require('node:fs');

const original = fs.symlinkSync;
fs.symlinkSync = (target, p, type) => {
  if (type === 'file') {
    const e = new Error(`EPERM: operation not permitted, symlink '${target}' -> '${p}'`);
    e.code = 'EPERM';
    throw e;
  }
  return original(target, p, type);
};
