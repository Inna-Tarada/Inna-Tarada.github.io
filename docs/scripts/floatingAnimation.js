
export class FloatingAnimation {
    constructor() {
        this.enabled = true;
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.amplitude = this.isMobile ? 0.06 : 0.04;
        this.rotationAmplitude = this.isMobile ? 0.02 : 0.01;
        this.speed = this.isMobile ? 1.3 : 1;
        this.excludedNames = ['star', 'light', 'camera', 'Picture', 'HitBox'];
        
        this.animatedObjects = new Map();
        this.startTime = performance.now() / 1000;
        
        console.log('Floating Animation System initialized');
    }

    shouldExclude(obj) {
        if (!obj || !obj.name) return false;
        return this.excludedNames.some(pattern => 
            obj.name.toLowerCase().includes(pattern.toLowerCase())
        );
    }

    scanScene(scene) {
        if (!scene) return;
        
        console.log('Scanning scene for floating animation...');
        this.animatedObjects.clear();
        
        scene.children.forEach(child => {
            this.prepareRootObject(child);
        });

        console.log(`Floating animation: ${this.animatedObjects.size} root objects registered`);
    }

    prepareRootObject(obj) {
        if (!obj || !obj.isObject3D) return;

        if (obj.isLight || obj.isCamera || this.shouldExclude(obj)) {
            return;
        }

        let hasMeshes = false;
        obj.traverse(child => {
            if (child.isMesh) hasMeshes = true;
        });

        if (hasMeshes && !this.animatedObjects.has(obj)) {
            this.animatedObjects.set(obj, {
                originalY: obj.position.y,
                originalRotX: obj.rotation.x,
                originalRotY: obj.rotation.y,
                originalRotZ: obj.rotation.z,
                offset: Math.random() * Math.PI * 2,
            });
            console.log(`Added root object: ${obj.name || 'unnamed'}`);
        }
    }

    start() {
        this.enabled = true;
        this.startTime = performance.now() / 1000;
        console.log('Floating animation started');
    }

    stop() {
        this.enabled = false;
        
        this.animatedObjects.forEach((data, obj) => {
            if (obj && obj.position) {
                obj.position.y = data.originalY;
                obj.rotation.x = data.originalRotX;
                obj.rotation.y = data.originalRotY;
                obj.rotation.z = data.originalRotZ;
            }
        });
    }

    update(currentTime) {
        if (!this.enabled) return;

        const time = (currentTime / 1000 - this.startTime) * this.speed;
        
        this.animatedObjects.forEach((data, obj) => {
            if (!obj || !obj.position) return;

            try {
                const floatY = Math.sin(time + data.offset) * this.amplitude;
                obj.position.y = data.originalY + floatY;

                if (obj.rotation && this.rotationAmplitude > 0) {
                    obj.rotation.y = data.originalRotY + Math.sin(time * 0.3 + data.offset) * this.rotationAmplitude;
                }
            } catch (e) {
                this.animatedObjects.delete(obj);
            }
        });
    }

    addObject(obj) {
        this.prepareRootObject(obj);
    }

    removeObject(obj) {
        this.animatedObjects.delete(obj);
    }
}