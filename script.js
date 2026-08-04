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
        const observer = new IntersectionObserver((entries, observerInstance) => {
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
                    
                    observerInstance.unobserve(entry.target); 
                }
            });
        }, { threshold: 0.5 });

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
                content.style.maxHeight = this.classList.contains("active") ? content.scrollHeight + "px" : null;
            });
        });
    }

    // 4. Header Menu Active State dengan Debounce Scroll agar Ringan
    const navLinks = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll("section[id], main.hero");
    
    if (navLinks.length > 0) {
        navLinks.forEach(link => {
            link.addEventListener("click", function () {
                if (this.getAttribute("href").startsWith("#") || this.getAttribute("href") === "/") {
                    navLinks.forEach(nav => nav.classList.remove("active"));
                    this.classList.add("active");
                }
            });
        });

        if (sections.length > 0) {
            let scrollTimeout;
            window.addEventListener("scroll", () => {
                if (scrollTimeout) clearTimeout(scrollTimeout);
                
                // Debounce dijalankan setiap 100ms untuk meringankan beban CPU
                scrollTimeout = setTimeout(() => {
                    let currentScroll = window.pageYOffset + 150;

                    sections.forEach(section => {
                        const sectionHeight = section.offsetHeight;
                        const sectionTop = section.offsetTop;
                        const sectionId = section.getAttribute("id");

                        if (currentScroll >= sectionTop && currentScroll < sectionTop + sectionHeight) {
                            navLinks.forEach(link => {
                                link.classList.remove("active");
                                if (link.getAttribute("href") === `#${sectionId}` || (!sectionId && link.getAttribute("href") === "/")) {
                                    link.classList.add("active");
                                }
                            });
                        }
                    });
                }, 100);
            }, { passive: true });
        }
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

    // Duplikasi slide untuk infinite loop
    originalSlides.forEach(slide => track.appendChild(slide.cloneNode(true)));
    originalSlides.slice().reverse().forEach(slide => track.insertBefore(slide.cloneNode(true), track.firstChild));

    const allSlides = Array.from(track.children);
    let currentIndex = totalOriginal; 
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let autoPlayInterval;

    const getSlideWidth = () => allSlides[0].getBoundingClientRect().width || allSlides[0].clientWidth;

    const updateActiveSlide = () => {
        allSlides.forEach((slide, index) => {
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
        if (slideWidth === 0) return;

        currentTranslate = -currentIndex * slideWidth;
        prevTranslate = currentTranslate;
        
        track.style.transition = withTransition ? 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
        track.style.transform = `translateX(${currentTranslate}px)`;
        updateActiveSlide();
    };

    const checkInfiniteLoop = () => {
        if (currentIndex >= totalOriginal * 2) {
            currentIndex = totalOriginal;
            setPositionByIndex(false);
        } else if (currentIndex < totalOriginal) {
            currentIndex = totalOriginal * 2 - 1;
            setPositionByIndex(false);
        }
    };

    track.addEventListener('transitionend', checkInfiniteLoop);

    const getPositionX = (event) => event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;

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
        track.style.transform = `translateX(${prevTranslate + (currentPosition - startPos)}px)`;
    };

    const dragEnd = (event) => {
        if (!isDragging) return;
        isDragging = false;
        
        const endPos = event.type.includes('mouse') ? event.pageX : (event.changedTouches ? event.changedTouches[0].clientX : startPos);
        const movedBy = endPos - startPos;
        
        if (movedBy < -50) currentIndex += 1;
        else if (movedBy > 50) currentIndex -= 1;
        
        setPositionByIndex(true);
        startAutoPlay();
    };

    track.addEventListener('mousedown', dragStart);
    track.addEventListener('mousemove', dragMove);
    track.addEventListener('mouseup', dragEnd);
    track.addEventListener('mouseleave', () => { if (isDragging) dragEnd({ type: 'mouse', pageX: startPos }); });

    track.addEventListener('touchstart', dragStart, { passive: true });
    track.addEventListener('touchmove', dragMove, { passive: true });
    track.addEventListener('touchend', dragEnd);

    window.addEventListener('resize', () => {
        setTimeout(() => setPositionByIndex(false), 100);
    }, { passive: true });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            stopAutoPlay();
            currentIndex = totalOriginal + index;
            setPositionByIndex(true);
            startAutoPlay();
        });
    });

    const startAutoPlay = () => {
        stopAutoPlay();
        autoPlayInterval = setInterval(() => {
            currentIndex++;
            setPositionByIndex(true);
        }, 3000); 
    };

    const stopAutoPlay = () => clearInterval(autoPlayInterval);

    wrapper.addEventListener('mouseenter', stopAutoPlay);
    wrapper.addEventListener('mouseleave', startAutoPlay);

    currentIndex = totalOriginal;
    setPositionByIndex(false);
    startAutoPlay();
});