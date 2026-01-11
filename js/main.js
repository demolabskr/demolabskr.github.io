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
    const wrapper = document.createElement("div");
    wrapper.className = "case-card";

    const cardEl = document.createElement("div");
    cardEl.className = "sharp-card p-5 reveal";
    const delay = typeof card.delay === "number" ? card.delay : 0;
    cardEl.style.setProperty("--delay", `${delay}s`);

    const title = document.createElement("h3");
    title.className = "title is-5";
    title.textContent = card.title || "";

    const row = document.createElement("div");
    row.className = "case-card__row";

    const description = document.createElement("p");
    description.className = "muted case-card__text";
    description.textContent = card.description || "";
    row.appendChild(description);

    if (card.image) {
        const thumbButton = document.createElement("button");
        thumbButton.className = "case-card__thumb-btn";
        thumbButton.type = "button";
        thumbButton.setAttribute("data-case-image", card.image);
        thumbButton.setAttribute(
            "data-case-alt",
            card.imageAlt || "케이스 스터디 이미지",
        );
        thumbButton.setAttribute("aria-label", "케이스 스터디 이미지 보기");

        const thumb = document.createElement("img");
        thumb.src = card.image;
        thumb.alt = card.imageAlt || "케이스 스터디 이미지";
        thumbButton.appendChild(thumb);
        row.appendChild(thumbButton);
    }

    cardEl.appendChild(title);
    cardEl.appendChild(row);

    if (card.result) {
        const divider = document.createElement("div");
        divider.className = "divider";
        const result = document.createElement("p");
        result.className = "muted";
        result.textContent = card.result;
        cardEl.appendChild(divider);
        cardEl.appendChild(result);
    }

    wrapper.appendChild(cardEl);
    return wrapper;
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
    const container = document.querySelector('[data-cards="case-studies"]');
    if (!container) {
        return;
    }

    try {
        const data = await fetchJson(
            "sections/case-studies/case-studies.json",
        );
        const cards = Array.isArray(data.cards) ? data.cards : [];
        container.innerHTML = "";

        caseCarouselState.total = cards.length;
        caseCarouselState.index = 0;
        renderCaseIndicators(cards.length);
        setActiveCaseIndicator(0);

        const builtCards = cards.map((card) => buildCaseCard(card));
        builtCards.forEach((cardEl) => container.appendChild(cardEl));

        builtCards.forEach((cardEl) => {
            const clone = cardEl.cloneNode(true);
            container.appendChild(clone);
        });
    } catch (error) {
        container.innerHTML = "";
        const message = document.createElement("p");
        message.className = "muted";
        message.textContent = "케이스 스터디를 불러오지 못했습니다.";
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
    const container = document.querySelector("[data-case-indicators]");
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
        jumpCaseToIndex(index);
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
    initCaseCarousel();
    initCaseImagePreview();
    initCaseIndicatorClicks();
    await renderModules();
    initModuleCarousel();
    initModuleIndicatorClicks();
    initModals();
    initCopyButtons();
});
