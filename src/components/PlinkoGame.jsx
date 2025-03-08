import React, { useEffect, useRef, useState } from 'react';

const PIN_RADIUS = 5;
const BALL_RADIUS = 10;
const GRAVITY = 0.1;
const PIN_BOUNCE_DAMPING = 0.6;
const PIN_SPACING = 40;
const ROW_SPACING = 40;
const SLOT_HEIGHT = 30;
const START_Y = 70;
const BOUNDARY_OFFSET = 0.2;

// Calculate dimensions based on pin layout
const TOP_ROW_PINS = 3;
const PIN_ROWS = 15;
const BOTTOM_ROW_PINS = TOP_ROW_PINS + PIN_ROWS - 1;
const GAME_WIDTH = Math.max((BOTTOM_ROW_PINS - 1) * PIN_SPACING, (TOP_ROW_PINS - 1) * PIN_SPACING);
const CANVAS_WIDTH = GAME_WIDTH * (1 + BOUNDARY_OFFSET * 2);
const CANVAS_HEIGHT = START_Y + PIN_ROWS * ROW_SPACING + SLOT_HEIGHT;

// Calculate boundary points to match triangle shape with vertical top section
const LEFT_BOUNDARY = [
  { x: CANVAS_WIDTH / 2 - ((TOP_ROW_PINS - 1) * PIN_SPACING) / 2 - PIN_SPACING, y: 0 },
  { x: CANVAS_WIDTH / 2 - ((TOP_ROW_PINS - 1) * PIN_SPACING) / 2 - PIN_SPACING, y: START_Y },
  {
    x: CANVAS_WIDTH / 2 - ((BOTTOM_ROW_PINS - 1) * PIN_SPACING) / 2 - PIN_SPACING,
    y: START_Y + (PIN_ROWS - 1) * ROW_SPACING,
  },
];
const RIGHT_BOUNDARY = [
  { x: CANVAS_WIDTH / 2 + ((TOP_ROW_PINS - 1) * PIN_SPACING) / 2 + PIN_SPACING, y: 0 },
  { x: CANVAS_WIDTH / 2 + ((TOP_ROW_PINS - 1) * PIN_SPACING) / 2 + PIN_SPACING, y: START_Y },
  {
    x: CANVAS_WIDTH / 2 + ((BOTTOM_ROW_PINS - 1) * PIN_SPACING) / 2 + PIN_SPACING,
    y: START_Y + (PIN_ROWS - 1) * ROW_SPACING,
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
  ctx.arc(x, y, PIN_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#FFD700';
  ctx.fill();
  ctx.closePath();
}

function drawBall(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#FF4444';
  ctx.fill();
  ctx.closePath();
}

function drawBoundaries(ctx) {
  // Draw left boundary - only the angled part
  ctx.beginPath();
  ctx.moveTo(LEFT_BOUNDARY[1].x, LEFT_BOUNDARY[1].y); // Start from START_Y
  ctx.lineTo(LEFT_BOUNDARY[2].x, LEFT_BOUNDARY[2].y);
  ctx.strokeStyle = '#34495E';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Draw right boundary - only the angled part
  ctx.beginPath();
  ctx.moveTo(RIGHT_BOUNDARY[1].x, RIGHT_BOUNDARY[1].y); // Start from START_Y
  ctx.lineTo(RIGHT_BOUNDARY[2].x, RIGHT_BOUNDARY[2].y);
  ctx.stroke();
}

function drawSlots(ctx) {
  const slotWidth = PIN_SPACING * 0.8; // Made slots narrower
  const slotGap = PIN_SPACING * 0.2; // Increased gap between slots
  const startX =
    (CANVAS_WIDTH - (SLOTS.length * slotWidth + (SLOTS.length - 1) * slotGap)) /
    2;
  const lastRowY = START_Y + (PIN_ROWS - 1) * ROW_SPACING;
  const slotY = lastRowY + ROW_SPACING / 2;

  SLOTS.forEach((slot, index) => {
    const x = startX + index * (slotWidth + slotGap);

    // Draw slot background
    ctx.fillStyle = slot.color;

    // Add glow effect if slot is active
    if (activeSlots.has(index)) {
      ctx.save();
      ctx.shadowColor = slot.color;
      ctx.shadowBlur = 20;
      ctx.fillRect(x, slotY, slotWidth, SLOT_HEIGHT);
      ctx.fillRect(x, slotY, slotWidth, SLOT_HEIGHT);
      ctx.restore();
    } else {
      ctx.fillRect(x, slotY, slotWidth, SLOT_HEIGHT);
    }

    // Draw multiplier text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `${slot.multiplier}x`,
      x + slotWidth / 2,
      slotY + SLOT_HEIGHT / 2
    );
  });
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Check if a point is inside the triangular boundary
function isInsideBoundary(x, y) {
  if (y > CANVAS_HEIGHT - SLOT_HEIGHT) return true;

  if (y < START_Y) {
    // Above the triangle, use vertical boundaries
    return x >= LEFT_BOUNDARY[0].x && x <= RIGHT_BOUNDARY[0].x;
  }

  // Inside the triangle section
  const progress = (y - START_Y) / (CANVAS_HEIGHT - SLOT_HEIGHT - START_Y);
  const leftX =
    LEFT_BOUNDARY[1].x + (LEFT_BOUNDARY[2].x - LEFT_BOUNDARY[1].x) * progress;
  const rightX =
    RIGHT_BOUNDARY[1].x + (RIGHT_BOUNDARY[2].x - RIGHT_BOUNDARY[1].x) * progress;

  return x >= leftX && x <= rightX;
}

export default function PlinkoGame() {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const ballsRef = useRef([]);
  const pinsRef = useRef([]);
  const [score, setScore] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasBall, setHasBall] = useState(false);
  const [dropForce, setDropForce] = useState(0);
  const [dragPosition, setDragPosition] = useState({
    x: LEFT_BOUNDARY[0].x + (RIGHT_BOUNDARY[0].x - LEFT_BOUNDARY[0].x) / 2,
    y: BALL_RADIUS * 2
  });
  const [isShaking, setIsShaking] = useState(0);

  function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  function isOverBall(pos) {
    return hasBall &&
      distance(pos.x, pos.y, dragPosition.x, dragPosition.y) <= BALL_RADIUS;
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
      const progress = (pos.y - START_Y) / (CANVAS_HEIGHT - SLOT_HEIGHT - START_Y);
      const leftX = LEFT_BOUNDARY[0].x + (LEFT_BOUNDARY[1].x - LEFT_BOUNDARY[0].x) * progress;
      const rightX = RIGHT_BOUNDARY[0].x + (RIGHT_BOUNDARY[1].x - RIGHT_BOUNDARY[0].x) * progress;

      // Constrain horizontal movement to triangle bounds and vertical to top area
      const x = Math.max(
        leftX + BALL_RADIUS,
        Math.min(rightX - BALL_RADIUS, pos.x)
      );
      const y = Math.max(BALL_RADIUS, Math.min(START_Y - BALL_RADIUS, pos.y));

      setDragPosition({ x, y });
    }
  }

  function handleMouseDown(e) {
    if (!hasBall) return;
    const pos = getMousePos(canvasRef.current, e);
    if (pos.y < START_Y && isOverBall(pos)) {
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
      vx: (Math.random() - 0.5) * dropForce * 0.5, // Add some random horizontal velocity based on force
      vy: dropForce * 0.5, // Initial downward velocity based on force
      active: true,
      scored: false,
    };
    ballsRef.current = [...ballsRef.current, newBall];

    // Reset ball position, availability, and force
    setDragPosition({
      x: LEFT_BOUNDARY[0].x + (RIGHT_BOUNDARY[0].x - LEFT_BOUNDARY[0].x) / 2,
      y: BALL_RADIUS * 2
    });
    setHasBall(false);
    setDropForce(0);
  }

  function addBall() {
    setHasBall(true);
    setDropForce(0);
  }

  function checkSlotCollision(ball) {
    const lastRowY = START_Y + (PIN_ROWS - 1) * ROW_SPACING;
    const slotY = lastRowY + ROW_SPACING / 2;

    // Check if ball is at slot level and hasn't scored yet
    if (ball.y >= slotY && ball.y <= slotY + SLOT_HEIGHT && !ball.scored) {
      const slotWidth = PIN_SPACING * 0.8;
      const slotGap = PIN_SPACING * 0.2;
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
    if (ball.y > CANVAS_HEIGHT + BALL_RADIUS) {
      ball.active = false;
    }
  }

  function shakeBoard() {
    // Add random velocity to all active balls
    ballsRef.current = ballsRef.current.map(ball => {
      if (ball.active) {
        return {
          ...ball,
          vx: ball.vx + (Math.random() - 0.5) * 4, // Increased horizontal shake
          vy: Math.max(ball.vy + Math.random() * 2, 0.5)
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
      y: BALL_RADIUS * 2
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Add event listeners for drag functionality
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    // Calculate and store pin positions
    const pins = [];
    for (let row = 0; row < PIN_ROWS; row++) {
      const pinsInRow = TOP_ROW_PINS + row;
      const rowWidth = (pinsInRow - 1) * PIN_SPACING;
      const startX = (CANVAS_WIDTH - rowWidth) / 2;

      for (let pin = 0; pin < pinsInRow; pin++) {
        const x = startX + pin * PIN_SPACING;
        const y = START_Y + row * ROW_SPACING;
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
        if (dist < BALL_RADIUS + PIN_RADIUS) {
          const angle = Math.atan2(newY - pin.y, newX - pin.x);
          const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);

          // Apply pin bounce damping
          ball.vx = Math.cos(angle) * speed * PIN_BOUNCE_DAMPING;
          ball.vy = Math.sin(angle) * speed * PIN_BOUNCE_DAMPING;

          ball.x = pin.x + Math.cos(angle) * (BALL_RADIUS + PIN_RADIUS);
          ball.y = pin.y + Math.sin(angle) * (BALL_RADIUS + PIN_RADIUS);
          return;
        }
      }

      // Check boundary collisions
      if (!isInsideBoundary(newX, newY)) {
        // Calculate x position on boundaries at current y
        const progress = (newY - START_Y) / (CANVAS_HEIGHT - SLOT_HEIGHT - START_Y);
        const leftX = LEFT_BOUNDARY[1].x + (LEFT_BOUNDARY[2].x - LEFT_BOUNDARY[1].x) * progress;
        const rightX = RIGHT_BOUNDARY[1].x + (RIGHT_BOUNDARY[2].x - RIGHT_BOUNDARY[1].x) * progress;

        // If ball is trying to go left of left boundary or right of right boundary,
        // zero out horizontal velocity
        if ((newX < leftX && ball.vx < 0) || (newX > rightX && ball.vx > 0)) {
          ball.vx = 0;
        }

        // Keep the ball exactly on the boundary
        ball.x = Math.max(leftX + BALL_RADIUS, Math.min(rightX - BALL_RADIUS, newX));
        ball.y = newY;
      } else {
        ball.x = newX;
        ball.y = newY;
      }

      checkSlotCollision(ball);
    }

    function draw() {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#2C3E50';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

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
        if (ball.y <= CANVAS_HEIGHT + BALL_RADIUS) {
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
      // Clean up event listeners
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [score, isDragging, dragPosition, hasBall]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#1a1a1a',
        padding: '10px',
        width: '100%',
        height: '100%',
        gap: '20px',
        overflow: 'auto',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          minWidth: '220px',
        }}
      >
        <button
          onClick={addBall}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            opacity: hasBall ? 0.5 : 1,
          }}
          disabled={hasBall}
        >
          Add Ball
        </button>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          padding: '10px',
          backgroundColor: hasBall ? '#2C3E50' : '#1a2633',
          borderRadius: '5px',
          opacity: hasBall ? 1 : 0.5,
          transition: 'all 0.3s ease'
        }}>
          <label style={{
            color: 'white',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            Drop Force: {dropForce.toFixed(1)}
            <span style={{
              fontSize: '12px',
              opacity: 0.7,
              marginLeft: '5px'
            }}>
              {dropForce === 0 ? '(Natural)' : dropForce < 5 ? '(Gentle)' : dropForce < 10 ? '(Medium)' : '(Hard)'}
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="15"
            step="0.1"
            value={dropForce}
            onChange={(e) => hasBall && setDropForce(parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#4CAF50',
              cursor: hasBall ? 'pointer' : 'not-allowed',
              opacity: hasBall ? 1 : 0.7
            }}
          />
        </div>
        <button
          onClick={dropBall}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            opacity: hasBall ? 1 : 0.5,
          }}
          disabled={!hasBall}
        >
          Drop Ball
        </button>
        <button
          onClick={shakeBoard}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Shake Board
        </button>
        <button
          onClick={resetGame}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#FF5722',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Reset Game
        </button>
        <div
          style={{
            color: 'white',
            fontSize: '20px',
            fontWeight: 'bold',
          }}
        >
          Score: {score.toFixed(1)}
        </div>
      </div>
      <div style={{
        padding: '10px',
        boxSizing: 'border-box',
        WebkitOverflowScrolling: 'touch',
        transform: isShaking ? `translateX(${isShaking * 4}px)` : 'none',
        transition: 'transform 50ms'
      }}>
        <div>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
          />
        </div>
      </div>
    </div>
  );
}
