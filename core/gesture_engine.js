class GestureEngine {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.isScrolling = false;
        this.velocityX = 0;
        this.velocityY = 0;
        this.lastTouchX = 0;
        this.lastTouchY = 0;
        this.lastTouchTime = 0;
        this.minSwipeDistance = 50;
        this.swipeVelocityThreshold = 0.3;
        this.eventBus = new EventTarget();
        this.setupTouchHandlers();
        this.suppressDefaultBehaviors();
    }

    suppressDefaultBehaviors() {
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });
        document.addEventListener('wheel', (e) => {
            if (e.ctrlKey) e.preventDefault();
        }, { passive: false });
    }

    setupTouchHandlers() {
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    }

    handleTouchStart(event) {
        if (event.touches.length !== 1) return;
        
        const touch = event.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;
        this.lastTouchTime = Date.now();
        this.isScrolling = false;
        this.velocityX = 0;
        this.velocityY = 0;
    }

    handleTouchMove(event) {
        if (event.touches.length !== 1) return;
        
        const touch = event.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        const timeDelta = Date.now() - this.lastTouchTime;

        if (timeDelta > 0) {
            this.velocityX = (touch.clientX - this.lastTouchX) / timeDelta;
            this.velocityY = (touch.clientY - this.lastTouchY) / timeDelta;
        }

        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;
        this.lastTouchTime = Date.now();

        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (absDeltaX > this.minSwipeDistance || absDeltaY > this.minSwipeDistance) {
            this.isScrolling = true;
        }

        this.emitGestureEvent('gesture:move', {
            deltaX,
            deltaY,
            velocityX: this.velocityX,
            velocityY: this.velocityY,
            touched: true,
        });
    }

    handleTouchEnd(event) {
        const deltaX = this.lastTouchX - this.touchStartX;
        const deltaY = this.lastTouchY - this.touchStartY;
        const timeDelta = Date.now() - this.touchStartTime;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const speed = distance / (timeDelta || 1);

        if (this.isScrolling && speed > this.swipeVelocityThreshold) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > this.minSwipeDistance) {
                    this.emitGestureEvent('gesture:swipe-right', { velocity: this.velocityX, distance: deltaX });
                } else if (deltaX < -this.minSwipeDistance) {
                    this.emitGestureEvent('gesture:swipe-left', { velocity: this.velocityX, distance: deltaX });
                }
            } else {
                if (deltaY < -this.minSwipeDistance && this.touchStartY < window.innerHeight * 0.3) {
                    this.emitGestureEvent('gesture:swipe-up-from-top', { velocity: this.velocityY, distance: deltaY });
                    event.preventDefault();
                } else if (deltaY > this.minSwipeDistance && this.touchStartY < window.innerHeight * 0.2) {
                    this.emitGestureEvent('gesture:swipe-down-from-top', { velocity: this.velocityY, distance: deltaY });
                    event.preventDefault();
                } else if (deltaY > this.minSwipeDistance && this.touchStartY > window.innerHeight * 0.8) {
                    this.emitGestureEvent('gesture:swipe-up-from-bottom', { velocity: this.velocityY, distance: deltaY });
                    event.preventDefault();
                } else if (deltaY < -this.minSwipeDistance && this.touchStartY > window.innerHeight * 0.8) {
                    this.emitGestureEvent('gesture:swipe-down-from-bottom', { velocity: this.velocityY, distance: deltaY });
                    event.preventDefault();
                }
            }
        } else if (timeDelta < 300 && distance < 30) {
            this.emitGestureEvent('gesture:tap', {
                x: this.touchStartX,
                y: this.touchStartY,
                target: event.target,
            });
        }

        this.isScrolling = false;
    }

    emitGestureEvent(eventType, data) {
        const event = new CustomEvent(eventType, { detail: data });
        this.eventBus.dispatchEvent(event);
    }

    onGesture(eventType, callback) {
        this.eventBus.addEventListener(eventType, (e) => callback(e.detail));
    }

    simulateKineticScroll(element, velocityY) {
        let currentVelocity = velocityY;
        const friction = 0.95;
        const minVelocity = 0.001;

        const animate = () => {
            if (Math.abs(currentVelocity) < minVelocity) return;

            element.scrollTop -= currentVelocity * 10;
            currentVelocity *= friction;
            requestAnimationFrame(animate);
        };

        animate();
    }
}

const gestureEngine = new GestureEngine();
