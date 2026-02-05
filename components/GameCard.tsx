
import React from 'react';
import { Game } from '../types';

interface GameCardProps {
  game: Game;
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  return (
    <div className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer transform hover:-translate-y-2 transition-transform duration-300">
      <img src={game.imageUrl} alt={game.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-4">
        <h3 className="text-lg font-bold text-white">{game.name}</h3>
        <p className="text-sm text-gray-300">{game.provider}</p>
      </div>
       <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="text-brand-primary font-bold text-xl">Play Now</span>
      </div>
    </div>
  );
};

export default GameCard;
