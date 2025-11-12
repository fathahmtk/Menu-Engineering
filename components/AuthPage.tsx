
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { ChefHat, LoaderCircle } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      }
    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <ChefHat className="text-primary mx-auto" size={48} />
            <h1 className="text-3xl font-bold mt-4 text-foreground">F&B Costing Pro</h1>
            <p className="text-muted-foreground mt-2">
              {isLogin ? 'Sign in to access your dashboard' : 'Create an account to get started'}
            </p>
        </div>

        <form onSubmit={handleAuth} className="bg-card p-8 rounded-xl shadow-lg border border-border space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">Email address</label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password"className="block text-sm font-medium text-foreground">Password</label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}
          {message && <p className="text-sm text-primary bg-primary/10 p-3 rounded-md">{message}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:bg-primary/50"
            >
              {loading && <LoaderCircle className="animate-spin mr-2" />}
              {isLogin ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }} className="font-medium text-primary hover:text-primary/80 ml-1">
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
