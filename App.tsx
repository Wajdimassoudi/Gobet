
import React, { useState, useMemo, useEffect } from 'react';
import { User, Role } from './types';
import Login from './components/ui/Login';
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
  const [authError, setAuthError] = useState('');

  const handleSession = async (session: Session | null) => {
    setAuthError('');
    if (session?.user) {
      try {
        const profile = await api.getUserProfile(session.user.id);
        setCurrentUser(profile);
        if (profile.role === Role.ADMIN) {
          setActiveView('Admin');
        } else {
          setActiveView('Sports');
        }
      } catch (error: any) {
        console.error("Critical Error: Failed to load user profile after login.", error);
        setAuthError(error.message);
        await api.signOut(); // Log out, app is in an unusable state
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkInitialSession = async () => {
      setLoading(true);
      const currentSession = await api.getCurrentSession();
      setSession(currentSession);
      await handleSession(currentSession);
    };
    checkInitialSession();

    const { data: { subscription } } = api.onAuthStateChange((_event, session) => {
      setSession(session);
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await api.signOut();
    setCurrentUser(null);
    setSession(null);
    setAuthError('');
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="min-h-screen bg-brand-background text-brand-text-primary">
        {!currentUser ? (
          <Login authError={authError} />
        ) : (
          <div className="flex flex-col md:flex-row">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            <div className="flex-1 flex flex-col">
              <Header />
              <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
                {currentUser.role === Role.ADMIN ? <AdminPanel /> : (
                  <>
                    {activeView === 'Sports' && <Sportsbook />}
                    {(activeView === 'Casino' || activeView === 'Slots' || activeView === 'Live Casino') && (
                      <CasinoLobby gameType={activeView} />
                    )}
                  </>
                )}
              </main>
            </div>
          </div>
        )}
      </div>
    </AuthContext.Provider>
  );
};

export default App;
