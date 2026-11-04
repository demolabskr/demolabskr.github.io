#!/usr/bin/env node

// 모든 HTML의 로컬 CSS·JS 참조를 파일 내용 해시(?v=)로 갱신한다.
// 사용: node scripts/cache-bust.js

const { cacheBustAll } = require("./asset-hash");

const changed = cacheBustAll();
if (changed.length) {
    console.log(`캐시 해시 갱신: ${changed.length}개 파일`);
    changed.forEach((file) => console.log(`  - ${file}`));
} else {
    console.log("캐시 해시 변경 없음");
}
