import React from 'react';

export default function GameControls({
  hasBall,
  setHasBall,
  dropForce,
  setDropForce,
  dropBall,
  isDragging,
  shakeBoard,
  resetGame,
  score,
}) {
  return (
    <div className="md:w-[250px] shrink-0">
      <div className="bg-gray-800/90 backdrop-blur p-6 rounded-xl shadow-lg space-y-4 sticky top-4">
        <div className="grid grid-cols-3 md:grid-cols-1 gap-4">
          <button
            onClick={() => setHasBall(true)}
            className="w-full px-6 py-3 text-xs md:text-lg font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            disabled={hasBall}
          >
            Add Ball
          </button>
          <div className="space-y-3">
            <label
              htmlFor="force"
              className="text-white text-xs md:text-lg font-medium block"
            >
              Drop Force: {dropForce}
            </label>
            <input
              id="force"
              type="range"
              min="0"
              max="10"
              value={dropForce}
              onChange={(e) => setDropForce(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-xl appearance-none cursor-pointer"
            />
          </div>
          <button
            onClick={dropBall}
            className="w-full px-6 py-3 text-xs md:text-lg font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            disabled={!hasBall || isDragging}
          >
            Drop Ball
          </button>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-1 gap-4">
          <button
            onClick={shakeBoard}
            className="w-full px-6 py-3 text-xs md:text-lg font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-all"
          >
            Shake Board
          </button>
          <button
            onClick={resetGame}
            className="w-full px-6 py-3 text-xs md:text-lg font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 focus:ring-4 focus:ring-red-300 transition-all"
          >
            Reset Game
          </button>
          <div className="text-xs md:text-lg font-bold text-white text-center p-3 bg-gray-700/50 backdrop-blur rounded-xl flex justify-center">
            Score: {score}
          </div>
        </div>
      </div>
    </div>
  );
}
