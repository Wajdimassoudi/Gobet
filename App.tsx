
import React, { useState, useMemo, useEffect } from 'react';
import { User, Role } from './types';
import Login from './components/Login';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AdminPanel from './components/AdminPanel';
import CasinoLobby from './components/CasinoLobby';
import Sportsbook from './components/Sportsbook';
import * as api from './services/apiService';
import { Session } from '@supabase/supabase-js';
import Spinner from './components/ui/Spinner';

export const AuthContext = React.createContext<{
  user: User | null;
  session: Session | null;
  logout: () => void;
  updateBalance: (userId: string, newBalance: number) => void;
} | null>(null);

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('Sports');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = api.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        api.getUserProfile(session.user.id)
          .then(profile => {
            setCurrentUser(profile);
             if (profile?.role === Role.ADMIN) {
                setActiveView('Admin');
             } else {
                setActiveView('Sports');
             }
          })
          .finally(() => setLoading(false));
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    // Check initial session
     const checkSession = async () => {
        const currentSession = await api.getCurrentSession();
        setSession(currentSession);
        if (currentSession?.user) {
            const profile = await api.getUserProfile(currentSession.user.id);
            setCurrentUser(profile);
            if (profile?.role === Role.ADMIN) {
                setActiveView('Admin');
            }
        }
        setLoading(false);
    };
    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const logout = () => {
    api.signOut();
    setCurrentUser(null);
    setSession(null);
  };

  const updateBalance = (userId: string, newBalance: number) => {
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, balance: newBalance } : null);
    }
  };

  const authContextValue = useMemo(() => ({
    user: currentUser,
    session,
    logout,
    updateBalance,
  }), [currentUser, session]);

  const renderContent = () => {
    if (loading) {
      return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
    }
    if (!currentUser) return <Login />;
    if (currentUser.role === Role.ADMIN) return <AdminPanel />;
    
    switch (activeView) {
      case 'Sports':
        return <Sportsbook />;
      case 'Casino':
      case 'Slots':
      case 'Live Casino':
        return <CasinoLobby gameType={activeView} />;
      default:
        return <Sportsbook />;
    }
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="min-h-screen bg-brand-background text-brand-text-primary">
        {!currentUser && !loading ? (
          <Login />
        ) : (
          <div className="flex flex-col md:flex-row">
            {currentUser && <Sidebar activeView={activeView} setActiveView={setActiveView} />}
            <div className="flex-1 flex flex-col">
              {currentUser && <Header />}
              <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
                {renderContent()}
              </main>
            </div>
          </div>
        )}
      </div>
    </AuthContext.Provider>
  );
};

export default App;
