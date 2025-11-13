import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuthContext';
import { Mail, Lock, User, LoaderCircle } from 'lucide-react';

const ICanLogo = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AuthPage: React.FC = () => {
    const { signIn } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            alert("Please enter email and password.");
            return;
        }
        setIsLoading(true);
        // Simulate network request
        setTimeout(() => {
            signIn(email);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div 
            className="flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-cover bg-center relative"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop')" }}
        >
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>
            <div className="w-full max-w-md mx-auto z-10">
                <div className="text-center mb-8">
                    <ICanLogo />
                    <h1 className="text-3xl font-bold mt-4 text-[var(--color-text-primary)]">
                        {isSignUp ? 'Create an Account' : 'Sign In'}
                    </h1>
                    <p className="text-[var(--color-text-secondary)] mt-2">
                        to continue to iCAN
                    </p>
                </div>

                <div className="ican-card p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isSignUp && (
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    className="ican-input pl-10"
                                    required
                                />
                            </div>
                        )}
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email Address"
                                className="ican-input pl-10"
                                required
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="ican-input pl-10"
                                required
                            />
                        </div>
                        {isSignUp && (
                             <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    className="ican-input pl-10"
                                    required
                                />
                            </div>
                        )}

                        {!isSignUp && (
                            <div className="flex items-center justify-between">
                                <label className="flex items-center text-sm text-[var(--color-text-secondary)]">
                                    <input type="checkbox" className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-offset-gray-800 mr-2" />
                                    Remember me
                                </label>
                                <a href="#" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                                    Forgot password?
                                </a>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full ican-btn ican-btn-primary py-3 ${isLoading ? 'ican-btn-disabled' : ''}`}
                        >
                            {isLoading ? (
                                <LoaderCircle size={20} className="animate-spin" />
                            ) : (
                                isSignUp ? 'Create Account' : 'Sign In'
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-sm text-[var(--color-text-muted)]">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button onClick={() => setIsSignUp(!isSignUp)} className="font-medium text-[var(--color-primary)] hover:underline ml-1">
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthPage;