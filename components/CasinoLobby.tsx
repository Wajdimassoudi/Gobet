
import React, { useState, useEffect } from 'react';
import { getGames } from '../services/apiService';
import { Game } from '../types';
import GameGrid from './GameGrid';
import Spinner from './ui/Spinner';

interface CasinoLobbyProps {
  gameType: string;
}

const CasinoLobby: React.FC<CasinoLobbyProps> = ({ gameType }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      const fetchedGames = await getGames(gameType);
      setGames(fetchedGames);
      setLoading(false);
    };

    fetchGames();
  }, [gameType]);

  return (
    <div>
      <h2 className="text-3xl font-bold text-brand-primary mb-6">{gameType}</h2>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : (
        <GameGrid games={games} />
      )}
    </div>
  );
};

export default CasinoLobby;
