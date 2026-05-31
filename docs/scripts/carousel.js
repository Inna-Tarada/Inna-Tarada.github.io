(function() {
    // ===== YOUR IMAGES HERE =====
    const imageUrls = [
        '../images/pageimages/certificates/1.jpg',
        '../images/pageimages/certificates/2.jpg',
        '../images/pageimages/certificates/3.jpg',
        '../images/pageimages/certificates/4.jpg',
        '../images/pageimages/certificates/5.jpg',
        '../images/pageimages/certificates/6.jpg'
        //'../images/certificates/7.jpg',
        //'../images/certificates/8.jpg'
    ];
    // ============================

    const track = document.getElementById('track');
    const carousel = document.getElementById('carousel');
    
    // State
    let angle = 0;
    let spinning = true;
    let dir = 1;
    let speed = 2;
    let dragging = false;
    let startX, startAngle;
    
    // Clear existing content
    if (track) {
        track.innerHTML = '';
    }
    
    // Create items
    imageUrls.forEach((url, i) => {
        const item = document.createElement('div');
        item.className = 'item';
        
        // Create image element to handle errors
        const img = new Image();
        img.src = url;
        img.alt = `Image ${i + 1}`;
        img.onerror = function() {
            // Fallback if image fails to load
            this.src = 'https://via.placeholder.com/400x400/1a1a2e/ffffff?text=Image+' + (i + 1);
        };
        
        item.appendChild(img);
        
        const span = document.createElement('span');
        span.textContent = `Image ${i + 1}`;
        item.appendChild(span);
        
        track.appendChild(item);
    });
    
    const items = document.querySelectorAll('.item');
    const total = items.length;
    
    function updatePositions() {
        const radius = 700;
        const step = (2 * Math.PI) / total;
        
        items.forEach((item, i) => {
            const itemAngle = i * step + (angle * Math.PI / 180);
            const x = Math.sin(itemAngle) * radius;
            const z = Math.cos(itemAngle) * radius;
            const scale = (z + radius) / (radius * 2) + 0.5;
            
            item.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${-itemAngle}rad) scale(${scale})`;
            item.style.opacity = Math.max(0.4, Math.min(1, scale));
            item.style.zIndex = Math.floor(z + radius);
        });
    }
    
    // Mouse/Touch events
    function startDrag(e) {
        e.preventDefault();
        const pos = e.type === 'touchstart' ? e.touches[0] : e;
        dragging = true;
        startX = pos.clientX;
        startAngle = angle;
        carousel.style.cursor = 'grabbing';
    }
    
    function onDrag(e) {
        if (!dragging) return;
        e.preventDefault();
        const pos = e.type === 'touchmove' ? e.touches[0] : e;
        const delta = (pos.clientX - startX) * 0.3;
        angle = startAngle + delta;
        updatePositions();
    }
    
    function stopDrag() {
        dragging = false;
        carousel.style.cursor = 'grab';
    }
    
    // Events
    if (carousel) {
        carousel.addEventListener('mousedown', startDrag);
        carousel.addEventListener('touchstart', startDrag, { passive: false });
    }
    
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('touchmove', onDrag, { passive: false });
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
    
    // Add keyboard controls (optional)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            dir = -1;
            spinning = true;
        } else if (e.key === 'ArrowRight') {
            dir = 1;
            spinning = true;
        } else if (e.key === ' ') {
            spinning = !spinning;
            e.preventDefault();
        }
    });
    
    // Animation
    function animate() {
        if (spinning && !dragging) {
            angle += dir * (speed * 0.1);
            updatePositions();
        }
        requestAnimationFrame(animate);
    }
    
    // Initialize
    if (total > 0) {
        updatePositions();
        animate();
    }
})();