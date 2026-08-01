// A. EVENT DOMContentLoaded UNTUK UI BIASA (Menu, Counter, Accordion)
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Hamburger Menu
    const menuToggle = document.querySelector('#mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const btnNav = document.querySelector('.btn-nav');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('is-active'); 
            navMenu.classList.toggle('active');       
            if(btnNav) btnNav.classList.toggle('active');        
        });
    }

    // 2. Animasi Counter Angka
    const counters = document.querySelectorAll('.counter');
    if (counters.length > 0) {
        const observerOptions = { root: null, threshold: 0.5 };
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = +entry.target.getAttribute('data-target');
                    const duration = 1200; 
                    const frameRate = 1000 / 60; 
                    const totalFrames = Math.round(duration / frameRate);
                    const increment = target / totalFrames; 
                    
                    let currentCount = 0;
                    const timer = setInterval(() => {
                        currentCount += increment;
                        if (currentCount >= target) {
                            entry.target.innerText = target; 
                            clearInterval(timer); 
                        } else {
                            entry.target.innerText = Math.ceil(currentCount); 
                        }
                    }, frameRate);
                    
                    observer.unobserve(entry.target); 
                }
            });
        }, observerOptions);

        counters.forEach(counter => observer.observe(counter));
    }

    // 3. Accordion FAQ
    const accordionHeaders = document.querySelectorAll(".accordion-header");
    if (accordionHeaders.length > 0) {
        accordionHeaders.forEach(header => {
            header.addEventListener("click", function() {
                accordionHeaders.forEach(otherHeader => {
                    if (otherHeader !== this && otherHeader.classList.contains("active")) {
                        otherHeader.classList.remove("active");
                        otherHeader.nextElementSibling.style.maxHeight = null;
                    }
                });
                this.classList.toggle("active");
                const content = this.nextElementSibling;
                if (this.classList.contains("active")) {
                    content.style.maxHeight = content.scrollHeight + "px";
                } else {
                    content.style.maxHeight = null;
                }
            });
        });
    }
});


// B. EVENT LOAD KHUSUS UNTUK CAROUSEL GALERI (Looping & Manual Drag)
window.addEventListener("load", () => {
    const track = document.getElementById("gallery-track");
    const wrapper = document.getElementById("carousel-wrapper");
    
    if (!track || !wrapper) return; 

    const originalSlides = Array.from(track.children);
    const dots = document.querySelectorAll(".dot");
    const totalOriginal = originalSlides.length;

    // Duplikasi slide di awal dan akhir untuk efek infinite loop yang mulus
    originalSlides.forEach(slide => {
        const clone = slide.cloneNode(true);
        track.appendChild(clone); // Tambah duplikat ke belakang
    });
    
    originalSlides.slice().reverse().forEach(slide => {
        const clone = slide.cloneNode(true);
        track.insertBefore(clone, track.firstChild); // Tambah duplikat ke depan
    });

    const allSlides = Array.from(track.children);
    let currentIndex = totalOriginal; // Mulai dari set data asli pertama
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let autoPlayInterval;

    const getSlideWidth = () => {
        return allSlides[0].getBoundingClientRect().width || allSlides[0].clientWidth;
    };

    const updateActiveSlide = () => {
        allSlides.forEach((slide, index) => {
            const realIndex = (index - totalOriginal) % totalOriginal;
            const positiveRealIndex = (realIndex + totalOriginal) % totalOriginal;
            
            // Pada desktop, slide yang di tengah adalah index + 1 dari currentIndex
            const isCenter = (window.innerWidth >= 768 && index === currentIndex + 1) || 
                             (window.innerWidth < 768 && index === currentIndex);
            
            slide.classList.toggle("active-slide", isCenter);
        });

        dots.forEach((dot, index) => {
            const currentRealIndex = (currentIndex - totalOriginal + totalOriginal) % totalOriginal;
            dot.classList.toggle("active", index === currentRealIndex);
        });
    };

    const setPositionByIndex = (withTransition = true) => {
        const slideWidth = getSlideWidth();
        const isDesktop = window.innerWidth >= 768;

        if (slideWidth === 0) return;

        // KUNCI UTAMA: 
        // Menggunakan -currentIndex secara murni tanpa pengurangan 1.5 
        // agar slide yang aktif jatuh tepat di kotak tengah (kotak ke-2).
        if (isDesktop) {
            currentTranslate = -currentIndex * slideWidth;
        } else {
            currentTranslate = -currentIndex * slideWidth;
        }

        prevTranslate = currentTranslate;
        
        if (withTransition) {
            track.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
        } else {
            track.style.transition = 'none';
        }
        
        track.style.transform = `translateX(${currentTranslate}px)`;
        updateActiveSlide();
    };

    // Fungsi untuk memeriksa batas loop dan mereset posisi secara instan tanpa kedip
    const checkInfiniteLoop = () => {
        track.style.transition = 'none';
        if (currentIndex >= totalOriginal * 2) {
            currentIndex = totalOriginal;
            setPositionByIndex(false);
        } else if (currentIndex < totalOriginal) {
            currentIndex = totalOriginal * 2 - 1;
            setPositionByIndex(false);
        }
    };

    track.addEventListener('transitionend', checkInfiniteLoop);

    const getPositionX = (event) => {
        return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
    };

    const dragStart = (event) => {
        if (event.type === 'mousedown') event.preventDefault();
        stopAutoPlay();
        isDragging = true;
        startPos = getPositionX(event);
        track.style.transition = 'none';
    };

    const dragMove = (event) => {
        if (!isDragging) return;
        const currentPosition = getPositionX(event);
        const movedBy = currentPosition - startPos;
        track.style.transform = `translateX(${prevTranslate + movedBy}px)`;
    };

    const dragEnd = (event) => {
        if (!isDragging) return;
        isDragging = false;
        
        const endPos = event.type.includes('mouse') ? event.pageX : (event.changedTouches ? event.changedTouches[0].clientX : startPos);
        const movedBy = endPos - startPos;
        
        if (movedBy < -50) {
            currentIndex += 1;
        } else if (movedBy > 50) {
            currentIndex -= 1;
        }
        
        setPositionByIndex(true);
        startAutoPlay();
    };

    // Event Listeners untuk Mouse & Touch (Geser Manual)
    track.addEventListener('mousedown', dragStart);
    track.addEventListener('mousemove', dragMove);
    track.addEventListener('mouseup', dragEnd);
    track.addEventListener('mouseleave', () => {
        if (isDragging) dragEnd({ type: 'mouse', pageX: startPos });
    });

    track.addEventListener('touchstart', dragStart, { passive: false });
    track.addEventListener('touchmove', dragMove, { passive: true });
    track.addEventListener('touchend', dragEnd);

    window.addEventListener('resize', () => {
        setTimeout(() => setPositionByIndex(false), 100);
    });

    // Kontrol Klik Titik Dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            stopAutoPlay();
            currentIndex = totalOriginal + index;
            setPositionByIndex(true);
            startAutoPlay();
        });
    });

    const autoPlaySlide = () => {
        currentIndex++;
        setPositionByIndex(true);
    };

    const startAutoPlay = () => {
        stopAutoPlay();
        autoPlayInterval = setInterval(autoPlaySlide, 3000); 
    };

    const stopAutoPlay = () => {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
    };

    wrapper.addEventListener('mouseenter', stopAutoPlay);
    wrapper.addEventListener('mouseleave', startAutoPlay);

    // Inisialisasi awal posisi
    currentIndex = totalOriginal;
    setPositionByIndex(false);
    startAutoPlay();
});