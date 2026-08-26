/* ==========================================================================
   Certificate gallery controller.
   The file keeps its original name for compatibility with main_s_v2.js, but
   the old drag-to-spin carousel has intentionally been replaced by a calmer,
   accessible wall + lightbox interaction.
   ========================================================================== */

(() => {
    const returnToMenuButtons = document.querySelectorAll('[data-return-to-menu]');

    // Notify main_s_v2.js explicitly; camera and page visibility stay centralized there.
    returnToMenuButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            document.dispatchEvent(new CustomEvent('return-to-menu'));
        });
    });

    const gallery = document.querySelector('[data-certificate-gallery]');

    if (!gallery) {
        return;
    }

    const cards = [...gallery.querySelectorAll('[data-certificate]')];

    if (!cards.length) {
        return;
    }

    const icons = {
        close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>',
        previous: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>',
        next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>'
    };

    // The lightbox is generated once, so the HTML page remains easy to edit.
    const lightbox = document.createElement('div');
    lightbox.className = 'certificate-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-labelledby', 'certificateLightboxTitle');
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML = `
        <button class="certificate-lightbox__button certificate-lightbox__close" type="button" data-lightbox-close aria-label="Закрыть просмотр">
            ${icons.close}
        </button>
        <button class="certificate-lightbox__button certificate-lightbox__prev" type="button" data-lightbox-prev aria-label="Предыдущий сертификат">
            ${icons.previous}
        </button>
        <div class="certificate-lightbox__stage" data-lightbox-stage>
            <img class="certificate-lightbox__image" data-lightbox-image alt="">
        </div>
        <button class="certificate-lightbox__button certificate-lightbox__next" type="button" data-lightbox-next aria-label="Следующий сертификат">
            ${icons.next}
        </button>
        <div class="certificate-lightbox__meta">
            <span id="certificateLightboxTitle" data-lightbox-title>Сертификат 01</span>
            <span data-lightbox-hint>← → листать · Esc закрыть</span>
        </div>
    `;

    document.body.appendChild(lightbox);

    const image = lightbox.querySelector('[data-lightbox-image]');
    const title = lightbox.querySelector('[data-lightbox-title]');
    const closeButton = lightbox.querySelector('[data-lightbox-close]');
    const previousButton = lightbox.querySelector('[data-lightbox-prev]');
    const nextButton = lightbox.querySelector('[data-lightbox-next]');

    let currentIndex = 0;
    let previousFocus = null;

    const getCardImage = (index) => cards[index].querySelector('img');

    function render(index) {
        currentIndex = (index + cards.length) % cards.length;
        const cardImage = getCardImage(currentIndex);
        const number = String(currentIndex + 1).padStart(2, '0');

        image.src = cardImage.currentSrc || cardImage.src;
        image.alt = cardImage.alt || `Сертификат ${number}`;
        title.textContent = `Сертификат ${number} / ${cards.length}`;
    }

    function open(index) {
        previousFocus = document.activeElement;
        render(index);
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lightbox-open');
        closeButton.focus({ preventScroll: true });
    }

    function close() {
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lightbox-open');

        if (previousFocus && typeof previousFocus.focus === 'function') {
            previousFocus.focus({ preventScroll: true });
        }
    }

    cards.forEach((card, index) => {
        card.addEventListener('click', () => open(index));
    });

    closeButton.addEventListener('click', close);
    previousButton.addEventListener('click', () => render(currentIndex - 1));
    nextButton.addEventListener('click', () => render(currentIndex + 1));

    // Clicking the dimmed area closes the viewer; clicks on the image do not.
    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox || event.target === lightbox.querySelector('[data-lightbox-stage]')) {
            close();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (!lightbox.classList.contains('is-open')) {
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            close();
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            render(currentIndex - 1);
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            render(currentIndex + 1);
        }
    });

    // Keep keyboard focus inside the dialog while it is open.
    lightbox.addEventListener('keydown', (event) => {
        if (event.key !== 'Tab') {
            return;
        }

        const focusable = [...lightbox.querySelectorAll('button')];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
})();
