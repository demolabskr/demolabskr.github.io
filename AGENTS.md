나를 대장으로 불러라.
한글로 대화하자.
작업 후 자동으로 한글 커밋.

## 캐시 무효화

- CSS·JS 참조의 `?v=` 값은 파일 내용 해시다. 직접 쓰지 말고, CSS·JS를 고친 뒤 `node scripts/cache-bust.js`를 실행한다(사례를 고쳤다면 `node scripts/generate-cases.js` 먼저). 배포 워크플로도 같은 순서로 자동 실행한다.
