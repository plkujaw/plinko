import React, { useEffect, useRef, useState } from 'react';
import GameControls from './GameControls';

// Base dimensions for calculations
const BASE_PIN_RADIUS = 5;
const BASE_BALL_RADIUS = 10;
const BASE_PIN_SPACING = 40;
const BASE_ROW_SPACING = 40;
const BASE_SLOT_HEIGHT = 30;
const BASE_START_Y = 70;
const BOUNDARY_OFFSET = 0.2;

// Game constants
const GRAVITY = 0.2;
const PIN_BOUNCE_DAMPING = 0.7;
const TOP_ROW_PINS = 3;
const PIN_ROWS = 15;
const BOTTOM_ROW_PINS = TOP_ROW_PINS + PIN_ROWS - 1;

// Calculate dimensions based on pin layout
const GAME_WIDTH = Math.max((BOTTOM_ROW_PINS - 1) * BASE_PIN_SPACING, (TOP_ROW_PINS - 1) * BASE_PIN_SPACING);
const CANVAS_WIDTH = GAME_WIDTH * (1 + BOUNDARY_OFFSET * 2);
const CANVAS_HEIGHT = BASE_START_Y + PIN_ROWS * BASE_ROW_SPACING + BASE_SLOT_HEIGHT;

// Calculate boundary points to match triangle shape with vertical top section
const LEFT_BOUNDARY = [
  { x: CANVAS_WIDTH / 2 - ((TOP_ROW_PINS - 1) * BASE_PIN_SPACING) / 2 - BASE_PIN_SPACING / 2, y: 0 },
  { x: CANVAS_WIDTH / 2 - ((TOP_ROW_PINS - 1) * BASE_PIN_SPACING) / 2 - BASE_PIN_SPACING / 2, y: BASE_START_Y },
  {
    x: CANVAS_WIDTH / 2 - ((BOTTOM_ROW_PINS - 1) * BASE_PIN_SPACING) / 2 - BASE_PIN_SPACING / 2,
    y: BASE_START_Y + (PIN_ROWS - 1) * BASE_ROW_SPACING,
  },
];
const RIGHT_BOUNDARY = [
  { x: CANVAS_WIDTH / 2 + ((TOP_ROW_PINS - 1) * BASE_PIN_SPACING) / 2 + BASE_PIN_SPACING / 2, y: 0 },
  { x: CANVAS_WIDTH / 2 + ((TOP_ROW_PINS - 1) * BASE_PIN_SPACING) / 2 + BASE_PIN_SPACING / 2, y: BASE_START_Y },
  {
    x: CANVAS_WIDTH / 2 + ((BOTTOM_ROW_PINS - 1) * BASE_PIN_SPACING) / 2 + BASE_PIN_SPACING / 2,
    y: BASE_START_Y + (PIN_ROWS - 1) * BASE_ROW_SPACING,
  },
];

// Number of slots should match the number of gaps between pins in the bottom row
const SLOTS = Array(BOTTOM_ROW_PINS - 1).fill(null).map((_, index, arr) => {
  const position = index / (arr.length - 1); // 0 to 1
  let multiplier;
  let color;

  if (position <= 0.1 || position >= 0.9) {
    multiplier = 20;
    color = '#e74c3c'; // Red
  } else if (position <= 0.25 || position >= 0.75) {
    multiplier = 10;
    color = '#e67e22'; // Orange
  } else if (position <= 0.35 || position >= 0.65) {
    multiplier = 5;
    color = '#e67e22'; // Orange
  } else if (position <= 0.4 || position >= 0.6) {
    multiplier = 3;
    color = '#f1c40f'; // Yellow
  } else if (position <= 0.45 || position >= 0.55) {
    multiplier = 2;
    color = '#f1c40f'; // Yellow
  } else if (position <= 0.475 || position >= 0.525) {
    multiplier = 1.5;
    color = '#f1c40f'; // Yellow
  } else {
    multiplier = 1;
    color = '#f1c40f'; // Yellow
  }

  return { multiplier, color };
});

const SLOT_GLOW_DURATION = 1000; // ms
const activeSlots = new Set();

function drawPin(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, BASE_PIN_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#FFD700';
  ctx.fill();
  ctx.closePath();
}

function drawBall(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, BASE_BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#FF4444';
  ctx.fill();
  ctx.closePath();
}

function drawBoundaries(ctx) {
  // Draw left boundary - only the angled part
  ctx.beginPath();
  ctx.moveTo(LEFT_BOUNDARY[1].x, LEFT_BOUNDARY[1].y);
  ctx.lineTo(LEFT_BOUNDARY[2].x, LEFT_BOUNDARY[2].y);
  ctx.strokeStyle = '#34495E';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Draw right boundary - only the angled part
  ctx.beginPath();
  ctx.moveTo(RIGHT_BOUNDARY[1].x, RIGHT_BOUNDARY[1].y);
  ctx.lineTo(RIGHT_BOUNDARY[2].x, RIGHT_BOUNDARY[2].y);
  ctx.stroke();
}

function drawSlots(ctx) {
  const slotWidth = BASE_PIN_SPACING * 0.8;
  const slotGap = BASE_PIN_SPACING * 0.2;
  const startX = (CANVAS_WIDTH - (SLOTS.length * slotWidth + (SLOTS.length - 1) * slotGap)) / 2;
  const lastRowY = BASE_START_Y + (PIN_ROWS - 1) * BASE_ROW_SPACING;
  const slotY = lastRowY + BASE_ROW_SPACING / 2;

  SLOTS.forEach((slot, index) => {
    const x = startX + index * (slotWidth + slotGap);

    // Draw slot background
    ctx.fillStyle = slot.color;

    // Add glow effect if slot is active
    if (activeSlots.has(index)) {
      ctx.save();
      ctx.shadowColor = slot.color;
      ctx.shadowBlur = 20;
      ctx.fillRect(x, slotY, slotWidth, BASE_SLOT_HEIGHT);
      ctx.fillRect(x, slotY, slotWidth, BASE_SLOT_HEIGHT);
      ctx.restore();
    } else {
      ctx.fillRect(x, slotY, slotWidth, BASE_SLOT_HEIGHT);
    }

    // Draw multiplier text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `${slot.multiplier}x`,
      x + slotWidth / 2,
      slotY + BASE_SLOT_HEIGHT / 2
    );
  });
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Check if a point is inside the triangular boundary
function isInsideBoundary(x, y) {
  if (y > CANVAS_HEIGHT - BASE_SLOT_HEIGHT) return true;

  if (y < BASE_START_Y) {
    // Above the triangle, use vertical boundaries
    return x >= LEFT_BOUNDARY[0].x && x <= RIGHT_BOUNDARY[0].x;
  }

  // Inside the triangle section
  const progress = (y - BASE_START_Y) / (CANVAS_HEIGHT - BASE_SLOT_HEIGHT - BASE_START_Y);
  const leftX =
    LEFT_BOUNDARY[1].x + (LEFT_BOUNDARY[2].x - LEFT_BOUNDARY[1].x) * progress;
  const rightX =
    RIGHT_BOUNDARY[1].x + (RIGHT_BOUNDARY[2].x - RIGHT_BOUNDARY[1].x) * progress;

  return x >= leftX && x <= rightX;
}

export default function PlinkoGame() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const ballsRef = useRef([]);
  const pinsRef = useRef([]);
  const [scale, setScale] = useState(1);
  const [score, setScore] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasBall, setHasBall] = useState(false);
  const [dropForce, setDropForce] = useState(0);
  const [dragPosition, setDragPosition] = useState({ x: CANVAS_WIDTH / 2, y: BASE_BALL_RADIUS * 2 });
  const [isShaking, setIsShaking] = useState(0);

  // Add resize handler
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const scaleX = containerWidth / CANVAS_WIDTH;
        const scaleY = containerHeight / CANVAS_HEIGHT;
        const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond original size
        setScale(newScale);
      }
    }

    handleResize(); // Initial calculation
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left) / scale,
      y: (evt.clientY - rect.top) / scale
    };
  }

  function isOverBall(pos) {
    return hasBall &&
      distance(pos.x, pos.y, dragPosition.x, dragPosition.y) <= BASE_BALL_RADIUS;
  }

  function handleMouseMove(e) {
    const pos = getMousePos(canvasRef.current, e);

    // Update cursor style based on ball proximity
    if (isOverBall(pos)) {
      canvasRef.current.style.cursor = isDragging ? 'grabbing' : 'grab';
    } else {
      canvasRef.current.style.cursor = 'default';
    }

    if (isDragging) {
      // Calculate the allowed x-range at the current y position
      const progress = (pos.y - BASE_START_Y) / (CANVAS_HEIGHT - BASE_SLOT_HEIGHT - BASE_START_Y);
      const leftX = LEFT_BOUNDARY[0].x + (LEFT_BOUNDARY[1].x - LEFT_BOUNDARY[0].x) * progress;
      const rightX = RIGHT_BOUNDARY[0].x + (RIGHT_BOUNDARY[1].x - RIGHT_BOUNDARY[0].x) * progress;

      // Constrain horizontal movement to triangle bounds and vertical to top area
      const x = Math.max(
        leftX + BASE_BALL_RADIUS,
        Math.min(rightX - BASE_BALL_RADIUS, pos.x)
      );
      const y = Math.max(BASE_BALL_RADIUS, Math.min(BASE_START_Y - BASE_BALL_RADIUS, pos.y));

      setDragPosition({ x, y });
    }
  }

  function handleMouseDown(e) {
    if (!hasBall) return;
    const pos = getMousePos(canvasRef.current, e);
    if (pos.y < BASE_START_Y && isOverBall(pos)) {
      setIsDragging(true);
      setDragPosition(pos);
      canvasRef.current.style.cursor = 'grabbing';
    }
  }

  function handleMouseUp(e) {
    if (isDragging) {
      const pos = getMousePos(canvasRef.current, e);
      if (isOverBall(pos)) {
        canvasRef.current.style.cursor = 'grab';
      } else {
        canvasRef.current.style.cursor = 'default';
      }
    }
    setIsDragging(false);
  }

  function dropBall() {
    if (!hasBall) return;
    const newBall = {
      id: Date.now(),
      x: dragPosition.x,
      y: dragPosition.y,
      vx: (Math.random() - 0.5) * dropForce,
      vy: dropForce,
      active: true,
      scored: false,
    };
    ballsRef.current = [...ballsRef.current, newBall];

    // Reset ball position, availability, and force
    setDragPosition({
      x: LEFT_BOUNDARY[0].x + (RIGHT_BOUNDARY[0].x - LEFT_BOUNDARY[0].x) / 2,
      y: BASE_BALL_RADIUS * 2
    });
    setHasBall(false);
    setDropForce(0);
  }

  function addBall() {
    setHasBall(true);
    setDropForce(0);
  }

  function checkSlotCollision(ball) {
    const lastRowY = BASE_START_Y + (PIN_ROWS - 1) * BASE_ROW_SPACING;
    const slotY = lastRowY + BASE_ROW_SPACING / 2;

    // Check if ball is at slot level and hasn't scored yet
    if (ball.y >= slotY && ball.y <= slotY + BASE_SLOT_HEIGHT && !ball.scored) {
      const slotWidth = BASE_PIN_SPACING * 0.8;
      const slotGap = BASE_PIN_SPACING * 0.2;
      const startX = (CANVAS_WIDTH - (SLOTS.length * slotWidth + (SLOTS.length - 1) * slotGap)) / 2;

      const relativeX = ball.x - startX;
      const slotAndGapWidth = slotWidth + slotGap;
      const slotIndex = Math.floor(relativeX / slotAndGapWidth);
      const positionInSlot = relativeX - slotIndex * slotAndGapWidth;

      if (slotIndex >= 0 && slotIndex < SLOTS.length && positionInSlot <= slotWidth) {
        // Center the ball in the slot
        const slotCenterX = startX + slotIndex * slotAndGapWidth + slotWidth / 2;
        ball.x = slotCenterX;
        ball.vx = 0; // Stop horizontal movement
        ball.vy = Math.abs(ball.vy) || 2; // Ensure downward movement
        ball.scored = true;

        const points = SLOTS[slotIndex].multiplier;
        setScore((prevScore) => prevScore + points);

        activeSlots.add(slotIndex);
        setTimeout(() => {
          activeSlots.delete(slotIndex);
        }, SLOT_GLOW_DURATION);
      }
    }

    // Deactivate ball when it reaches bottom of board
    if (ball.y > CANVAS_HEIGHT + BASE_BALL_RADIUS) {
      ball.active = false;
    }
  }

  function shakeBoard() {
    // Add random velocity to all active balls
    ballsRef.current = ballsRef.current.map(ball => {
      if (ball.active) {
        return {
          ...ball,
          vx: ball.vx + (Math.random() - 0.5) * 8,
          vy: Math.max(ball.vy + Math.random() * 4, 1)
        };
      }
      return ball;
    });

    // Visual feedback with alternating directions
    setIsShaking(1);
    setTimeout(() => setIsShaking(-1), 50);
    setTimeout(() => setIsShaking(1), 100);
    setTimeout(() => setIsShaking(-1), 150);
    setTimeout(() => setIsShaking(0), 200);
  }

  function resetGame() {
    setScore(0);
    ballsRef.current = [];
    setHasBall(false);
    setDropForce(0);
    setDragPosition({
      x: LEFT_BOUNDARY[0].x + (RIGHT_BOUNDARY[0].x - LEFT_BOUNDARY[0].x) / 2,
      y: BASE_BALL_RADIUS * 2
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set fixed canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Add event listeners for drag functionality
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    // Calculate and store pin positions
    const pins = [];
    for (let row = 0; row < PIN_ROWS; row++) {
      const pinsInRow = TOP_ROW_PINS + row;
      const rowWidth = (pinsInRow - 1) * BASE_PIN_SPACING;
      const startX = (CANVAS_WIDTH - rowWidth) / 2;

      for (let pin = 0; pin < pinsInRow; pin++) {
        const x = startX + pin * BASE_PIN_SPACING;
        const y = BASE_START_Y + row * BASE_ROW_SPACING;
        pins.push({ x, y });
      }
    }
    pinsRef.current = pins;

    function updateBall(ball) {
      if (!ball.active) return;

      ball.vy += GRAVITY;

      const newX = ball.x + ball.vx;
      const newY = ball.y + ball.vy;

      // Check pin collisions
      for (const pin of pinsRef.current) {
        const dist = distance(newX, newY, pin.x, pin.y);
        if (dist < BASE_BALL_RADIUS + BASE_PIN_RADIUS) {
          const angle = Math.atan2(newY - pin.y, newX - pin.x);
          const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);

          // Apply pin bounce damping
          ball.vx = Math.cos(angle) * speed * PIN_BOUNCE_DAMPING;
          ball.vy = Math.sin(angle) * speed * PIN_BOUNCE_DAMPING;

          ball.x = pin.x + Math.cos(angle) * (BASE_BALL_RADIUS + BASE_PIN_RADIUS);
          ball.y = pin.y + Math.sin(angle) * (BASE_BALL_RADIUS + BASE_PIN_RADIUS);
          return;
        }
      }

      // Check boundary collisions
      if (!isInsideBoundary(newX, newY)) {
        // Calculate x position on boundaries at current y
        const progress = (newY - BASE_START_Y) / (CANVAS_HEIGHT - BASE_SLOT_HEIGHT - BASE_START_Y);
        const leftX = LEFT_BOUNDARY[1].x + (LEFT_BOUNDARY[2].x - LEFT_BOUNDARY[1].x) * progress;
        const rightX = RIGHT_BOUNDARY[1].x + (RIGHT_BOUNDARY[2].x - RIGHT_BOUNDARY[1].x) * progress;

        // If ball is trying to go left of left boundary or right of right boundary,
        // zero out horizontal velocity
        if ((newX < leftX && ball.vx < 0) || (newX > rightX && ball.vx > 0)) {
          ball.vx = 0;
        }

        // Keep the ball exactly on the boundary
        ball.x = Math.max(leftX + BASE_BALL_RADIUS, Math.min(rightX - BASE_BALL_RADIUS, newX));
        ball.y = newY;
      } else {
        ball.x = newX;
        ball.y = newY;
      }

      checkSlotCollision(ball);
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#2C3E50';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawBoundaries(ctx);
      drawSlots(ctx);

      pinsRef.current.forEach((pin) => {
        drawPin(ctx, pin.x, pin.y);
      });

      // Draw the ball being dragged only if we have a ball
      if (hasBall) {
        drawBall(ctx, dragPosition.x, dragPosition.y);
      }

      const remainingBalls = [];
      for (const ball of ballsRef.current) {
        if (ball.y <= CANVAS_HEIGHT + BASE_BALL_RADIUS) {
          updateBall(ball);
          drawBall(ctx, ball.x, ball.y);
          remainingBalls.push(ball);
        }
      }
      ballsRef.current = remainingBalls;

      animationFrameRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [score, isDragging, dragPosition, hasBall]);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <GameControls
        hasBall={hasBall}
        setHasBall={setHasBall}
        dropForce={dropForce}
        setDropForce={setDropForce}
        dropBall={dropBall}
        isDragging={isDragging}
        shakeBoard={shakeBoard}
        resetGame={resetGame}
        score={score}
      />

      <div className="flex-1 flex items-start justify-center overflow-hidden" ref={containerRef}>
        <div style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          marginBottom: `-${(1 - scale) * CANVAS_HEIGHT}px`
        }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={(e) => {
              e.preventDefault();
              const touch = e.touches[0];
              const rect = canvasRef.current.getBoundingClientRect();
              handleMouseMove({
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => {}
              });
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              const touch = e.touches[0];
              const rect = canvasRef.current.getBoundingClientRect();
              handleMouseDown({
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => {}
              });
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleMouseUp({
                preventDefault: () => {}
              });
            }}
            className={`bg-gray-800 rounded-xl shadow-xl transform ${
              isShaking === 1 ? 'translate-x-0.5' : isShaking === -1 ? '-translate-x-0.5' : ''
            }`}
          />
        </div>
      </div>
    </div>
  );
}
