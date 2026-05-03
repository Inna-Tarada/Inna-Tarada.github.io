export function initCarousel() {
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
    if (!track || track.children.length > 0) return;

    // Generate slides
    const fragment = document.createDocumentFragment();
    imageUrls.forEach((url, i) => {
        const slide = document.createElement('div');
        // Swiper requires the 'swiper-slide' class
        slide.className = 'swiper-slide item';
        
        const img = new Image();
        img.src = url;
        img.loading = 'lazy';
        img.alt = `Certificate placeholder ${i + 1}`;
        
        slide.appendChild(img);
        fragment.appendChild(slide);
    });
    
    // Append all slides at once for better performance
    track.appendChild(fragment);

    // Initialize Swiper if available
    if (typeof Swiper !== 'undefined') {
        new Swiper('.mySwiper', {
            slidesPerView: 'auto',
            spaceBetween: 20,
            grabCursor: true,
            freeMode: true,
            keyboard: {
                enabled: true,
            },
        });
    } else {
        console.warn('Swiper library not loaded. Carousel will not function correctly.');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarousel);
} else {
    initCarousel();
}
