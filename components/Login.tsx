
import React, { useState } from 'react';
import * as api from '../services/apiService';
import Input from './ui/Input';
import Button from './ui/Button';
import Card from './ui/Card';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // NOTE: Supabase uses email for login. We use a dummy email format.
      // In a real app, you would collect emails or use usernames with a custom setup.
      const dummyEmail = `${email}@gobet.local`;
      await api.signIn(dummyEmail, password);
      // Login successful, App component will handle redirect via auth state change
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-brand-primary">GoBet</h1>
            <p className="text-brand-text-secondary mt-2">Virtual Betting Platform</p>
        </div>
        {error && <p className="bg-red-500/20 text-brand-danger text-center p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Username"
            id="username"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Login;
