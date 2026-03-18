// PayBackPal - Animations & Visual Effects Module v2.1
// =====================================================
// Polished: fixed haptic transform conflict, negative opacity bug,
// missing keyframes, and added smooth page transitions.

const animations = {

    // ── Toast: Success ────────────────────────────────
    showSuccessToast(message) {
        this._showToast(message, 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)');
    },

    // ── Toast: Error ──────────────────────────────────
    showErrorToast(message) {
        this._showToast(message, 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', true);
    },

    // ── Toast: Internal ───────────────────────────────
    _showToast(message, background, shake = false) {
        const container = document.getElementById('toast-container');
        const target = container || document.body;

        const toast = document.createElement('div');
        toast.style.cssText = `
            position: ${container ? 'relative' : 'fixed'};
            ${!container ? 'top: 20px; left: 50%; transform: translateX(-50%);' : ''}
            background: ${background};
            color: white;
            padding: 14px 22px;
            border-radius: 14px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.22);
            z-index: 10000;
            font-weight: 600;
            font-size: 14px;
            font-family: var(--font-family);
            animation: toastSlideDown 0.32s cubic-bezier(0.34,1.56,0.64,1) both;
            max-width: 90%;
            pointer-events: auto;
            ${shake ? 'animation: toastSlideDown 0.32s cubic-bezier(0.34,1.56,0.64,1) both, toastShake 0.5s 0.3s ease-in-out;' : ''}
        `;
        toast.textContent = message;
        target.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideUp 0.25s ease-in forwards';
            setTimeout(() => toast.remove(), 250);
        }, 3000);
    },

    // ── Confetti ──────────────────────────────────────
    showConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;

        canvas.style.display = 'block';
        const ctx = canvas.getContext('2d');
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ['#14b8a6','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6'];
        const confetti = Array.from({ length: 120 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            radius: Math.random() * 6 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            velocity: Math.random() * 3 + 1.5,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 8 - 4,
            wobble: Math.random() * Math.PI * 2,
        }));

        let animId;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = confetti.length - 1; i >= 0; i--) {
                const p = confetti[i];
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.radius / 2, -p.radius / 2, p.radius, p.radius * 0.5);
                ctx.restore();
                p.y += p.velocity;
                p.x += Math.sin(p.wobble) * 1.2;
                p.wobble += 0.05;
                p.rotation += p.rotationSpeed;
                if (p.y > canvas.height) confetti.splice(i, 1);
            }
            if (confetti.length > 0) {
                animId = requestAnimationFrame(animate);
            } else {
                canvas.style.display = 'none';
                cancelAnimationFrame(animId);
            }
        };
        animate();
    },

    // ── Ripple (event delegation) ─────────────────────
    createRipple(event) {
        const button = event.currentTarget || event.target.closest('.ripple');
        if (!button) return;
        const ripple = document.createElement('span');
        const rect   = button.getBoundingClientRect();
        const size   = Math.max(rect.width, rect.height) * 2;
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top  - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px; height: ${size}px;
            border-radius: 50%;
            background: rgba(255,255,255,0.3);
            left: ${x}px; top: ${y}px;
            transform: scale(0);
            animation: rippleEffect 0.55s ease-out forwards;
            pointer-events: none;
        `;
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 560);
    },

    // ── Element animations ────────────────────────────
    bounceElement(element) {
        if (!element) return;
        element.style.animation = 'none';
        requestAnimationFrame(() => {
            element.style.animation = 'bounce 0.5s ease-in-out';
        });
        setTimeout(() => element.style.animation = '', 520);
    },

    pulseElement(element) {
        if (!element) return;
        element.style.animation = 'none';
        requestAnimationFrame(() => {
            element.style.animation = 'pulse 1s ease-in-out';
        });
        setTimeout(() => element.style.animation = '', 1020);
    },

    shakeElement(element) {
        if (!element) return;
        element.style.animation = 'none';
        requestAnimationFrame(() => {
            element.style.animation = 'toastShake 0.5s ease-in-out';
        });
        setTimeout(() => element.style.animation = '', 520);
    },

    // ── Fade in ───────────────────────────────────────
    fadeIn(element, duration = 280) {
        if (!element) return;
        element.style.opacity = '0';
        element.style.display = 'block';
        element.style.transition = `opacity ${duration}ms ease`;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                element.style.opacity = '1';
            });
        });
        setTimeout(() => element.style.transition = '', duration + 20);
    },

    // ── Fade out ──────────────────────────────────────
    fadeOut(element, duration = 280) {
        if (!element) return;
        const opacity = parseFloat(window.getComputedStyle(element).opacity) || 1;
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.display = 'none';
            element.style.transition = '';
            element.style.opacity = String(opacity);
        }, duration + 10);
    },

    // ── Slide in from bottom ──────────────────────────
    slideInFromBottom(element, duration = 300) {
        if (!element) return;
        element.style.display  = 'block';
        element.style.transform = 'translateY(100%)';
        element.style.transition = `transform ${duration}ms cubic-bezier(0.4,0,0.2,1)`;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                element.style.transform = 'translateY(0)';
            });
        });
        setTimeout(() => {
            element.style.transition = '';
        }, duration + 10);
    },

    // ── Screen transition ─────────────────────────────
    transitionScreen(fromId, toId, direction = 'forward') {
        const from = document.getElementById(fromId);
        const to   = document.getElementById(toId);
        if (!from || !to) return;

        const xIn  = direction === 'forward' ? '100%' : '-30%';
        const xOut = direction === 'forward' ? '-30%' : '100%';

        to.style.display    = 'flex';
        to.style.transform  = `translateX(${xIn})`;
        to.style.transition = 'transform 0.3s cubic-bezier(0.4,0,0.2,1)';
        from.style.transition = 'transform 0.3s cubic-bezier(0.4,0,0.2,1)';

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                to.style.transform   = 'translateX(0)';
                from.style.transform = `translateX(${xOut})`;
            });
        });

        setTimeout(() => {
            from.style.display    = 'none';
            from.style.transform  = '';
            from.style.transition = '';
            to.style.transition   = '';
        }, 320);
    },

    // ── Loading spinner ───────────────────────────────
    showLoading(container) {
        if (!container) return;
        container.innerHTML = `
            <div style="display:flex;justify-content:center;align-items:center;padding:48px;">
                <div class="spinner" style="border-top-color:var(--primary);border-color:var(--border-color);width:28px;height:28px;border-width:3px;"></div>
            </div>`;
    },

    // ── Card entrance stagger ─────────────────────────
    animateCards(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const cards = container.querySelectorAll('.card, .group-card, .expense-card, .notif-item');
        cards.forEach((card, i) => {
            card.style.opacity   = '0';
            card.style.transform = 'translateY(16px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.28s ease-out, transform 0.28s ease-out';
                card.style.opacity    = '1';
                card.style.transform  = 'translateY(0)';
            }, i * 80);
            setTimeout(() => {
                card.style.transition = '';
            }, i * 80 + 300);
        });
    },

    // ── Number counter ────────────────────────────────
    animateCounter(element, target, duration = 900) {
        if (!element) return;
        const startTime = performance.now();
        const update = (now) => {
            const elapsed  = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased    = 1 - Math.pow(1 - progress, 4);
            const current  = target * eased;
            element.textContent = '₨' + current.toFixed(2);
            if (progress < 1) requestAnimationFrame(update);
            else element.textContent = '₨' + target.toFixed(2);
        };
        requestAnimationFrame(update);
    },

    // ── Progress bar ──────────────────────────────────
    animateProgress(element, targetWidth, duration = 500) {
        if (!element) return;
        element.style.width = '0%';
        element.style.transition = `width ${duration}ms cubic-bezier(0.4,0,0.2,1)`;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                element.style.width = targetWidth + '%';
            });
        });
    },

    // ── Swipe gesture ─────────────────────────────────
    setupSwipeGesture(element, onSwipeLeft, onSwipeRight) {
        if (!element) return;
        let startX = 0, startY = 0;

        element.addEventListener('touchstart', (e) => {
            startX = e.changedTouches[0].screenX;
            startY = e.changedTouches[0].screenY;
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].screenX - startX;
            const dy = e.changedTouches[0].screenY - startY;
            // Only fire if horizontal swipe is dominant
            if (Math.abs(dx) < Math.abs(dy) * 1.5) return;
            if (dx < -50 && onSwipeLeft)  onSwipeLeft();
            if (dx >  50 && onSwipeRight) onSwipeRight();
        }, { passive: true });
    },

    // ── Haptic (visual scale feedback) ───────────────
    // FIX: preserves existing transform instead of overwriting it
    simulateHaptic(element) {
        if (!element) return;
        const existing = element.style.transform.replace(/scale\([^)]*\)/g, '').trim();
        element.style.transform = `${existing} scale(0.94)`.trim();
        element.style.transition = 'transform 0.08s ease';
        setTimeout(() => {
            element.style.transform = existing || '';
            setTimeout(() => element.style.transition = '', 120);
        }, 90);
    },

    // ── Page entrance animation ───────────────────────
    animatePageEntrance(screenId) {
        const screen = document.getElementById(screenId);
        if (!screen) return;
        screen.style.opacity   = '0';
        screen.style.transform = 'translateY(12px)';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                screen.style.transition = 'opacity 0.28s ease-out, transform 0.28s ease-out';
                screen.style.opacity    = '1';
                screen.style.transform  = 'translateY(0)';
            });
        });
        setTimeout(() => {
            screen.style.transition = '';
            screen.style.opacity    = '';
            screen.style.transform  = '';
        }, 310);
    },

    // ── Init ──────────────────────────────────────────
    init() {
        // Ripple on .ripple elements
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.ripple');
            if (btn) {
                // Ensure overflow hidden for ripple to be clipped
                if (getComputedStyle(btn).overflow === 'visible') {
                    btn.style.overflow = 'hidden';
                }
                this.createRipple({ ...e, currentTarget: btn });
            }
        });

        // Haptic on buttons (non-nav, non-icon)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('button:not(.nav-item):not(.nav-fab)');
            if (btn) this.simulateHaptic(btn);
        });

        // Inject all keyframes
        this._injectKeyframes();
    },

    _injectKeyframes() {
        if (document.getElementById('paybackpal-keyframes')) return;
        const style = document.createElement('style');
        style.id = 'paybackpal-keyframes';
        style.textContent = `
            @keyframes toastSlideDown {
                from { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.95); }
                to   { opacity: 1; transform: translateX(-50%) translateY(0)  scale(1); }
            }
            @keyframes toastSlideUp {
                from { opacity: 1; transform: translateX(-50%) translateY(0)  scale(1); }
                to   { opacity: 0; transform: translateX(-50%) translateY(-16px) scale(0.95); }
            }
            @keyframes toastShake {
                0%, 100% { transform: translateX(-50%) translateX(0); }
                20%       { transform: translateX(calc(-50% + 8px)); }
                40%       { transform: translateX(calc(-50% - 8px)); }
                60%       { transform: translateX(calc(-50% + 5px)); }
                80%       { transform: translateX(calc(-50% - 5px)); }
            }
            @keyframes rippleEffect {
                to { transform: scale(1); opacity: 0; }
            }
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                30%       { transform: translateY(-10px); }
                60%       { transform: translateY(-4px); }
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50%       { transform: scale(1.06); }
            }
            @keyframes shimmer {
                0%   { background-position: -200% center; }
                100% { background-position:  200% center; }
            }
            @keyframes floatUp {
                from { opacity: 0; transform: translateY(20px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes popIn {
                0%   { transform: scale(0.8);  opacity: 0; }
                65%  { transform: scale(1.05); opacity: 1; }
                100% { transform: scale(1);    opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    },
};

// Boot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => animations.init());
} else {
    animations.init();
}