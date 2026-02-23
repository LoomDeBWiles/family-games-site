// Collision detection utilities

const Collision = {
    // Check circle-circle collision
    circleCircle(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < r1 + r2;
    },

    // Check point-circle collision
    pointCircle(px, py, cx, cy, r) {
        const dx = px - cx;
        const dy = py - cy;
        return Math.sqrt(dx * dx + dy * dy) < r;
    },

    // Check rectangle-rectangle collision
    rectRect(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 &&
               x1 + w1 > x2 &&
               y1 < y2 + h2 &&
               y1 + h1 > y2;
    },

    // Check circle-rectangle collision
    circleRect(cx, cy, r, rx, ry, rw, rh) {
        // Find the closest point on the rectangle to the circle
        const closestX = Math.max(rx, Math.min(cx, rx + rw));
        const closestY = Math.max(ry, Math.min(cy, ry + rh));

        // Check if the closest point is inside the circle
        const dx = cx - closestX;
        const dy = cy - closestY;
        return (dx * dx + dy * dy) < (r * r);
    },

    // Get distance between two points
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // Get angle between two points
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    // Normalize a vector
    normalize(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: x / length, y: y / length };
    },

    // Check if attack arc hits target
    arcHit(attackerX, attackerY, attackAngle, arcWidth, range, targetX, targetY, targetRadius) {
        // Check distance first
        const dist = this.distance(attackerX, attackerY, targetX, targetY);
        if (dist > range + targetRadius) return false;

        // Check angle
        const angleToTarget = this.angle(attackerX, attackerY, targetX, targetY);
        let angleDiff = angleToTarget - attackAngle;

        // Normalize angle difference to -PI to PI
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        return Math.abs(angleDiff) < arcWidth / 2;
    }
};
