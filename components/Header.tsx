
import React, { useContext } from 'react';
import { AuthContext } from '../App';
import Button from './ui/Button';

const Header: React.FC = () => {
  const auth = useContext(AuthContext);

  if (!auth || !auth.user) return null;

  return (
    <header className="bg-brand-surface shadow-md p-4 flex justify-between items-center sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-brand-text-primary">Welcome, {auth.user.username}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <span className="text-sm text-brand-text-secondary">Balance</span>
          <p className="text-lg font-bold text-brand-primary">{auth.user.balance.toLocaleString()} TN</p>
        </div>
        <Button onClick={auth.logout} variant="secondary">
          Logout
        </Button>
      </div>
    </header>
  );
};

export default Header;
