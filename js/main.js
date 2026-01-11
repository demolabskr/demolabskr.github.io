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

const initModals = () => {
    const modalTriggers = document.querySelectorAll("[data-modal-target]");
    const modalCloseButtons = document.querySelectorAll("[data-modal-close]");

    if (!modalTriggers.length && !modalCloseButtons.length) {
        return;
    }

    const setModalState = (modal, isOpen) => {
        if (!modal) {
            return;
        }
        modal.classList.toggle("is-active", isOpen);
        modal.setAttribute("aria-hidden", isOpen ? "false" : "true");
        const hasOpenModal = document.querySelector(".modal.is-active");
        document.body.classList.toggle("modal-open", Boolean(hasOpenModal));
    };

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

document.addEventListener("DOMContentLoaded", async () => {
    initThemeToggle();
    initNavMenu();
    initScrollUI();
    await loadSections();
    initModals();
});
