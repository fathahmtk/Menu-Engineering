
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { ChefHat, LoaderCircle } from 'lucide-react';

type AuthView = 'credentials' | 'forgotPassword';

const AuthPage: React.FC = () => {
  const [authView, setAuthView] = useState<AuthView>('credentials');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isConfigError, setIsConfigError] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setIsConfigError(false);

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
      if (error.message === 'Failed to fetch') {
        setError('Could not connect to the authentication service. Please check your network connection and Supabase configuration.');
        setIsConfigError(true);
      } else {
        setError(error.error_description || error.message);
        setIsConfigError(false);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setIsConfigError(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, // Redirect user back to the app after password reset
      });
      if (error) throw error;
      setMessage('Password reset link sent. Please check your email inbox.');
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        setError('Could not connect to the authentication service. Please check your network connection and Supabase configuration.');
        setIsConfigError(true);
      } else {
        setError(error.error_description || error.message);
        setIsConfigError(false);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const switchAuthView = (view: AuthView) => {
    setAuthView(view);
    setError(null);
    setMessage(null);
    setPassword('');
    setIsConfigError(false);
  };
  
  const toggleLoginMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setMessage(null);
    setIsConfigError(false);
  }

  const headerText = 
    authView === 'forgotPassword' ? 'Reset your password'
    : isLogin ? 'Sign in to access your dashboard'
    : 'Create an account to get started';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <ChefHat className="text-primary mx-auto" size={48} />
            <h1 className="text-3xl font-bold mt-4 text-foreground">F&B Costing Pro</h1>
            <p className="text-muted-foreground mt-2">{headerText}</p>
        </div>

        {isConfigError && (
          <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 rounded-md my-4 text-sm" role="alert">
            <p className="font-bold">Configuration Issue</p>
            <p className="mt-1">Could not connect to the backend. This usually means the Supabase project is not set up correctly.</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Make sure your Supabase project is running.</li>
              <li>Verify the URL and anon key in <strong>services/supabaseClient.ts</strong> are correct.</li>
              <li>Ensure this app's domain is listed in your Supabase project's CORS settings under Authentication &gt; URL Configuration.</li>
            </ol>
          </div>
        )}

        {authView === 'credentials' ? (
          <form onSubmit={handleAuth} className="bg-card p-8 rounded-xl shadow-lg border border-border space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">Email address</label>
              <div className="mt-1">
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-foreground">Password</label>
              <div className="mt-1">
                <input id="password" name="password" type="password" autoComplete="current-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm" />
              </div>
            </div>
            
            {isLogin && (
              <div className="text-right text-sm -my-2">
                <button type="button" onClick={() => switchAuthView('forgotPassword')} className="font-medium text-primary hover:text-primary/80 focus:outline-none">Forgot your password?</button>
              </div>
            )}
            
            {error && !isConfigError && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}
            {message && <p className="text-sm text-primary bg-primary/10 p-3 rounded-md">{message}</p>}

            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:bg-primary/50">
                {loading && <LoaderCircle className="animate-spin mr-2" />}
                {isLogin ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset} className="bg-card p-8 rounded-xl shadow-lg border border-border space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">Email address</label>
              <div className="mt-1">
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm" />
              </div>
            </div>

            {error && !isConfigError && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}
            {message && <p className="text-sm text-primary bg-primary/10 p-3 rounded-md">{message}</p>}

            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:bg-primary/50">
                {loading && <LoaderCircle className="animate-spin mr-2" />}
                Send Reset Link
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {authView === 'credentials' ? (
            <>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button onClick={toggleLoginMode} className="font-medium text-primary hover:text-primary/80 ml-1">
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </>
          ) : (
            <button onClick={() => switchAuthView('credentials')} className="font-medium text-primary hover:text-primary/80">
              Back to Sign In
            </button>
          )}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
