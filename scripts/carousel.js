(function() {
    const imageUrls = [
        '../images/placeholdercar/1.jpg',
        '../images/placeholdercar/2.jpg',
        '../images/placeholdercar/3.jpg',
        '../images/placeholdercar/4.jpg',
        '../images/placeholdercar/5.jpg',
        '../images/placeholdercar/6.jpg',
        '../images/placeholdercar/7.jpg',
        '../images/placeholdercar/8.jpg'
    ];

    const track = document.getElementById('track');
    const carousel = document.getElementById('carousel');
    
    if (!track || !carousel) return;

    // Дублируем контент для бесшовного зацикливания
    const fullList = [...imageUrls, ...imageUrls];
    track.innerHTML = '';
    
    fullList.forEach((url, i) => {
        const item = document.createElement('div');
        item.className = 'item';
        const img = new Image();
        img.src = url;
        img.alt = `Certificate ${i + 1}`;
        img.onerror = function() {
            this.src = 'https://via.placeholder.com/300x400/1a1a2e/ffffff?text=Certificate+' + ((i % imageUrls.length) + 1);
        };
        item.appendChild(img);
        track.appendChild(item);
    });

    // Состояние
    let scrollPos = 0;
    let isInteracting = false;
    let isDragging = false;
    let startX;
    let scrollLeftStart;
    const speed = 0.8; // Скорость вращения (пиксели за кадр)

    // Анимация
    function animate() {
        if (!isInteracting && !isDragging) {
            scrollPos += speed;
            
            // Если дошли до середины (конца первого набора), прыгаем в начало
            if (scrollPos >= track.scrollWidth / 2) {
                scrollPos = 0;
            }
            carousel.scrollLeft = scrollPos;
        }
        requestAnimationFrame(animate);
    }

    // Обработка взаимодействия (пауза при наведении)
    carousel.addEventListener('mouseenter', () => isInteracting = true);
    carousel.addEventListener('mouseleave', () => {
        if (!isDragging) isInteracting = false;
    });

    // Drag-н-дроп (мышь)
    carousel.addEventListener('mousedown', (e) => {
        isDragging = true;
        isInteracting = true;
        startX = e.pageX - carousel.offsetLeft;
        scrollLeftStart = carousel.scrollLeft;
        carousel.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - carousel.offsetLeft;
        const walk = (x - startX);
        carousel.scrollLeft = scrollLeftStart - walk;
        scrollPos = carousel.scrollLeft; // Синхронизируем позицию анимации
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            carousel.style.cursor = 'grab';
            // Небольшая задержка перед возобновлением, если мышь все еще над каруселью
            if (!carousel.matches(':hover')) {
                isInteracting = false;
            }
        }
    });

    // Touch-события для мобилок
    carousel.addEventListener('touchstart', (e) => {
        isInteracting = true;
        isDragging = true;
        startX = e.touches[0].pageX - carousel.offsetLeft;
        scrollLeftStart = carousel.scrollLeft;
    }, { passive: true });

    carousel.addEventListener('touchend', () => {
        isDragging = false;
        isInteracting = false;
        scrollPos = carousel.scrollLeft;
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const x = e.touches[0].pageX - carousel.offsetLeft;
        const walk = (x - startX);
        carousel.scrollLeft = scrollLeftStart - walk;
    }, { passive: true });

    // Запуск
    requestAnimationFrame(animate);
})();
