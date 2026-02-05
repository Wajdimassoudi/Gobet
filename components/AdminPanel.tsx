
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import { User, Role } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import * as api from '../services/apiService';
import Spinner from './ui/Spinner';

const AdminPanel: React.FC = () => {
  const auth = useContext(AuthContext);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const userList = await api.getAllUsers();
      setUsers(userList);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setError('Failed to load user list.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleTransaction = async (type: 'deposit' | 'withdraw') => {
    if (!selectedUser || amount <= 0) return;
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const amountToChange = type === 'deposit' ? amount : -amount;
      if (type === 'withdraw' && selectedUser.balance < amount) {
        throw new Error("Withdrawal amount cannot exceed balance.");
      }
      const newBalance = await api.updateUserBalance(selectedUser.id, amount, type);
      
      // auth?.updateBalance(selectedUser.id, newBalance);
      setSelectedUser(prev => prev ? { ...prev, balance: newBalance } : null);
      setUsers(prevUsers => prevUsers.map(u => u.id === selectedUser.id ? {...u, balance: newBalance} : u));
      
      setAmount(0);
      setSuccess(`Transaction successful! ${selectedUser.username}'s new balance is ${newBalance} TN.`);
    } catch (err: any) {
      setError(err.message || 'Transaction failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      setError("Username and password cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.adminCreateUser(newUsername, newPassword);
      setNewUsername('');
      setNewPassword('');
      setSuccess(`User "${newUsername}" created. You will be logged out to complete the process. Please log in again.`);
      setTimeout(() => auth?.logout(), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-brand-primary">Admin Panel</h2>
      
      {error && <p className="bg-red-500/20 text-brand-danger text-center p-3 rounded-md">{error}</p>}
      {success && <p className="bg-green-500/20 text-brand-success text-center p-3 rounded-md">{success}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h3 className="text-xl font-semibold mb-4 text-brand-text-primary">Create New User</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <Input label="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} disabled={isSubmitting}/>
            <Input label="Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isSubmitting} />
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create User"}</Button>
             <p className="text-xs text-brand-text-secondary pt-2">Note: Creating a user will log you out for security reasons. You will need to log back in.</p>
          </form>
        </Card>

        <Card>
          <h3 className="text-xl font-semibold mb-4 text-brand-text-primary">Manage User Funds</h3>
          {loadingUsers ? <Spinner /> : (
            <div className="space-y-4">
               <label htmlFor="user-select" className="block text-sm font-medium text-brand-text-secondary mb-1">Select User</label>
               <select 
                  id="user-select"
                  onChange={(e) => setSelectedUser(users.find(u => u.id === e.target.value) || null)}
                  className="w-full px-3 py-2 bg-brand-surface border border-gray-600 rounded-md text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
               >
                  <option value="">-- Select a user --</option>
                  {users.map(user => (
                      <option key={user.id} value={user.id}>{user.username} (Balance: {user.balance} TN)</option>
                  ))}
               </select>

              {selectedUser && (
                  <div className="mt-4 p-4 border border-gray-700 rounded-md space-y-4">
                      <p className="text-lg"><span className="font-bold text-brand-text-secondary">Selected:</span> {selectedUser.username}</p>
                      <p className="text-lg"><span className="font-bold text-brand-text-secondary">Current Balance:</span> {selectedUser.balance.toLocaleString()} TN</p>
                      <Input label="Amount (TN)" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min="0" disabled={isSubmitting}/>
                      <div className="flex space-x-4">
                          <Button onClick={() => handleTransaction('deposit')} className="flex-1" variant="primary" disabled={isSubmitting || amount <= 0}>{isSubmitting ? 'Processing...' : 'Deposit'}</Button>
                          <Button onClick={() => handleTransaction('withdraw')} className="flex-1" variant="danger" disabled={isSubmitting || amount <= 0}>{isSubmitting ? 'Processing...' : 'Withdraw'}</Button>
                      </div>
                  </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
