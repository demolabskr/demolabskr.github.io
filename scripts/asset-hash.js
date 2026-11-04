// 로컬 CSS·JS 참조에 파일 내용 해시를 붙여 캐시를 무효화한다.
// 파일 내용이 바뀌면 ?v= 값이 바뀌고, 그대로면 브라우저 캐시를 계속 쓴다.

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const HASH_LENGTH = 10;
const ASSET_REF_PATTERN =
    /\b(href|src)="(?!https?:|\/\/|data:)([^"?#]+\.(?:css|js))(?:\?v=[^"#]*)?"/g;

const hashCache = new Map();

const hashFile = (absolutePath) => {
    if (!hashCache.has(absolutePath)) {
        const content = fs.readFileSync(absolutePath);
        const hash = crypto
            .createHash("sha256")
            .update(content)
            .digest("hex")
            .slice(0, HASH_LENGTH);
        hashCache.set(absolutePath, hash);
    }
    return hashCache.get(absolutePath);
};

// 저장소 루트 기준 경로(예: "css/styles.css")의 해시
const assetVersion = (relativePath) =>
    hashFile(path.join(rootDir, relativePath));

const resolveAsset = (assetPath, htmlFilePath) => {
    if (assetPath.startsWith("/")) {
        return path.join(rootDir, assetPath);
    }
    return path.resolve(path.dirname(htmlFilePath), assetPath);
};

// HTML 문자열 안의 로컬 CSS·JS 참조에 해시를 붙인다.
const applyCacheBust = (html, htmlFilePath) =>
    html.replace(ASSET_REF_PATTERN, (match, attribute, assetPath) => {
        const absolutePath = resolveAsset(assetPath, htmlFilePath);
        if (!fs.existsSync(absolutePath)) {
            return match;
        }
        return `${attribute}="${assetPath}?v=${hashFile(absolutePath)}"`;
    });

const IGNORED_DIRS = new Set([".git", ".github", "_site", "node_modules"]);

const findHtmlFiles = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return IGNORED_DIRS.has(entry.name) ? [] : findHtmlFiles(fullPath);
        }
        return entry.name.endsWith(".html") ? [fullPath] : [];
    });

const cacheBustAll = () => {
    const changed = [];
    for (const filePath of findHtmlFiles(rootDir)) {
        const html = fs.readFileSync(filePath, "utf8");
        const next = applyCacheBust(html, filePath);
        if (next !== html) {
            fs.writeFileSync(filePath, next);
            changed.push(path.relative(rootDir, filePath));
        }
    }
    return changed;
};

module.exports = { assetVersion, applyCacheBust, cacheBustAll };
