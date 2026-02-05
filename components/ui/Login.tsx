
import React, { useState } from 'react';
import * as api from '../../services/apiService';
import Input from './Input';
import Button from './Button';
import Card from './Card';

interface LoginProps {
  authError?: string;
}

const Login: React.FC<LoginProps> = ({ authError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);
    try {
      // NOTE: Supabase uses email for login. We use a dummy email format.
      // The username input is converted to 'username@gobet.local'.
      const dummyEmail = `${username.toLowerCase()}@gobet.local`;
      await api.signIn(dummyEmail, password);
      // Login successful, App component will handle redirect via auth state change
    } catch (err: any) {
      setFormError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const displayError = authError || formError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-brand-primary">GoBet</h1>
            <p className="text-brand-text-secondary mt-2">Virtual Betting Platform</p>
        </div>
        {displayError && (
          <div className="bg-red-500/20 text-brand-danger text-left p-3 rounded-md mb-4">
            <p className="font-bold text-center mb-2">Login Failed</p>
            <p className="text-sm font-mono bg-black/20 p-2 rounded">{displayError}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Username"
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            placeholder="Enter your username"
          />
          <Input 
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
          />
           <p className="text-xs text-brand-text-secondary text-center px-2 !mt-4">
              For admin, use username <code className="bg-brand-surface p-1 rounded font-mono">admin</code>. The user in Supabase must have the email <code className="bg-brand-surface p-1 rounded font-mono">admin@gobet.local</code>.
          </p>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Login;
