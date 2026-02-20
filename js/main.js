const root = document.documentElement;

const loadSections = async () => {
    const includes = Array.from(document.querySelectorAll("[data-include]"));

    await Promise.all(
        includes.map(async (element) => {
            const url = element.getAttribute("data-include");
            if (!url) {
                return;
            }
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error("Failed to load section");
                }
                const html = await response.text();
                element.innerHTML = html;
            } catch (error) {
                element.innerHTML = `
                    <section class="section">
                        <div class="container">
                            <p class="muted">
                                섹션을 불러오지 못했습니다.
                            </p>
                        </div>
                    </section>
                `;
            }
        }),
    );
};

const initThemeToggle = () => {
    const toggle = document.getElementById("themeToggle");
    if (!toggle) {
        return;
    }

    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
    ).matches;

    const setTheme = (theme) => {
        root.setAttribute("data-theme", theme);
        root.style.colorScheme = theme;
        toggle.setAttribute(
            "aria-label",
            theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환",
        );
        toggle.setAttribute("aria-pressed", theme === "dark");
        localStorage.setItem("theme", theme);
    };

    setTheme(storedTheme || (prefersDark ? "dark" : "light"));

    toggle.addEventListener("click", () => {
        const next =
            root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        setTheme(next);
    });
};

const initNavMenu = () => {
    const burger = document.querySelector(".navbar-burger");
    const menu = document.getElementById("navMenu");

    if (!burger || !menu) {
        return;
    }

    burger.addEventListener("click", () => {
        burger.classList.toggle("is-active");
        menu.classList.toggle("is-active");
    });
};

const initScrollUI = () => {
    const scrollTopBtn = document.getElementById("scrollTopBtn");
    const scrollProgress = document.getElementById("scrollProgress");
    if (!scrollTopBtn || !scrollProgress) {
        return;
    }

    let scrollTicking = false;

    const updateScrollUI = () => {
        const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight =
            document.documentElement.scrollHeight -
            document.documentElement.clientHeight;
        const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

        scrollProgress.style.width = `${progress * 100}%`;

        if (scrollTop > 240) {
            scrollTopBtn.classList.add("is-visible");
        } else {
            scrollTopBtn.classList.remove("is-visible");
        }

        scrollTicking = false;
    };

    const onScroll = () => {
        if (!scrollTicking) {
            window.requestAnimationFrame(updateScrollUI);
            scrollTicking = true;
        }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateScrollUI();

    scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
};

const setModalState = (modal, isOpen) => {
    if (!modal) {
        return;
    }
    modal.classList.toggle("is-active", isOpen);
    modal.setAttribute("aria-hidden", isOpen ? "false" : "true");
    const hasOpenModal = document.querySelector(".modal.is-active");
    document.body.classList.toggle("modal-open", Boolean(hasOpenModal));
};

const initModals = () => {
    const modalTriggers = document.querySelectorAll("[data-modal-target]");
    const modalCloseButtons = document.querySelectorAll("[data-modal-close]");

    if (!modalTriggers.length && !modalCloseButtons.length) {
        return;
    }

    modalTriggers.forEach((trigger) => {
        const targetId = trigger.getAttribute("data-modal-target");
        const modal = document.getElementById(targetId);

        trigger.addEventListener("click", () => {
            setModalState(modal, true);
        });
    });

    modalCloseButtons.forEach((button) => {
        const modal = button.closest(".modal");

        button.addEventListener("click", () => {
            setModalState(modal, false);
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
            return;
        }
        document.querySelectorAll(".modal.is-active").forEach((modal) => {
            setModalState(modal, false);
        });
    });
};

const initCopyButtons = () => {
    const copyButtons = document.querySelectorAll("[data-copy-target]");
    if (!copyButtons.length) {
        return;
    }

    copyButtons.forEach((button) => {
        const defaultLabel = button.textContent.trim();
        button.dataset.defaultLabel = defaultLabel;

        button.addEventListener("click", async () => {
            const targetId = button.getAttribute("data-copy-target");
            const target = document.getElementById(targetId);
            if (!target) {
                return;
            }
            const text = target.textContent.trim();
            let copied = false;

            if (navigator.clipboard && window.isSecureContext) {
                try {
                    await navigator.clipboard.writeText(text);
                    copied = true;
                } catch (error) {
                    copied = false;
                }
            }

            if (!copied) {
                const textarea = document.createElement("textarea");
                textarea.value = text;
                textarea.setAttribute("readonly", "");
                textarea.style.position = "absolute";
                textarea.style.left = "-9999px";
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    copied = document.execCommand("copy");
                } catch (error) {
                    copied = false;
                }
                document.body.removeChild(textarea);
            }

            if (copied) {
                button.classList.add("is-copied");
                button.textContent = "복사 완료";
                window.setTimeout(() => {
                    button.classList.remove("is-copied");
                    button.textContent =
                        button.dataset.defaultLabel || defaultLabel;
                }, 2000);
            }
        });
    });
};

const fetchJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Failed to load JSON");
    }
    return response.json();
};

const caseCarouselState = {
    total: 0,
    index: 0,
};
let caseCarouselDragLock = false;
const moduleCarouselState = {
    total: 0,
    index: 0,
};
let moduleCarouselTimer;
let moduleCarouselDragLock = false;
let moduleCarouselStepSize = 0;
let moduleCarouselMoveNext = null;

const renderCaseIndicators = (total) => {
    const container = document.querySelector("[data-case-indicators]");
    if (!container) {
        return;
    }
    container.innerHTML = "";

    for (let i = 0; i < total; i += 1) {
        const dot = document.createElement("button");
        dot.className = "case-indicator";
        dot.type = "button";
        dot.setAttribute("aria-label", `케이스 스터디 ${i + 1}번`);
        dot.dataset.index = String(i);
        if (i === 0) {
            dot.classList.add("is-active");
        }
        container.appendChild(dot);
    }
};

const setActiveCaseIndicator = (index) => {
    const container = document.querySelector("[data-case-indicators]");
    if (!container) {
        return;
    }
    const dots = Array.from(container.children);
    dots.forEach((dot, idx) => {
        dot.classList.toggle("is-active", idx === index);
    });
};

const buildCaseCard = (card) => {
    const cardEl = document.createElement("article");
    cardEl.className = "sharp-card p-5 reveal case-entry";
    const delay = typeof card.delay === "number" ? card.delay : 0;
    cardEl.style.setProperty("--delay", `${delay}s`);

    const meta = document.createElement("p");
    meta.className = "case-entry__meta";
    const dateText = formatCaseDate(card.date);
    const categoryText = card.category || "기타";
    meta.textContent = `${dateText} · ${categoryText}`;

    const title = document.createElement("h3");
    title.className = "title is-5";
    title.textContent = card.title || "";

    const description = document.createElement("p");
    description.className = "muted case-entry__text";
    description.textContent = card.description || "";

    const outcome = document.createElement("p");
    outcome.className = "muted case-entry__outcome";
    outcome.textContent = card.outcome || card.result || "";

    const footer = document.createElement("div");
    footer.className = "case-entry__footer";

    const tags = document.createElement("div");
    tags.className = "case-tag-list";
    (Array.isArray(card.tags) ? card.tags : []).forEach((tag) => {
        const tagEl = document.createElement("span");
        tagEl.className = "tag is-outline";
        tagEl.textContent = tag;
        tags.appendChild(tagEl);
    });

    const actions = document.createElement("div");
    actions.className = "case-entry__actions";

    const detailButton = document.createElement("button");
    detailButton.className = "button ghost-button is-small";
    detailButton.type = "button";
    detailButton.textContent = "요약 보기";
    detailButton.setAttribute("data-case-open", card.slug || "");
    actions.appendChild(detailButton);

    if (card.image) {
        const imageButton = document.createElement("button");
        imageButton.className = "button ghost-button is-small";
        imageButton.type = "button";
        imageButton.textContent = "이미지";
        imageButton.setAttribute("data-case-image", card.image);
        imageButton.setAttribute(
            "data-case-alt",
            card.imageAlt || "케이스 스터디 이미지",
        );
        imageButton.setAttribute("aria-label", "케이스 스터디 이미지 보기");
        actions.appendChild(imageButton);
    }

    footer.appendChild(tags);
    footer.appendChild(actions);

    cardEl.appendChild(meta);
    cardEl.appendChild(title);
    cardEl.appendChild(description);
    cardEl.appendChild(outcome);
    cardEl.appendChild(footer);

    return cardEl;
};

const caseArchiveState = {
    cards: [],
    activeFilter: "all",
};

const parseCaseDate = (value) => {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed;
};

const formatCaseDate = (value) => {
    const date = parseCaseDate(value);
    if (!date) {
        return "날짜 미정";
    }
    return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
};

const normalizeCaseCards = (cards) => {
    const normalized = cards.map((card, index) => ({
        ...card,
        slug:
            typeof card.slug === "string" && card.slug.trim()
                ? card.slug.trim()
                : `case-${index + 1}`,
        category:
            typeof card.category === "string" && card.category.trim()
                ? card.category.trim()
                : "기타",
        tags: Array.isArray(card.tags)
            ? card.tags
                  .map((tag) =>
                      typeof tag === "string" ? tag.trim() : "",
                  )
                  .filter(Boolean)
            : [],
    }));

    normalized.sort((a, b) => {
        const dateA = parseCaseDate(a.date);
        const dateB = parseCaseDate(b.date);
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

const renderCaseFeature = (card) => {
    const container = document.querySelector("[data-case-feature]");
    if (!container) {
        return;
    }
    container.innerHTML = "";

    if (!card) {
        container.hidden = true;
        return;
    }
    container.hidden = false;

    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "Featured Case";

    const title = document.createElement("h3");
    title.className = "title is-5";
    title.textContent = card.title || "";

    const meta = document.createElement("p");
    meta.className = "muted";
    meta.textContent = `${formatCaseDate(card.date)} · ${card.category || "기타"}`;

    const summary = document.createElement("p");
    summary.className = "muted";
    summary.textContent = card.description || "";

    const actions = document.createElement("div");
    actions.className = "case-entry__actions mt-4";

    const detailButton = document.createElement("button");
    detailButton.className = "button cta-button is-small";
    detailButton.type = "button";
    detailButton.textContent = "핵심 보기";
    detailButton.setAttribute("data-case-open", card.slug || "");
    actions.appendChild(detailButton);

    container.appendChild(eyebrow);
    container.appendChild(title);
    container.appendChild(meta);
    container.appendChild(summary);
    container.appendChild(actions);
};

const renderCaseFilters = () => {
    const container = document.querySelector("[data-case-filters]");
    if (!container) {
        return;
    }
    container.innerHTML = "";

    const counts = new Map();
    caseArchiveState.cards.forEach((card) => {
        const category = card.category || "기타";
        counts.set(category, (counts.get(category) || 0) + 1);
    });

    const filters = [
        {
            key: "all",
            label: "전체",
            count: caseArchiveState.cards.length,
        },
        ...Array.from(counts.entries()).map(([category, count]) => ({
            key: category,
            label: category,
            count,
        })),
    ];

    filters.forEach((filter) => {
        const button = document.createElement("button");
        button.className = "case-filter-btn";
        if (caseArchiveState.activeFilter === filter.key) {
            button.classList.add("is-active");
        }
        button.type = "button";
        button.setAttribute("data-case-filter", filter.key);

        const label = document.createElement("span");
        label.textContent = filter.label;

        const count = document.createElement("span");
        count.className = "case-filter-btn__count";
        count.textContent = String(filter.count);

        button.appendChild(label);
        button.appendChild(count);
        container.appendChild(button);
    });
};

const renderCaseEntries = () => {
    const container = document.querySelector("[data-case-list]");
    if (!container) {
        return;
    }
    container.innerHTML = "";

    const visibleCards =
        caseArchiveState.activeFilter === "all"
            ? caseArchiveState.cards
            : caseArchiveState.cards.filter(
                  (card) => card.category === caseArchiveState.activeFilter,
              );

    if (!visibleCards.length) {
        const empty = document.createElement("p");
        empty.className = "muted case-empty";
        empty.textContent = "선택한 조건의 사례가 없습니다.";
        container.appendChild(empty);
        renderCaseFeature(caseArchiveState.cards[0] || null);
        return;
    }

    visibleCards.forEach((card) => {
        container.appendChild(buildCaseCard(card));
    });
    renderCaseFeature(visibleCards[0]);
};

const renderCaseDetail = (card) => {
    const modal = document.getElementById("modal-case-detail");
    if (!modal || !card) {
        return;
    }

    const title = modal.querySelector("[data-case-detail-title]");
    const meta = modal.querySelector("[data-case-detail-meta]");
    const summary = modal.querySelector("[data-case-detail-summary]");
    const challenge = modal.querySelector("[data-case-detail-challenge]");
    const approach = modal.querySelector("[data-case-detail-approach]");
    const outcome = modal.querySelector("[data-case-detail-outcome]");
    const tags = modal.querySelector("[data-case-detail-tags]");
    const imageButton = modal.querySelector("[data-case-detail-image]");

    if (title) {
        title.textContent = card.title || "";
    }
    if (meta) {
        meta.textContent = `${formatCaseDate(card.date)} · ${card.category || "기타"}`;
    }
    if (summary) {
        summary.textContent = card.description || "";
    }
    if (challenge) {
        challenge.textContent = card.challenge || "정리된 내용이 없습니다.";
    }
    if (approach) {
        approach.textContent = card.approach || "정리된 내용이 없습니다.";
    }
    if (outcome) {
        outcome.textContent =
            card.outcome || card.result || "정리된 내용이 없습니다.";
    }

    if (tags) {
        tags.innerHTML = "";
        (Array.isArray(card.tags) ? card.tags : []).forEach((tag) => {
            const tagEl = document.createElement("span");
            tagEl.className = "tag is-outline";
            tagEl.textContent = tag;
            tags.appendChild(tagEl);
        });
    }

    if (imageButton instanceof HTMLElement) {
        if (card.image) {
            imageButton.hidden = false;
            imageButton.setAttribute("data-case-image", card.image);
            imageButton.setAttribute(
                "data-case-alt",
                card.imageAlt || "케이스 스터디 이미지",
            );
        } else {
            imageButton.hidden = true;
            imageButton.removeAttribute("data-case-image");
            imageButton.removeAttribute("data-case-alt");
        }
    }

    setModalState(modal, true);
};

const buildModuleCard = (card) => {
    const wrapper = document.createElement("div");
    wrapper.className = "module-card";

    const cardEl = document.createElement("div");
    cardEl.className = "sharp-card p-4 reveal";
    const delay = typeof card.delay === "number" ? card.delay : 0;
    cardEl.style.setProperty("--delay", `${delay}s`);

    const title = document.createElement("h3");
    title.className = "title is-6";
    title.textContent = card.title || "";

    const row = document.createElement("div");
    row.className = "module-card__row";

    const description = document.createElement("p");
    description.className = "muted module-card__text";
    description.textContent = card.description || "";
    row.appendChild(description);

    if (card.image) {
        const thumbButton = document.createElement("button");
        thumbButton.className = "module-card__thumb-btn";
        thumbButton.type = "button";
        thumbButton.setAttribute("data-case-image", card.image);
        thumbButton.setAttribute(
            "data-case-alt",
            card.imageAlt || "모듈 이미지",
        );
        thumbButton.setAttribute("aria-label", "모듈 이미지 보기");

        const thumb = document.createElement("img");
        thumb.src = card.image;
        thumb.alt = card.imageAlt || "모듈 썸네일";
        thumbButton.appendChild(thumb);
        row.appendChild(thumbButton);
    }

    cardEl.appendChild(title);
    cardEl.appendChild(row);

    wrapper.appendChild(cardEl);
    return wrapper;
};

const renderCaseStudies = async () => {
    const container = document.querySelector("[data-case-list]");
    if (!container) {
        return;
    }

    try {
        const data = await fetchJson(
            "sections/case-studies/case-studies.json",
        );
        const cards = normalizeCaseCards(
            Array.isArray(data.cards) ? data.cards : [],
        );

        caseArchiveState.cards = cards;
        caseArchiveState.activeFilter = "all";
        renderCaseFilters();
        renderCaseEntries();
    } catch (error) {
        container.innerHTML = "";
        const message = document.createElement("p");
        message.className = "muted";
        message.textContent = "사례 데이터를 불러오지 못했습니다.";
        container.appendChild(message);
    }
};

let caseCarouselTimer;
let caseCarouselStepSize = 0;
let caseCarouselMoveNext = null;

const initCaseCarousel = () => {
    const track = document.querySelector('[data-cards="case-studies"]');
    if (!track || track.children.length < 2) {
        return;
    }

    const getStepSize = () => {
        const firstCard = track.querySelector(".case-card");
        if (!firstCard) {
            return 0;
        }
        const gapValue = parseFloat(
            window.getComputedStyle(track).gap || "0",
        );
        const gap = Number.isNaN(gapValue) ? 0 : gapValue;
        return firstCard.getBoundingClientRect().width + gap;
    };

    let stepSize = getStepSize();
    caseCarouselStepSize = stepSize;
    const updateStep = () => {
        stepSize = getStepSize();
        caseCarouselStepSize = stepSize;
    };

    window.addEventListener("resize", updateStep);

    if (caseCarouselTimer) {
        window.clearInterval(caseCarouselTimer);
    }

    const updateIndicator = (delta) => {
        if (!caseCarouselState.total) {
            return;
        }
        caseCarouselState.index =
            (caseCarouselState.index + delta + caseCarouselState.total) %
            caseCarouselState.total;
        setActiveCaseIndicator(caseCarouselState.index);
    };

    const moveNext = () => {
        if (!stepSize || track.classList.contains("is-animating")) {
            return;
        }
        track.classList.add("is-animating");
        track.style.transform = `translateX(-${stepSize}px)`;

        const onTransitionEnd = () => {
            track.classList.remove("is-animating");
            track.style.transform = "translateX(0)";
            if (track.firstElementChild) {
                track.appendChild(track.firstElementChild);
            }
            updateIndicator(1);
            track.removeEventListener("transitionend", onTransitionEnd);
        };

        track.addEventListener("transitionend", onTransitionEnd);
    };

    const movePrev = () => {
        if (!stepSize || track.classList.contains("is-animating")) {
            return;
        }
        if (track.lastElementChild) {
            track.insertBefore(track.lastElementChild, track.firstElementChild);
        }
        track.classList.remove("is-animating");
        track.style.transform = `translateX(-${stepSize}px)`;
        void track.offsetHeight;
        track.classList.add("is-animating");
        requestAnimationFrame(() => {
            track.style.transform = "translateX(0)";
        });

        const onTransitionEnd = () => {
            track.classList.remove("is-animating");
            updateIndicator(-1);
            track.removeEventListener("transitionend", onTransitionEnd);
        };

        track.addEventListener("transitionend", onTransitionEnd);
    };

    caseCarouselMoveNext = moveNext;

    const startAuto = () => {
        if (caseCarouselTimer) {
            window.clearInterval(caseCarouselTimer);
        }
        if (caseCarouselMoveNext) {
            caseCarouselTimer = window.setInterval(caseCarouselMoveNext, 7000);
        }
    };

    const stopAuto = () => {
        if (caseCarouselTimer) {
            window.clearInterval(caseCarouselTimer);
            caseCarouselTimer = undefined;
        }
    };

    let isDragging = false;
    let startX = 0;
    let deltaX = 0;
    let activePointerId = null;

    const onPointerMove = (event) => {
        if (!isDragging) {
            return;
        }
        deltaX = event.clientX - startX;
        track.style.transform = `translateX(${deltaX}px)`;
    };

    const endDrag = () => {
        if (!isDragging) {
            return;
        }
        isDragging = false;
        track.classList.remove("is-dragging");
        if (activePointerId !== null) {
            track.releasePointerCapture(activePointerId);
            activePointerId = null;
        }
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", endDrag);
        window.removeEventListener("pointercancel", endDrag);

        const threshold = Math.min(120, stepSize / 3);
        if (absDelta > 5) {
            caseCarouselDragLock = true;
            window.setTimeout(() => {
                caseCarouselDragLock = false;
            }, 250);
        }

        if (deltaX <= -threshold) {
            track.style.transform = "translateX(0)";
            moveNext();
        } else if (deltaX >= threshold) {
            track.style.transform = "translateX(0)";
            movePrev();
        } else {
            track.classList.add("is-animating");
            track.style.transform = "translateX(0)";
            track.addEventListener(
                "transitionend",
                () => {
                    track.classList.remove("is-animating");
                },
                { once: true },
            );
        }
        startAuto();
    };

    track.addEventListener("pointerdown", (event) => {
        if (track.classList.contains("is-animating")) {
            return;
        }
        if (event.button !== 0) {
            return;
        }
        if (event.target.closest(".case-card__thumb-btn")) {
            return;
        }
        isDragging = true;
        startX = event.clientX;
        deltaX = 0;
        track.classList.add("is-dragging");
        stopAuto();
        activePointerId = event.pointerId;
        track.setPointerCapture(event.pointerId);
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", endDrag);
        window.addEventListener("pointercancel", endDrag);
    });

    startAuto();
};

const jumpCaseToIndex = (targetIndex) => {
    if (!caseCarouselState.total) {
        return;
    }
    const track = document.querySelector('[data-cards="case-studies"]');
    if (!track || track.classList.contains("is-animating")) {
        return;
    }
    const safeIndex =
        ((targetIndex % caseCarouselState.total) + caseCarouselState.total) %
        caseCarouselState.total;
    const delta = safeIndex - caseCarouselState.index;
    if (delta === 0) {
        return;
    }
    const steps =
        delta > 0 ? delta : caseCarouselState.total + delta;
    if (!caseCarouselStepSize) {
        return;
    }
    track.classList.add("is-animating");
    track.style.transform = `translateX(-${
        caseCarouselStepSize * steps
    }px)`;

    const onTransitionEnd = () => {
        track.classList.remove("is-animating");
        track.style.transform = "translateX(0)";
        for (let i = 0; i < steps; i += 1) {
            if (track.firstElementChild) {
                track.appendChild(track.firstElementChild);
            }
        }
        caseCarouselState.index = safeIndex;
        setActiveCaseIndicator(caseCarouselState.index);
        if (caseCarouselMoveNext) {
            if (caseCarouselTimer) {
                window.clearInterval(caseCarouselTimer);
            }
            caseCarouselTimer = window.setInterval(
                caseCarouselMoveNext,
                7000,
            );
        }
        track.removeEventListener("transitionend", onTransitionEnd);
    };

    track.addEventListener("transitionend", onTransitionEnd);
};

const initCaseIndicatorClicks = () => {
    const filters = document.querySelector("[data-case-filters]");
    if (filters instanceof HTMLElement && !filters.dataset.bound) {
        filters.dataset.bound = "true";
        filters.addEventListener("click", (event) => {
            const target = event.target.closest("[data-case-filter]");
            if (!(target instanceof HTMLElement)) {
                return;
            }
            const nextFilter = target.getAttribute("data-case-filter");
            if (!nextFilter || caseArchiveState.activeFilter === nextFilter) {
                return;
            }
            caseArchiveState.activeFilter = nextFilter;
            renderCaseFilters();
            renderCaseEntries();
        });
    }

    if (document.body.dataset.caseDetailBound === "true") {
        return;
    }
    document.body.dataset.caseDetailBound = "true";
    document.addEventListener("click", (event) => {
        const target = event.target.closest("[data-case-open]");
        if (!(target instanceof HTMLElement)) {
            return;
        }
        const slug = target.getAttribute("data-case-open");
        if (!slug) {
            return;
        }
        const selected = caseArchiveState.cards.find(
            (card) => card.slug === slug,
        );
        if (!selected) {
            return;
        }
        renderCaseDetail(selected);
    });
};

const renderModuleIndicators = (total) => {
    const container = document.querySelector("[data-module-indicators]");
    if (!container) {
        return;
    }
    container.innerHTML = "";

    for (let i = 0; i < total; i += 1) {
        const dot = document.createElement("button");
        dot.className = "case-indicator";
        dot.type = "button";
        dot.setAttribute("aria-label", `모듈 ${i + 1}번`);
        dot.dataset.index = String(i);
        if (i === 0) {
            dot.classList.add("is-active");
        }
        container.appendChild(dot);
    }
};

const setActiveModuleIndicator = (index) => {
    const container = document.querySelector("[data-module-indicators]");
    if (!container) {
        return;
    }
    const dots = Array.from(container.children);
    dots.forEach((dot, idx) => {
        dot.classList.toggle("is-active", idx === index);
    });
};

const initCaseImagePreview = () => {
    const modal = document.getElementById("modal-case-image");
    if (!modal) {
        return;
    }
    const image = modal.querySelector("[data-case-image-target]");

    document.addEventListener("click", (event) => {
        const trigger = event.target.closest("[data-case-image]");
        if (!trigger) {
            return;
        }
        if (caseCarouselDragLock || moduleCarouselDragLock) {
            return;
        }
        const src = trigger.getAttribute("data-case-image");
        if (!src || !image) {
            return;
        }
        image.src = src;
        image.alt =
            trigger.getAttribute("data-case-alt") || "케이스 스터디 이미지";
        setModalState(modal, true);
    });
};

const renderModules = async () => {
    const container = document.querySelector('[data-cards="modules"]');
    if (!container) {
        return;
    }

    try {
        const data = await fetchJson("sections/modules/modules.json");
        const cards = Array.isArray(data.cards) ? data.cards : [];
        container.innerHTML = "";

        moduleCarouselState.total = cards.length;
        moduleCarouselState.index = 0;
        renderModuleIndicators(cards.length);
        setActiveModuleIndicator(0);

        const builtCards = cards.map((card) => buildModuleCard(card));
        builtCards.forEach((cardEl) => container.appendChild(cardEl));

        builtCards.forEach((cardEl) => {
            const clone = cardEl.cloneNode(true);
            container.appendChild(clone);
        });
    } catch (error) {
        container.innerHTML = "";
        const message = document.createElement("p");
        message.className = "muted";
        message.textContent = "모듈 카드를 불러오지 못했습니다.";
        container.appendChild(message);
    }
};

const initModuleCarousel = () => {
    const track = document.querySelector('[data-cards="modules"]');
    if (!track || track.children.length < 2) {
        return;
    }

    const getStepSize = () => {
        const firstCard = track.querySelector(".module-card");
        if (!firstCard) {
            return 0;
        }
        const gapValue = parseFloat(
            window.getComputedStyle(track).gap || "0",
        );
        const gap = Number.isNaN(gapValue) ? 0 : gapValue;
        return firstCard.getBoundingClientRect().width + gap;
    };

    let stepSize = getStepSize();
    moduleCarouselStepSize = stepSize;
    const updateStep = () => {
        stepSize = getStepSize();
        moduleCarouselStepSize = stepSize;
    };

    window.addEventListener("resize", updateStep);

    const updateIndicator = (delta) => {
        if (!moduleCarouselState.total) {
            return;
        }
        moduleCarouselState.index =
            (moduleCarouselState.index +
                delta +
                moduleCarouselState.total) %
            moduleCarouselState.total;
        setActiveModuleIndicator(moduleCarouselState.index);
    };

    const moveNext = () => {
        if (!stepSize || track.classList.contains("is-animating")) {
            return;
        }
        track.classList.add("is-animating");
        track.style.transform = `translateX(-${stepSize}px)`;

        const onTransitionEnd = () => {
            track.classList.remove("is-animating");
            track.style.transform = "translateX(0)";
            if (track.firstElementChild) {
                track.appendChild(track.firstElementChild);
            }
            updateIndicator(1);
            track.removeEventListener("transitionend", onTransitionEnd);
        };

        track.addEventListener("transitionend", onTransitionEnd);
    };

    const movePrev = () => {
        if (!stepSize || track.classList.contains("is-animating")) {
            return;
        }
        if (track.lastElementChild) {
            track.insertBefore(track.lastElementChild, track.firstElementChild);
        }
        track.classList.remove("is-animating");
        track.style.transform = `translateX(-${stepSize}px)`;
        void track.offsetHeight;
        track.classList.add("is-animating");
        requestAnimationFrame(() => {
            track.style.transform = "translateX(0)";
        });

        const onTransitionEnd = () => {
            track.classList.remove("is-animating");
            updateIndicator(-1);
            track.removeEventListener("transitionend", onTransitionEnd);
        };

        track.addEventListener("transitionend", onTransitionEnd);
    };

    moduleCarouselMoveNext = moveNext;

    const startAuto = () => {
        if (moduleCarouselTimer) {
            window.clearInterval(moduleCarouselTimer);
        }
        if (moduleCarouselMoveNext) {
            moduleCarouselTimer = window.setInterval(
                moduleCarouselMoveNext,
                7000,
            );
        }
    };

    const stopAuto = () => {
        if (moduleCarouselTimer) {
            window.clearInterval(moduleCarouselTimer);
            moduleCarouselTimer = undefined;
        }
    };

    let isDragging = false;
    let startX = 0;
    let deltaX = 0;
    let activePointerId = null;

    const onPointerMove = (event) => {
        if (!isDragging) {
            return;
        }
        deltaX = event.clientX - startX;
        track.style.transform = `translateX(${deltaX}px)`;
    };

    const endDrag = () => {
        if (!isDragging) {
            return;
        }
        isDragging = false;
        track.classList.remove("is-dragging");
        if (activePointerId !== null) {
            track.releasePointerCapture(activePointerId);
            activePointerId = null;
        }
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", endDrag);
        window.removeEventListener("pointercancel", endDrag);

        const threshold = Math.min(120, stepSize / 3);
        const absDelta = Math.abs(deltaX);

        if (absDelta > 5) {
            moduleCarouselDragLock = true;
            window.setTimeout(() => {
                moduleCarouselDragLock = false;
            }, 250);
        }

        if (deltaX <= -threshold) {
            track.style.transform = "translateX(0)";
            moveNext();
        } else if (deltaX >= threshold) {
            track.style.transform = "translateX(0)";
            movePrev();
        } else {
            track.classList.add("is-animating");
            track.style.transform = "translateX(0)";
            track.addEventListener(
                "transitionend",
                () => {
                    track.classList.remove("is-animating");
                },
                { once: true },
            );
        }
        startAuto();
    };

    track.addEventListener("pointerdown", (event) => {
        if (track.classList.contains("is-animating")) {
            return;
        }
        if (event.button !== 0) {
            return;
        }
        if (event.target.closest(".module-card__thumb-btn")) {
            return;
        }
        isDragging = true;
        startX = event.clientX;
        deltaX = 0;
        track.classList.add("is-dragging");
        stopAuto();
        activePointerId = event.pointerId;
        track.setPointerCapture(event.pointerId);
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", endDrag);
        window.addEventListener("pointercancel", endDrag);
    });

    startAuto();
};

const jumpModuleToIndex = (targetIndex) => {
    if (!moduleCarouselState.total) {
        return;
    }
    const track = document.querySelector('[data-cards="modules"]');
    if (!track || track.classList.contains("is-animating")) {
        return;
    }
    const safeIndex =
        ((targetIndex % moduleCarouselState.total) +
            moduleCarouselState.total) %
        moduleCarouselState.total;
    const delta = safeIndex - moduleCarouselState.index;
    if (delta === 0) {
        return;
    }
    const steps =
        delta > 0 ? delta : moduleCarouselState.total + delta;
    if (!moduleCarouselStepSize) {
        return;
    }
    track.classList.add("is-animating");
    track.style.transform = `translateX(-${
        moduleCarouselStepSize * steps
    }px)`;

    const onTransitionEnd = () => {
        track.classList.remove("is-animating");
        track.style.transform = "translateX(0)";
        for (let i = 0; i < steps; i += 1) {
            if (track.firstElementChild) {
                track.appendChild(track.firstElementChild);
            }
        }
        moduleCarouselState.index = safeIndex;
        setActiveModuleIndicator(moduleCarouselState.index);
        if (moduleCarouselMoveNext) {
            if (moduleCarouselTimer) {
                window.clearInterval(moduleCarouselTimer);
            }
            moduleCarouselTimer = window.setInterval(
                moduleCarouselMoveNext,
                7000,
            );
        }
        track.removeEventListener("transitionend", onTransitionEnd);
    };

    track.addEventListener("transitionend", onTransitionEnd);
};

const initModuleIndicatorClicks = () => {
    const container = document.querySelector("[data-module-indicators]");
    if (!container) {
        return;
    }
    container.addEventListener("click", (event) => {
        const target = event.target.closest(".case-indicator");
        if (!target) {
            return;
        }
        const index = Number(target.dataset.index);
        if (Number.isNaN(index)) {
            return;
        }
        jumpModuleToIndex(index);
    });
};

document.addEventListener("DOMContentLoaded", async () => {
    initThemeToggle();
    initNavMenu();
    initScrollUI();
    await loadSections();
    await renderCaseStudies();
    initCaseImagePreview();
    initCaseIndicatorClicks();
    await renderModules();
    initModuleCarousel();
    initModuleIndicatorClicks();
    initModals();
    initCopyButtons();
});
