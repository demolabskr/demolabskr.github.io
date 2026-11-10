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
                const response = await fetch(url, { cache: "no-cache" });
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

    const setExpanded = (expanded) => {
        burger.classList.toggle("is-active", expanded);
        menu.classList.toggle("is-active", expanded);
        burger.setAttribute("aria-expanded", String(expanded));
        burger.setAttribute("aria-label", expanded ? "메뉴 닫기" : "메뉴 열기");
    };
    burger.addEventListener("click", () => {
        setExpanded(!menu.classList.contains("is-active"));
    });
    menu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setExpanded(false));
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

const AUTO_SLIDER_INTERVAL = 3500;
const AUTO_SLIDER_DURATION = 600;

const initAutoSlider = (slider) => {
    const viewport = slider.querySelector(".auto-slider__viewport");
    const track = slider.querySelector(".auto-slider__track");
    const controls = slider.querySelector(".auto-slider__controls");
    const toggle = slider.querySelector(".auto-slider__toggle");
    const prevButton = slider.querySelector("[data-slider-prev]");
    const nextButton = slider.querySelector("[data-slider-next]");
    if (!viewport || !track) {
        return;
    }

    let timer = null;
    let isAnimating = false;
    let isHovered = false;
    let isFocused = false;
    let isVisible = true;
    let isUserPaused = false;

    const isOverflowing = () => track.scrollWidth > track.clientWidth + 1;

    const canPlay = () =>
        !isUserPaused &&
        !isHovered &&
        !isFocused &&
        isVisible &&
        !document.hidden &&
        isOverflowing();

    const getStep = (item) =>
        item.getBoundingClientRect().width +
        (parseFloat(getComputedStyle(track).columnGap) || 0);

    const slideNext = (manual = false) => {
        const first = track.firstElementChild;
        if (!first || isAnimating || !(manual ? isOverflowing() : canPlay())) {
            return;
        }
        const distance = getStep(first);
        isAnimating = true;
        track.style.transition = `transform ${AUTO_SLIDER_DURATION}ms ease`;
        track.style.transform = `translateX(${-distance}px)`;
        window.setTimeout(() => {
            track.style.transition = "none";
            track.appendChild(first);
            track.style.transform = "translateX(0)";
            isAnimating = false;
        }, AUTO_SLIDER_DURATION);
    };

    const slidePrev = () => {
        const last = track.lastElementChild;
        if (!last || isAnimating || !isOverflowing()) {
            return;
        }
        isAnimating = true;
        track.style.transition = "none";
        track.prepend(last);
        track.style.transform = `translateX(${-getStep(last)}px)`;
        void track.offsetWidth;
        track.style.transition = `transform ${AUTO_SLIDER_DURATION}ms ease`;
        track.style.transform = "translateX(0)";
        window.setTimeout(() => {
            track.style.transition = "none";
            isAnimating = false;
        }, AUTO_SLIDER_DURATION);
    };

    const restartTimer = () => {
        if (timer) {
            window.clearInterval(timer);
            timer = null;
        }
        update();
    };

    const update = () => {
        const overflowing = isOverflowing();
        if (controls) {
            controls.hidden = !overflowing;
        }
        if (canPlay()) {
            if (!timer) {
                timer = window.setInterval(slideNext, AUTO_SLIDER_INTERVAL);
            }
        } else if (timer) {
            window.clearInterval(timer);
            timer = null;
        }
    };

    slider.addEventListener("mouseenter", () => {
        isHovered = true;
        update();
    });
    slider.addEventListener("mouseleave", () => {
        isHovered = false;
        update();
    });
    const isKeyboardFocus = (element) => {
        try {
            return element.matches(":focus-visible");
        } catch (error) {
            return false;
        }
    };

    slider.addEventListener("focusin", (event) => {
        if (controls?.contains(event.target) || !isKeyboardFocus(event.target)) {
            return;
        }
        isFocused = true;
        update();
    });
    slider.addEventListener("focusout", (event) => {
        if (
            slider.contains(event.relatedTarget) &&
            !controls?.contains(event.relatedTarget)
        ) {
            return;
        }
        isFocused = false;
        update();
    });

    if (toggle) {
        toggle.addEventListener("click", () => {
            isUserPaused = !isUserPaused;
            const label = isUserPaused ? "자동 넘김 재생" : "자동 넘김 정지";
            toggle.classList.toggle("is-paused", isUserPaused);
            toggle.setAttribute("aria-label", label);
            toggle.setAttribute("title", label);
            update();
        });
    }

    prevButton?.addEventListener("click", () => {
        slidePrev();
        restartTimer();
    });
    nextButton?.addEventListener("click", () => {
        slideNext(true);
        restartTimer();
    });

    if ("IntersectionObserver" in window) {
        new IntersectionObserver((entries) => {
            isVisible = entries.some((entry) => entry.isIntersecting);
            update();
        }).observe(slider);
    }

    document.addEventListener("visibilitychange", update);
    window.addEventListener("resize", update);
    update();
};

const initAutoSliders = () => {
    document.querySelectorAll("[data-auto-slider]").forEach(initAutoSlider);
};

document.addEventListener("DOMContentLoaded", async () => {
    await loadSections();
    const hashTarget = document.getElementById(window.location.hash.slice(1));
    if (hashTarget) {
        hashTarget.scrollIntoView({ behavior: "instant" });
    }
    initThemeToggle();
    initNavMenu();
    initScrollUI();
    initAutoSliders();
    initModals();
    initCopyButtons();
});
