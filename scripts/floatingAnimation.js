
(function() {

    if (typeof THREE === 'undefined') {
        console.warn('Three.js not found, floating animations disabled');
        return;
    }

    // Конфиг!
    const CONFIG = {
        enabled: true,
        amplitude: 0.05,      // How much they move up/down
        rotationAmplitude: 0.02, // How much they rotate
        speed: 0.5,            // Animation speed
        mobileMultiplier: 0.5, // Reduce effect on mobile
        excludedNames: ['star', 'HitBox'], // Objects to exclude by name pattern
    };

    const animatedObjects = new Map();
    let startTime = performance.now() / 1000;
    let animationFrame = null;
    let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    const amplitude = isMobile ? CONFIG.amplitude * CONFIG.mobileMultiplier : CONFIG.amplitude;
    const rotationAmplitude = isMobile ? CONFIG.rotationAmplitude * CONFIG.mobileMultiplier : CONFIG.rotationAmplitude;

    function shouldExclude(obj) {
        if (!obj || !obj.name) return false;
        
        // Check against excluded patterns
        return CONFIG.excludedNames.some(pattern => 
            obj.name.toLowerCase().includes(pattern.toLowerCase())
        );
    }

    function prepareObject(obj) {
        if (!obj || !obj.isObject3D) return;

        // If it's a mesh and not excluded
        if (obj.isMesh && !shouldExclude(obj)) {
            // Store original position and rotation
            animatedObjects.set(obj, {
                originalY: obj.position.y,
                originalRotX: obj.rotation.x,
                originalRotY: obj.rotation.y,
                originalRotZ: obj.rotation.z,
                offset: Math.random() * Math.PI * 2, // Random phase offset
            });
        }

        if (obj.children) {
            obj.children.forEach(child => prepareObject(child));
        }
    }

    function scanScene() {
        if (!window.scene) {
            console.warn('Scene not found, retrying in 1 second...');
            setTimeout(scanScene, 1000);
            return;
        }

        console.log('Scanning scene for floating animation objects...');
        
        animatedObjects.clear();
        
        window.scene.traverse(obj => {
            prepareObject(obj);
        });

        console.log(`Floating animation: ${animatedObjects.size} objects registered`);
    }

    function animate() {
        if (!CONFIG.enabled) return;

        const time = (performance.now() / 1000 - startTime) * CONFIG.speed;
        
        animatedObjects.forEach((data, obj) => {
            if (!obj || !obj.position) return;

            try {
                const floatY = Math.sin(time + data.offset) * amplitude;
                obj.position.y = data.originalY + floatY;

                if (obj.rotation) {
                    obj.rotation.x = data.originalRotX + Math.sin(time * 0.8 + data.offset) * rotationAmplitude * 0.5;
                    obj.rotation.y = data.originalRotY + Math.sin(time * 0.6 + data.offset * 2) * rotationAmplitude;
                    obj.rotation.z = data.originalRotZ + Math.sin(time * 0.7 + data.offset * 1.5) * rotationAmplitude * 0.3;
                }
            } catch (e) {
                animatedObjects.delete(obj);
            }
        });

        animationFrame = requestAnimationFrame(animate);
    }

    function startFloating() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        
        startTime = performance.now() / 1000;
        animate();
        console.log('Floating animations started');
    }

    function stopFloating() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        
        animatedObjects.forEach((data, obj) => {
            if (obj && obj.position) {
                obj.position.y = data.originalY;
                obj.rotation.x = data.originalRotX;
                obj.rotation.y = data.originalRotY;
                obj.rotation.z = data.originalRotZ;
            }
        });
    }

    function addObject(obj) {
        prepareObject(obj);
    }

    function removeObject(obj) {
        animatedObjects.delete(obj);
    }

    function updateConfig(newConfig) {
        Object.assign(CONFIG, newConfig);
    }

    function init() {
        if (!window.scene) {
            const sceneCheck = setInterval(() => {
                if (window.scene) {
                    clearInterval(sceneCheck);
                    scanScene();
                    startFloating();
                }
            }, 500);
            
            setTimeout(() => {
                clearInterval(sceneCheck);
                if (!window.scene) {
                    console.warn('Scene not found after 10 seconds, floating animations disabled');
                }
            }, 10000);
        } else {
            scanScene();
            startFloating();
        }
    }

    window.FloatingAnimation = {
        start: startFloating,
        stop: stopFloating,
        add: addObject,
        remove: removeObject,
        rescan: scanScene,
        updateConfig: updateConfig,
        getCount: () => animatedObjects.size,
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    const originalLoadModel = window.loadModel;
    if (originalLoadModel) {
        console.log('Patching loadModel for auto-rescan');
    }

    document.addEventListener('modelsLoaded', () => {
        console.log('Models loaded event received, rescanning...');
        setTimeout(() => {
            window.FloatingAnimation?.rescan();
        }, 500);
    });

})();