
import React, { useState, useEffect } from 'react';
import * as api from '../../services/apiService';
import Input from './Input';
import Button from './Button';
import Card from './Card';

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);
    try {
      const dummyEmail = `${username.toLowerCase()}@gobet.local`;
      await api.signIn(dummyEmail, password);
      onClose(); // Close modal on successful login
    } catch (err: any) {
      setFormError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        onClick={onClose}
    >
      <Card 
        className="w-full max-w-md relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the card
      >
        <button 
            onClick={onClose} 
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
            aria-label="Close login modal"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brand-primary">Login</h1>
        </div>
        {formError && (
          <div className="bg-red-500/20 text-brand-danger text-sm text-center p-3 rounded-md mb-4">
            {formError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Username"
            id="modal-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            placeholder="Enter your username"
          />
          <Input 
            label="Password"
            id="modal-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </Card>
      <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LoginModal;
