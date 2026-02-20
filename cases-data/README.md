# Cases Markdown Source

`cases-data/*.md`가 사례 원본입니다.

## 작성 규칙
- 파일 하나가 사례 하나입니다.
- 파일명은 보통 `slug.md` 형태로 맞춥니다.
- 상단 frontmatter 필드:
  - `slug`, `title`, `date`, `category`, `description`
  - `challenge`, `approach`, `outcome`
  - `tags`(배열)
  - 선택: `image`, `imageAlt`
- 본문은 Markdown으로 자유롭게 작성합니다.

## 생성
```bash
node scripts/generate-cases.js
```

생성 시 아래 파일이 자동 갱신됩니다.
- `cases/index.html`
- `cases/{slug}/index.html`
- `sections/cases.html`
- `sitemap.xml`
- `robots.txt`
- `cases/feed.xml`
- `sections/case-studies/case-studies.json` (호환용)
