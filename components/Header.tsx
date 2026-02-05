
import React, { useContext, useState } from 'react';
import { AuthContext } from '../App';
import Button from './ui/Button';
import LoginModal from './ui/LoginModal';

const Header: React.FC = () => {
  const auth = useContext(AuthContext);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <>
      <header className="bg-brand-surface shadow-md p-4 flex justify-between items-center sticky top-0 z-20">
        <div>
          {auth?.user && (
            <h1 className="text-xl font-bold text-brand-text-primary hidden sm:block">Welcome, {auth.user.username}</h1>
          )}
        </div>
        {auth?.user ? (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="text-sm text-brand-text-secondary">Balance</span>
              <p className="text-lg font-bold text-brand-primary">{auth.user.balance.toLocaleString()} TN</p>
            </div>
            <Button onClick={auth.logout} variant="secondary">
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
              <Button onClick={() => setIsLoginModalOpen(true)} variant="primary">
                  Login
              </Button>
          </div>
        )}
      </header>
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} />}
    </>
  );
};

export default Header;
