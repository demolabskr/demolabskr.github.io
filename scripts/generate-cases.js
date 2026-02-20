#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const dataFile = path.join(
    rootDir,
    "sections",
    "case-studies",
    "case-studies.json",
);
const configFile = path.join(rootDir, "site.config.json");
const casesDir = path.join(rootDir, "cases");

const escapeHtml = (value) =>
    String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

const escapeXml = (value) =>
    String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");

const safeJsonForScript = (value) =>
    JSON.stringify(value).replaceAll("<", "\\u003c");

const normalizeSiteUrl = (url) => {
    if (!url) {
        return "";
    }
    return url.replace(/\/+$/, "");
};

const parseDate = (value) => {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed;
};

const formatDate = (value) => {
    const parsed = parseDate(value);
    if (!parsed) {
        return "날짜 미정";
    }
    return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(parsed);
};

const stripHtml = (value) => String(value ?? "").replace(/<[^>]*>/g, " ");

const toIsoDate = (value) => {
    const parsed = parseDate(value);
    return parsed ? parsed.toISOString() : new Date().toISOString();
};

const joinUrl = (base, pathname) => {
    if (!base) {
        return pathname;
    }
    return `${base}${pathname}`;
};

const ensureDir = async (dir) => {
    await fs.mkdir(dir, { recursive: true });
};

const writeFile = async (filePath, content) => {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, "utf8");
};

const getImagePathForDepth = (imagePath, depth) => {
    if (!imagePath) {
        return "";
    }
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
    }
    if (depth === 1) {
        return `../${imagePath}`;
    }
    if (depth === 2) {
        return `../../${imagePath}`;
    }
    return imagePath;
};

const baseHead = ({
    title,
    description,
    canonical,
    ogImage,
    ogType = "website",
    assetPrefix = "",
}) => `<!doctype html>
<html lang="ko" data-theme="light">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
        <link rel="icon" href="${escapeHtml(
            `${assetPrefix}images/favicon.png`,
        )}" type="image/png" />
        <meta name="description" content="${escapeHtml(description)}" />
        <meta name="robots" content="index,follow" />
        <meta property="og:type" content="${escapeHtml(ogType)}" />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:title" content="${escapeHtml(title)}" />
        <meta property="og:description" content="${escapeHtml(description)}" />
        <meta property="og:url" content="${escapeHtml(canonical)}" />
        <meta property="og:image" content="${escapeHtml(ogImage)}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${escapeHtml(title)}" />
        <meta name="twitter:description" content="${escapeHtml(description)}" />
        <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
        <link rel="canonical" href="${escapeHtml(canonical)}" />
        <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css"
        />
        <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
        />
`;

const renderCasesIndex = ({ siteName, siteUrl, cards }) => {
    const title = `사례 아카이브 | ${siteName}`;
    const description =
        "문제 정의, 접근, 성과를 구조화한 사례 아카이브입니다.";
    const canonical = joinUrl(siteUrl, "/cases/");
    const ogImage = joinUrl(siteUrl, "/images/aidemolabs-cover.png");
    const listItems = cards
        .map((card) => {
            const tags = (card.tags || [])
                .map(
                    (tag) =>
                        `<span class="tag is-outline">${escapeHtml(tag)}</span>`,
                )
                .join("");

            return `<article class="sharp-card p-5 case-list-item">
                    <p class="case-list-item__meta">${escapeHtml(formatDate(card.date))} · ${escapeHtml(card.category)}</p>
                    <h2 class="title is-5"><a href="./${escapeHtml(card.slug)}/">${escapeHtml(card.title)}</a></h2>
                    <p class="muted">${escapeHtml(card.description)}</p>
                    <div class="case-tag-list mt-4">${tags}</div>
                    <div class="mt-4">
                        <a class="button ghost-button is-small" href="./${escapeHtml(card.slug)}/">상세 보기</a>
                    </div>
                </article>`;
        })
        .join("\n");

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "사례 아카이브",
        description,
        url: canonical,
        mainEntity: {
            "@type": "ItemList",
            itemListElement: cards.map((card, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: joinUrl(siteUrl, `/cases/${card.slug}/`),
                name: card.title,
            })),
        },
    };

    return `${baseHead({
        title,
        description,
        canonical,
        ogImage,
        assetPrefix: "../",
    })}
        <link rel="stylesheet" href="../css/styles.css" />
        <script type="application/ld+json">${safeJsonForScript(jsonLd)}</script>
    </head>
    <body class="cases-page">
        <nav class="navbar case-nav" role="navigation" aria-label="main navigation">
            <div class="container">
                <div class="navbar-brand">
                    <a class="navbar-item brand" href="/">${escapeHtml(siteName)}</a>
                </div>
                <div class="navbar-menu is-active">
                    <div class="navbar-end">
                        <a class="navbar-item" href="/">홈</a>
                        <a class="navbar-item is-active" href="/cases/">사례</a>
                    </div>
                </div>
            </div>
        </nav>
        <main class="section">
            <div class="container">
                <p class="eyebrow">Cases</p>
                <h1 class="title is-2">사례 아카이브</h1>
                <p class="muted">정적 문서처럼 관리되는 사례 모음입니다. 최신 순으로 정렬됩니다.</p>
                <div class="case-list-grid mt-5">
${listItems}
                </div>
            </div>
        </main>
        <footer class="footer">
            <div class="content has-text-centered">
                <p class="brand">${escapeHtml(siteName)}</p>
                <p class="muted">Cases Archive</p>
            </div>
        </footer>
    </body>
</html>
`;
};

const renderCaseDetail = ({
    siteName,
    siteUrl,
    card,
    previousCard,
    nextCard,
}) => {
    const title = `${card.title} | 사례 | ${siteName}`;
    const description = card.description || `${card.title} 사례`;
    const canonical = joinUrl(siteUrl, `/cases/${card.slug}/`);
    const imagePath = card.image
        ? joinUrl(siteUrl, `/${card.image.replace(/^\/+/, "")}`)
        : joinUrl(siteUrl, "/images/aidemolabs-cover.png");

    const tags = (card.tags || [])
        .map((tag) => `<span class="tag is-outline">${escapeHtml(tag)}</span>`)
        .join("");

    const imageMarkup = card.image
        ? `<figure class="case-detail-image sharp-card p-4 mt-5">
                <img src="${escapeHtml(getImagePathForDepth(card.image, 2))}" alt="${escapeHtml(card.imageAlt || card.title)}" loading="lazy" />
            </figure>`
        : "";

    const previousMarkup = previousCard
        ? `<a class="button ghost-button is-small" href="../${escapeHtml(previousCard.slug)}/">이전 사례</a>`
        : "";
    const nextMarkup = nextCard
        ? `<a class="button ghost-button is-small" href="../${escapeHtml(nextCard.slug)}/">다음 사례</a>`
        : "";

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: card.title,
        description,
        datePublished: toIsoDate(card.date),
        dateModified: toIsoDate(card.date),
        mainEntityOfPage: canonical,
        author: {
            "@type": "Organization",
            name: siteName,
        },
        image: imagePath,
        keywords: (card.tags || []).join(", "),
        articleSection: card.category,
        about: [
            {
                "@type": "Thing",
                name: card.category,
            },
        ],
    };

    return `${baseHead({
        title,
        description,
        canonical,
        ogImage: imagePath,
        ogType: "article",
        assetPrefix: "../../",
    })}
        <link rel="stylesheet" href="../../css/styles.css" />
        <script type="application/ld+json">${safeJsonForScript(jsonLd)}</script>
    </head>
    <body class="case-page">
        <nav class="navbar case-nav" role="navigation" aria-label="main navigation">
            <div class="container">
                <div class="navbar-brand">
                    <a class="navbar-item brand" href="/">${escapeHtml(siteName)}</a>
                </div>
                <div class="navbar-menu is-active">
                    <div class="navbar-end">
                        <a class="navbar-item" href="/">홈</a>
                        <a class="navbar-item" href="/cases/">사례</a>
                    </div>
                </div>
            </div>
        </nav>
        <main class="section">
            <div class="container">
                <p class="case-breadcrumb"><a href="/cases/">사례 아카이브</a> / ${escapeHtml(card.title)}</p>
                <header class="case-page-header">
                    <p class="eyebrow">Case</p>
                    <h1 class="title is-2">${escapeHtml(card.title)}</h1>
                    <p class="muted">${escapeHtml(formatDate(card.date))} · ${escapeHtml(card.category)}</p>
                    <p class="muted mt-3">${escapeHtml(card.description)}</p>
                    <div class="case-tag-list mt-4">${tags}</div>
                </header>
                ${imageMarkup}
                <section class="case-detail-grid mt-5">
                    <article class="sharp-card p-5">
                        <h2 class="title is-5">문제</h2>
                        <p class="muted">${escapeHtml(card.challenge || "정리된 내용이 없습니다.")}</p>
                    </article>
                    <article class="sharp-card p-5">
                        <h2 class="title is-5">접근</h2>
                        <p class="muted">${escapeHtml(card.approach || "정리된 내용이 없습니다.")}</p>
                    </article>
                    <article class="sharp-card p-5">
                        <h2 class="title is-5">성과</h2>
                        <p class="muted">${escapeHtml(card.outcome || card.result || "정리된 내용이 없습니다.")}</p>
                    </article>
                </section>
                <div class="case-detail-nav mt-5">
                    <a class="button cta-button is-small" href="/cases/">목록으로</a>
                    <div class="case-detail-nav__side">
                        ${previousMarkup}
                        ${nextMarkup}
                    </div>
                </div>
            </div>
        </main>
        <footer class="footer">
            <div class="content has-text-centered">
                <p class="brand">${escapeHtml(siteName)}</p>
                <p class="muted">Case Detail</p>
            </div>
        </footer>
    </body>
</html>
`;
};

const renderHomeCasesPreview = (cards) => {
    const previewCards = cards.slice(0, 3);
    const cardMarkup = previewCards
        .map((card, index) => {
            const delay = (0.05 * (index + 1))
                .toFixed(2)
                .replace(/0+$/, "")
                .replace(/\.$/, "");
            return `<div class="column is-4">
                        <article class="sharp-card p-5 reveal" style="--delay: ${delay}s">
                            <p class="case-list-item__meta">${escapeHtml(formatDate(card.date))} · ${escapeHtml(card.category)}</p>
                            <h3 class="title is-5">${escapeHtml(card.title)}</h3>
                            <p class="muted">${escapeHtml(card.description)}</p>
                            <div class="mt-4">
                                <a class="button ghost-button is-small" href="/cases/${escapeHtml(card.slug)}/">상세 보기</a>
                            </div>
                        </article>
                    </div>`;
        })
        .join("\n");

    return `<section id="cases" class="section">
    <div class="container">
        <p class="eyebrow">Cases</p>
        <h2 class="title is-3">사례 확장 아카이브</h2>
        <p class="muted">
            사례를 개별 URL 문서로 확장해 검색 유입과 내부 링크 구조를 강화했습니다.
            아래 최신 사례에서 시작하거나 전체 아카이브로 이동할 수 있습니다.
        </p>
        <div class="columns mt-5 is-multiline">
${cardMarkup}
        </div>
        <div class="mt-5">
            <a class="button cta-button" href="/cases/">사례 아카이브 전체 보기</a>
        </div>
    </div>
</section>
`;
};

const renderSitemap = ({ siteUrl, cards }) => {
    const now = new Date().toISOString();
    const urls = [
        { loc: `${siteUrl}/`, lastmod: now },
        { loc: `${siteUrl}/cases/`, lastmod: now },
        ...cards.map((card) => ({
            loc: `${siteUrl}/cases/${card.slug}/`,
            lastmod: toIsoDate(card.date),
        })),
    ];

    const body = urls
        .map(
            (item) => `  <url>
    <loc>${escapeXml(item.loc)}</loc>
    <lastmod>${escapeXml(item.lastmod)}</lastmod>
  </url>`,
        )
        .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
};

const renderRss = ({ siteName, siteUrl, cards }) => {
    const now = new Date().toUTCString();
    const items = cards
        .slice(0, 50)
        .map((card) => {
            const link = `${siteUrl}/cases/${card.slug}/`;
            return `<item>
      <title>${escapeXml(card.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid>${escapeXml(link)}</guid>
      <pubDate>${new Date(toIsoDate(card.date)).toUTCString()}</pubDate>
      <description>${escapeXml(stripHtml(card.description))}</description>
    </item>`;
        })
        .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteName)} Cases</title>
    <link>${escapeXml(`${siteUrl}/cases/`)}</link>
    <description>DemoLabs 사례 아카이브 피드</description>
    <lastBuildDate>${escapeXml(now)}</lastBuildDate>
${items}
  </channel>
</rss>
`;
};

const normalizeCards = (rawCards) => {
    const seen = new Set();
    const normalized = rawCards.map((card, index) => {
        const fallbackSlug = `case-${index + 1}`;
        const slug = String(card.slug || fallbackSlug).trim();
        if (!slug) {
            throw new Error(`invalid slug at index ${index}`);
        }
        if (seen.has(slug)) {
            throw new Error(`duplicate slug: ${slug}`);
        }
        seen.add(slug);

        const tags = Array.isArray(card.tags)
            ? card.tags
                  .map((tag) => String(tag || "").trim())
                  .filter(Boolean)
            : [];

        return {
            ...card,
            slug,
            title: String(card.title || "").trim(),
            date: String(card.date || "").trim(),
            category: String(card.category || "기타").trim(),
            description: String(card.description || "").trim(),
            challenge: String(card.challenge || "").trim(),
            approach: String(card.approach || "").trim(),
            outcome: String(card.outcome || card.result || "").trim(),
            tags,
        };
    });

    normalized.sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        if (dateA && dateB) {
            return dateB.getTime() - dateA.getTime();
        }
        if (dateA) {
            return -1;
        }
        if (dateB) {
            return 1;
        }
        return 0;
    });

    return normalized;
};

const readConfig = async () => {
    try {
        const text = await fs.readFile(configFile, "utf8");
        const parsed = JSON.parse(text);
        return {
            siteName: String(parsed.siteName || "DemoLabs"),
            siteUrl: normalizeSiteUrl(String(parsed.siteUrl || "")),
        };
    } catch (error) {
        return {
            siteName: "DemoLabs",
            siteUrl: "https://demolabskr.github.io",
        };
    }
};

const main = async () => {
    const config = await readConfig();
    const dataText = await fs.readFile(dataFile, "utf8");
    const json = JSON.parse(dataText);
    const cards = normalizeCards(Array.isArray(json.cards) ? json.cards : []);

    await ensureDir(casesDir);

    const indexHtml = renderCasesIndex({
        siteName: config.siteName,
        siteUrl: config.siteUrl,
        cards,
    });
    await writeFile(path.join(casesDir, "index.html"), indexHtml);

    for (let i = 0; i < cards.length; i += 1) {
        const card = cards[i];
        const previousCard = i > 0 ? cards[i - 1] : null;
        const nextCard = i < cards.length - 1 ? cards[i + 1] : null;
        const detailHtml = renderCaseDetail({
            siteName: config.siteName,
            siteUrl: config.siteUrl,
            card,
            previousCard,
            nextCard,
        });
        await writeFile(
            path.join(casesDir, card.slug, "index.html"),
            detailHtml,
        );
    }

    const previewHtml = renderHomeCasesPreview(cards);
    await writeFile(path.join(rootDir, "sections", "cases.html"), previewHtml);

    const sitemapXml = renderSitemap({
        siteUrl: config.siteUrl,
        cards,
    });
    await writeFile(path.join(rootDir, "sitemap.xml"), sitemapXml);

    const rssXml = renderRss({
        siteName: config.siteName,
        siteUrl: config.siteUrl,
        cards,
    });
    await writeFile(path.join(casesDir, "feed.xml"), rssXml);

    const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${config.siteUrl}/sitemap.xml
`;
    await writeFile(path.join(rootDir, "robots.txt"), robotsTxt);

    process.stdout.write(
        `generated ${cards.length} cases, sitemap.xml, robots.txt\n`,
    );
};

main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
});
