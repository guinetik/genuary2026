import { GameObject, Painter, zoneTemperature, thermalBuoyancy } from '@guinetik/gcanvas';
import { TAU, CONFIG } from './day25.config.js';
import { ATOMS, MOLECULES } from './day25.chemistry.js';

/**
 * Molecule3D - A molecule composed of Atom3D children
 * Handles molecular rotation, movement, and thermal physics
 * @extends GameObject
 */
export class Molecule3D extends GameObject {
    /**
     * @param {Game} game - Game instance
     * @param {string} templateKey - Key into MOLECULES dictionary
     * @param {Object} options - Position options
     */
    constructor(game, templateKey, options = {}) {
        super(game, options);

        this.templateKey = templateKey;
        this.template = MOLECULES[templateKey];
        this.name = this.template.name;
        this.label = this.template.label;
        this.tier = this.template.tier;

        // 3D position (in world space)
        this.x = options.x ?? 0;
        this.y = options.y ?? 0;
        this.z = options.z ?? 0;

        // Velocity
        this.vx = (Math.random() - 0.5) * CONFIG.baseSpeed;
        this.vy = (Math.random() - 0.5) * CONFIG.baseSpeed;
        this.vz = (Math.random() - 0.5) * CONFIG.baseSpeed;

        // Temperature: 0 = cold, 1 = hot
        this.temperature = 0.5;
        this.reactionCooldown = 0;
        this.flash = 0; // Visual flash on reaction

        // Molecular rotation - moderate tumble like in fluid
        this.rotX = Math.random() * TAU;
        this.rotY = Math.random() * TAU;
        this.rotZ = Math.random() * TAU;
        this.rotSpeedX = (Math.random() - 0.5) * 0.15;
        this.rotSpeedY = (Math.random() - 0.5) * 0.15;
        this.rotSpeedZ = (Math.random() - 0.5) * 0.10;

        // Turbulence phase offsets for organic movement
        this.turbulencePhase = Math.random() * Math.PI * 2;

        // Store atom data for rendering
        this.atomData = this.template.atoms.map((a) => ({
            element: a.element,
            localX: a.x,
            localY: a.y,
            localZ: a.z,
            props: ATOMS[a.element],
            screenX: 0,
            screenY: 0,
            screenScale: 1,
            worldZ: 0,
        }));

        this.bonds = this.template.bonds;

        // Calculate bounding radius
        let maxDist = 0;
        for (const a of this.atomData) {
            const dist = Math.sqrt(a.localX ** 2 + a.localY ** 2 + a.localZ ** 2);
            maxDist = Math.max(maxDist, dist + a.props.radius);
        }
        this.boundingRadius = maxDist;
    }

    /**
     * Update molecule physics and state
     * @param {number} dt - Delta time
     */
    update(dt) {
        super.update(dt);

        const demo = this.game;
        const halfHeight = demo.worldHeight / 2;
        const time = demo.totalTime;

        // Normalized Y for temperature zones (0 = top/cold, 1 = bottom/hot)
        const normalizedY = (this.y + halfHeight) / demo.worldHeight;

        // === TEMPERATURE ZONE ===
        this.temperature = zoneTemperature(
            Math.max(0, Math.min(1, normalizedY)),
            this.temperature,
            {
                heatZone: CONFIG.heatZone,
                coolZone: CONFIG.coolZone,
                rate: CONFIG.heatRate,
            }
        );

        // === THERMAL BUOYANCY (dramatic vertical movement) ===
        // Hot molecules rise strongly, cold sink strongly
        const buoyancy = thermalBuoyancy(
            this.temperature,
            CONFIG.neutralTemp,
            CONFIG.buoyancyStrength
        );
        this.vy -= buoyancy * dt;

        // === OCEAN CURRENTS (wavy horizontal drift) ===
        // Slow sinusoidal drift that varies with depth and time
        // This brings molecules together for reactions
        const driftPhase = time * 0.3 + normalizedY * 2.5 + this.turbulencePhase;
        const driftStrength = CONFIG.convectionCurrentX * (0.6 + this.temperature * 0.4);
        this.vx += Math.sin(driftPhase) * driftStrength * dt;

        // Z-axis convection for 3D ocean mixing
        const zDriftPhase = time * 0.2 + normalizedY * 1.8 + this.turbulencePhase + 1.5;
        const zDriftStrength = CONFIG.convectionZ * (0.5 + this.temperature * 0.5);
        this.vz += Math.sin(zDriftPhase) * zDriftStrength * dt;

        // === TURBULENCE (organic random jitter) ===
        // Phase-shifted noise for each molecule - adds organic feel
        const turbPhase = this.turbulencePhase + time;
        const turbStrength = CONFIG.convectionTurbulence * (0.4 + this.temperature * 0.3);
        this.vx += Math.sin(turbPhase * 1.3) * turbStrength * dt;
        this.vy += Math.sin(turbPhase * 1.7 + 1.5) * turbStrength * 0.3 * dt;
        this.vz += Math.sin(turbPhase * 1.1 + 3.0) * turbStrength * 0.8 * dt;

        // === BROWNIAN MOTION (random molecular kicks) ===
        // Like real water molecules bumping into our molecules
        const brownian = CONFIG.brownianStrength;
        this.vx += (Math.random() - 0.5) * brownian * dt * 60;
        this.vy += (Math.random() - 0.5) * brownian * dt * 60;
        this.vz += (Math.random() - 0.5) * brownian * dt * 60;

        // === DAMPING ===
        const dampFactor = Math.pow(CONFIG.damping, dt * 60);
        this.vx *= dampFactor;
        this.vy *= dampFactor;
        this.vz *= dampFactor;

        // === UPDATE POSITION ===
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.z += this.vz * dt;

        // === TUMBLE (moderate rotation coupled to motion) ===
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy + this.vz * this.vz);
        // Moderate tumble intensity
        const tumbleIntensity = 0.025 + Math.min(speed * 0.002, 0.04);

        // Cross-axis rotation creates "rolling through fluid" effect
        this.rotX += (this.vy * 0.005 + this.rotSpeedX) * tumbleIntensity * dt * 60;
        this.rotY += (this.vx * 0.005 + this.rotSpeedY) * tumbleIntensity * dt * 60;
        this.rotZ += (this.vz * 0.004 + this.rotSpeedZ) * tumbleIntensity * dt * 60;

        // Dampen rotation speeds
        this.rotSpeedX *= 0.985;
        this.rotSpeedY *= 0.985;
        this.rotSpeedZ *= 0.985;

        // Clamp rotation speeds
        const maxRotSpeed = 0.25;
        this.rotSpeedX = Math.max(-maxRotSpeed, Math.min(maxRotSpeed, this.rotSpeedX));
        this.rotSpeedY = Math.max(-maxRotSpeed, Math.min(maxRotSpeed, this.rotSpeedY));
        this.rotSpeedZ = Math.max(-maxRotSpeed, Math.min(maxRotSpeed, this.rotSpeedZ));

        // Decay cooldown and flash
        if (this.reactionCooldown > 0) this.reactionCooldown -= dt;
        if (this.flash > 0) this.flash -= dt * 0.5; // Slow fade (~2 sec for full)
    }

    /**
     * Project atoms through camera and render
     * @param {number} cx - Screen center X
     * @param {number} cy - Screen center Y
     */
    render(cx, cy) {
        if (!this.visible) return;

        const ctx = Painter.ctx;
        const camera = this.game.camera;

        // Pre-compute rotation matrices
        const cosX = Math.cos(this.rotX),
            sinX = Math.sin(this.rotX);
        const cosY = Math.cos(this.rotY),
            sinY = Math.sin(this.rotY);
        const cosZ = Math.cos(this.rotZ),
            sinZ = Math.sin(this.rotZ);

        // Project each atom
        for (const atom of this.atomData) {
            let x = atom.localX,
                y = atom.localY,
                z = atom.localZ;

            // Rotate X
            let ty = y * cosX - z * sinX;
            let tz = y * sinX + z * cosX;
            y = ty;
            z = tz;

            // Rotate Y
            let tx = x * cosY + z * sinY;
            tz = -x * sinY + z * cosY;
            x = tx;
            z = tz;

            // Rotate Z
            tx = x * cosZ - y * sinZ;
            ty = x * sinZ + y * cosZ;
            x = tx;
            y = ty;

            // World position
            const worldX = this.x + x;
            const worldY = this.y + y;
            const worldZ = this.z + z;

            const proj = camera.project(worldX, worldY, worldZ);
            atom.screenX = cx + proj.x;
            atom.screenY = cy + proj.y;
            atom.screenScale = proj.scale;
            atom.worldZ = proj.z;
        }

        // Sort atoms by depth for rendering
        const sortedAtoms = [...this.atomData].sort((a, b) => a.worldZ - b.worldZ);

        // Render bonds first (behind atoms)
        this._renderBonds(ctx);

        // Render atoms
        for (const atom of sortedAtoms) {
            this._renderAtom(ctx, atom);
        }
    }

    /**
     * Render bonds between atoms
     * @param {CanvasRenderingContext2D} ctx
     * @private
     */
    _renderBonds(ctx) {
        for (const bond of this.bonds) {
            const a1 = this.atomData[bond.from];
            const a2 = this.atomData[bond.to];
            if (a1.screenScale <= 0 || a2.screenScale <= 0) continue;

            const avgScale = (a1.screenScale + a2.screenScale) / 2;

            // Depth affects lightness
            const avgZ = (a1.worldZ + a2.worldZ) / 2;
            const clamp = CONFIG.bondDepthClamp;
            const depthLightMod = Math.max(-clamp, Math.min(clamp, avgZ / CONFIG.bondDepthDivisor));

            // Temperature affects bond color - green spectrum
            const tempHue = Math.round(CONFIG.hueBase + (this.temperature - 0.5) * CONFIG.hueRange);
            const bondLight = Math.round(CONFIG.bondBaseLightness + depthLightMod + this.temperature * CONFIG.bondTempLightMult);
            const bondSat = Math.round(CONFIG.bondBaseSaturation + this.temperature * CONFIG.bondTempSatMult);
            ctx.strokeStyle = `hsl(${tempHue}, ${bondSat}%, ${bondLight}%)`;
            ctx.lineWidth = CONFIG.bondSingleWidth * avgScale;
            ctx.lineCap = 'round';

            if (bond.order === 1) {
                ctx.beginPath();
                ctx.moveTo(a1.screenX, a1.screenY);
                ctx.lineTo(a2.screenX, a2.screenY);
                ctx.stroke();
            } else if (bond.order >= 2) {
                const dx = a2.screenX - a1.screenX;
                const dy = a2.screenY - a1.screenY;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const gap = CONFIG.bondMultiGap * avgScale;
                const nx = (-dy / len) * gap;
                const ny = (dx / len) * gap;

                ctx.lineWidth = CONFIG.bondMultiWidth * avgScale;
                for (let i = 0; i < bond.order; i++) {
                    const offset = i - (bond.order - 1) / 2;
                    ctx.beginPath();
                    ctx.moveTo(a1.screenX + nx * offset, a1.screenY + ny * offset);
                    ctx.lineTo(a2.screenX + nx * offset, a2.screenY + ny * offset);
                    ctx.stroke();
                }
            }
        }
    }

    /**
     * Render a single atom with gradient
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} atom - Atom data
     * @private
     */
    _renderAtom(ctx, atom) {
        if (atom.screenScale <= 0) return;

        const props = atom.props;
        const radius = props.radius * atom.screenScale;

        // Depth affects lightness
        const depthLightMod = Math.max(
            CONFIG.atomDepthClampMin,
            Math.min(CONFIG.atomDepthClampMax, atom.worldZ / CONFIG.atomDepthDivisor)
        );

        // Temperature affects lightness (hot = brighter, cold = darker)
        const tempLight = (this.temperature - 0.5) * CONFIG.atomTempLightMult;
        const hue = props.hue;
        const sat = props.sat;
        const light = Math.round(Math.max(
            CONFIG.atomLightMin,
            Math.min(CONFIG.atomLightMax, props.light + depthLightMod + tempLight)
        ));

        // Atom sphere with terminal-style gradient
        const offset = CONFIG.atomHighlightOffset;
        const grad = ctx.createRadialGradient(
            atom.screenX - radius * offset,
            atom.screenY - radius * offset,
            0,
            atom.screenX,
            atom.screenY,
            radius
        );

        // Gradient stops for 3D shading
        const stops = CONFIG.atomGradientStops;
        const sat1 = Math.round(Math.min(sat + CONFIG.atomHighlightSatBoost, 100));
        const light1 = Math.round(Math.min(light + CONFIG.atomHighlightLightBoost, CONFIG.atomLightMax));
        const light2 = Math.round(Math.max(light - CONFIG.atomMidLightDrop, CONFIG.atomLightMin));
        const sat2 = Math.round(Math.min(sat + CONFIG.atomEdgeSatBoost, 100));
        const light3 = Math.round(Math.max(light - CONFIG.atomEdgeLightDrop, 10));

        grad.addColorStop(stops[0], `hsl(${hue}, ${sat1}%, ${light1}%)`);
        grad.addColorStop(stops[1], `hsl(${hue}, ${sat}%, ${light}%)`);
        grad.addColorStop(stops[2], `hsl(${hue}, ${sat}%, ${light2}%)`);
        grad.addColorStop(stops[3], `hsl(${hue}, ${sat2}%, ${light3}%)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(atom.screenX, atom.screenY, radius, 0, TAU);
        ctx.fill();

        // Reaction effect - green outline that fades
        if (this.flash > 0) {
            const [r, g, b] = CONFIG.flashColor;
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, this.flash * CONFIG.flashAlphaMult)})`;
            ctx.lineWidth = CONFIG.flashWidthBase * atom.screenScale * (CONFIG.flashWidthMin + this.flash * CONFIG.flashWidthRange);
            ctx.stroke();
        } else {
            // Normal subtle outline for definition
            ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${CONFIG.atomOutlineAlpha})`;
            ctx.lineWidth = CONFIG.atomOutlineWidth;
            ctx.stroke();
        }
    }

    /**
     * Get bounds for Scene3D depth sorting
     * @returns {Object}
     */
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.boundingRadius * 2,
            height: this.boundingRadius * 2,
        };
    }
}
