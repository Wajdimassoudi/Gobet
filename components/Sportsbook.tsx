
import React, { useState, useEffect, useContext } from 'react';
import { getSportsEvents, getLiveTvUrl } from '../services/apiService';
import { SportEvent, Market } from '../types';
import Spinner from './ui/Spinner';
import Card from './ui/Card';
import Button from './ui/Button';
import { AuthContext } from '../App';

interface Bet {
  eventId: string;
  marketName: string;
  outcomeName: string;
  odds: number;
}

const Sportsbook: React.FC = () => {
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [betSlip, setBetSlip] = useState<Bet[]>([]);
  const [stake, setStake] = useState<number>(10);
  const [liveStreamUrl, setLiveStreamUrl] = useState<string | null>(null);
  const auth = useContext(AuthContext);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const fetchedEvents = await getSportsEvents();
      setEvents(fetchedEvents);
      
      const liveEvent = fetchedEvents.find(e => e.live);
      if (liveEvent) {
          const url = await getLiveTvUrl(liveEvent.id);
          setLiveStreamUrl(url);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);
  
  const addToBetSlip = (event: SportEvent, market: Market, outcome: { name: string; value: number }) => {
      const newBet: Bet = {
          eventId: event.id,
          marketName: market.name,
          outcomeName: outcome.name,
          odds: outcome.value
      };
      // For simplicity, allow one bet at a time.
      setBetSlip([newBet]);
  }

  const placeBet = () => {
      if(!auth || !auth.user || betSlip.length === 0 || stake <= 0) return;
      if(auth.user.balance < stake) {
          alert('Insufficient balance.');
          return;
      }
      
      const newBalance = auth.user.balance - stake;
      auth.updateBalance(auth.user.id, newBalance);
      alert(`Bet placed! Stake: ${stake} TN. Good luck!`);
      setBetSlip([]);
      setStake(10);
  }

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        {liveStreamUrl && (
             <Card>
                <h3 className="text-xl font-semibold mb-4 text-brand-primary">Live Stream</h3>
                <div className="aspect-video bg-black rounded-md overflow-hidden">
                    <video controls autoPlay muted className="w-full h-full object-contain">
                       <source src={liveStreamUrl} type="application/x-mpegURL" />
                       Your browser does not support the video tag.
                    </video>
                </div>
             </Card>
        )}
        {events.map((event) => (
          <Card key={event.id}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-brand-text-secondary">{event.name}</span>
                <h3 className="text-xl font-bold text-white">{event.participants.join(' vs ')}</h3>
                <p className="text-sm text-gray-400">{new Date(event.startTime).toLocaleString()}</p>
              </div>
              {event.live && <span className="text-red-500 font-bold animate-pulse">LIVE</span>}
            </div>
            {event.markets.map((market) => (
              <div key={market.name} className="mt-4">
                <h4 className="font-semibold text-brand-text-secondary mb-2">{market.name}</h4>
                <div className="grid grid-cols-3 gap-2">
                  {market.odds.map((outcome) => (
                    <button 
                      key={outcome.name} 
                      onClick={() => addToBetSlip(event, market, outcome)}
                      className="bg-brand-surface hover:bg-gray-700 p-3 rounded-md text-center transition">
                      <span className="text-brand-text-primary">{outcome.name}</span>
                      <span className="block font-bold text-brand-primary text-lg">{outcome.value.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        ))}
      </div>
      
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <h3 className="text-xl font-semibold mb-4 text-brand-primary border-b border-gray-700 pb-2">Bet Slip</h3>
          {betSlip.length === 0 ? (
            <p className="text-brand-text-secondary text-center py-8">Select an outcome to place a bet.</p>
          ) : (
            <div className="space-y-4">
                {betSlip.map((bet, index) => (
                    <div key={index} className="bg-gray-800 p-3 rounded-md">
                        <p className="font-bold text-white">{bet.outcomeName}</p>
                        <p className="text-sm text-gray-400">{events.find(e => e.id === bet.eventId)?.participants.join(' vs ')}</p>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-gray-400">{bet.marketName}</span>
                            <span className="font-bold text-brand-primary text-lg">{bet.odds.toFixed(2)}</span>
                        </div>
                    </div>
                ))}
                <div className="space-y-2">
                    <label className="text-brand-text-secondary">Stake (TN)</label>
                    <input 
                        type="number"
                        value={stake}
                        onChange={(e) => setStake(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-brand-surface border border-gray-600 rounded-md text-brand-text-primary"
                    />
                </div>
                <div className="flex justify-between text-lg font-bold">
                    <span>Potential Winnings:</span>
                    <span className="text-brand-primary">{(stake * (betSlip[0]?.odds || 0)).toFixed(2)} TN</span>
                </div>
                <Button onClick={placeBet} className="w-full mt-4">Place Bet</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Sportsbook;
