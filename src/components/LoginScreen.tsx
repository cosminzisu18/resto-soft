import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { users } from '@/data/mockData';
import { useRestaurant } from '@/context/RestaurantContext';
import { cn } from '@/lib/utils';
import { Lock, ChefHat, User, Shield, Fingerprint, Wifi, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoginScreenProps {
  onLoginSuccess: (role: 'admin' | 'kitchen' | 'waiter') => void;
}

type AuthMethod = 'pin' | 'biometric' | 'nfc';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('pin');
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const { login } = useRestaurant();
  const { toast } = useToast();

  const handlePinSubmit = () => {
    if (!selectedUserId) return;
    
    const success = login(selectedUserId, pin);
    const user = users.find(u => u.id === selectedUserId);
    
    if (success) {
      toast({
        title: 'Conectat cu succes',
        description: `Bine ai venit, ${user?.name}!`,
      });
      onLoginSuccess(user?.role as 'admin' | 'kitchen' | 'waiter');
    } else {
      toast({
        title: 'Eroare',
        description: 'PIN incorect. Încearcă din nou.',
        variant: 'destructive',
      });
      setPin('');
    }
  };

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => {
          if (selectedUserId) {
            const success = login(selectedUserId, newPin);
            const user = users.find(u => u.id === selectedUserId);
            if (success) {
              toast({ title: 'Conectat cu succes', description: `Bine ai venit, ${user?.name}!` });
              onLoginSuccess(user?.role as 'admin' | 'kitchen' | 'waiter');
            } else {
              toast({
                title: 'PIN incorect',
                variant: 'destructive',
              });
              setPin('');
            }
          }
        }, 100);
      }
    }
  };

  const handleBiometricAuth = () => {
    setIsBiometricScanning(true);
    setTimeout(() => {
      setIsBiometricScanning(false);
      if (selectedUserId) {
        const user = users.find(u => u.id === selectedUserId);
        login(selectedUserId, user?.pin || '');
        toast({ title: 'Autentificare biometrică reușită', description: `Bine ai venit, ${user?.name}!` });
        onLoginSuccess(user?.role as 'admin' | 'kitchen' | 'waiter');
      }
    }, 2000);
  };

  const handleNfcAuth = () => {
    setIsNfcScanning(true);
    setTimeout(() => {
      setIsNfcScanning(false);
      if (selectedUserId) {
        const user = users.find(u => u.id === selectedUserId);
        login(selectedUserId, user?.pin || '');
        toast({ title: 'Card NFC detectat', description: `Bine ai venit, ${user?.name}!` });
        onLoginSuccess(user?.role as 'admin' | 'kitchen' | 'waiter');
      }
    }, 1500);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 md:w-5 md:h-5" />;
      case 'kitchen': return <ChefHat className="w-4 h-4 md:w-5 md:h-5" />;
      default: return <User className="w-4 h-4 md:w-5 md:h-5" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'kitchen': return 'Bucătărie';
      default: return 'Ospătar';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'kitchen': return 'bg-orange-500/10 text-orange-600 border-orange-200';
      default: return 'bg-blue-500/10 text-blue-600 border-blue-200';
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/20 mb-4">
            <ChefHat className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            RestoSoft
          </h1>
          <p className="text-muted-foreground mt-2">Sistem de gestiune restaurant</p>
        </div>

        {!selectedUserId ? (
          /* User Selection Grid */
          <div className="bg-card rounded-3xl shadow-2xl shadow-black/5 p-6 border border-border/50">
            <h2 className="text-lg font-semibold mb-6 text-center">Selectează contul</h2>
            <div className="grid grid-cols-2 gap-3">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all duration-300",
                    "hover:border-primary hover:bg-primary/5 hover:shadow-lg hover:scale-[1.02]",
                    "flex flex-col items-center gap-2",
                    "border-border/50 bg-background",
                    "group"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-110",
                    getRoleColor(user.role)
                  )}>
                    {user.avatar}
                  </div>
                  <span className="font-medium text-sm text-foreground text-center">{user.name}</span>
                  <span className={cn(
                    "text-xs flex items-center gap-1.5 px-2 py-1 rounded-full",
                    getRoleColor(user.role)
                  )}>
                    {getRoleIcon(user.role)}
                    {getRoleLabel(user.role)}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                    PIN: {user.pin}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Auth Screen */
          <div className="bg-card rounded-3xl shadow-2xl shadow-black/5 p-6 border border-border/50">
            <button
              onClick={() => { setSelectedUserId(null); setPin(''); setAuthMethod('pin'); }}
              className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1 transition-colors"
            >
              ← Înapoi la selectare
            </button>
            
            {/* User Info */}
            <div className="text-center mb-6">
              <div className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-2xl mx-auto mb-3 transition-all",
                getRoleColor(selectedUser?.role || ''),
                "shadow-lg"
              )}>
                {selectedUser?.avatar}
              </div>
              <h2 className="text-xl font-semibold">{selectedUser?.name}</h2>
              <p className="text-sm text-muted-foreground">{getRoleLabel(selectedUser?.role || '')}</p>
            </div>

            {/* Auth Method Tabs */}
            <div className="flex gap-2 mb-6 bg-muted/50 p-1 rounded-xl">
              <button
                onClick={() => setAuthMethod('pin')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                  authMethod === 'pin' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Lock className="w-4 h-4" />
                PIN
              </button>
              <button
                onClick={() => setAuthMethod('biometric')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                  authMethod === 'biometric' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Fingerprint className="w-4 h-4" />
                Biometric
              </button>
              <button
                onClick={() => setAuthMethod('nfc')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                  authMethod === 'nfc' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Wifi className="w-4 h-4" />
                NFC
              </button>
            </div>

            {/* PIN Auth */}
            {authMethod === 'pin' && (
              <>
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <div className="flex gap-3">
                    {[0, 1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={cn(
                          "w-4 h-4 rounded-full transition-all duration-200",
                          i < pin.length 
                            ? "bg-primary scale-125 shadow-lg shadow-primary/30" 
                            : "bg-border"
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((num, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (num === '⌫') setPin(pin.slice(0, -1));
                        else if (num) handleNumberClick(num);
                      }}
                      disabled={!num}
                      className={cn(
                        "h-14 rounded-2xl font-semibold text-xl transition-all",
                        num === '⌫' 
                          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          : num 
                            ? "bg-muted hover:bg-primary hover:text-primary-foreground hover:scale-105 hover:shadow-lg active:scale-95"
                            : "invisible"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Biometric Auth */}
            {authMethod === 'biometric' && (
              <div className="text-center py-8">
                <div 
                  className={cn(
                    "w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center transition-all duration-500",
                    isBiometricScanning 
                      ? "bg-green-500/20 animate-pulse" 
                      : "bg-muted cursor-pointer hover:bg-primary/10"
                  )}
                  onClick={!isBiometricScanning ? handleBiometricAuth : undefined}
                >
                  <Fingerprint 
                    className={cn(
                      "w-16 h-16 transition-all duration-500",
                      isBiometricScanning 
                        ? "text-green-500 scale-110" 
                        : "text-muted-foreground"
                    )} 
                  />
                </div>
                <p className="text-muted-foreground">
                  {isBiometricScanning 
                    ? "Se scanează amprenta..." 
                    : "Apasă pentru autentificare biometrică"}
                </p>
                {isBiometricScanning && (
                  <div className="mt-4 flex justify-center gap-1">
                    {[0, 1, 2].map(i => (
                      <div 
                        key={i}
                        className="w-2 h-2 rounded-full bg-green-500 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* NFC Auth */}
            {authMethod === 'nfc' && (
              <div className="text-center py-8">
                <div 
                  className={cn(
                    "w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center relative transition-all duration-500",
                    isNfcScanning 
                      ? "bg-blue-500/20" 
                      : "bg-muted cursor-pointer hover:bg-primary/10"
                  )}
                  onClick={!isNfcScanning ? handleNfcAuth : undefined}
                >
                  <Smartphone 
                    className={cn(
                      "w-16 h-16 transition-all duration-500",
                      isNfcScanning 
                        ? "text-blue-500" 
                        : "text-muted-foreground"
                    )} 
                  />
                  {isNfcScanning && (
                    <>
                      <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-ping opacity-30" />
                      <div className="absolute inset-2 rounded-full border-2 border-blue-400 animate-ping opacity-20" style={{ animationDelay: '0.2s' }} />
                      <div className="absolute inset-4 rounded-full border-2 border-blue-300 animate-ping opacity-10" style={{ animationDelay: '0.4s' }} />
                    </>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {isNfcScanning 
                    ? "Se detectează cardul NFC..." 
                    : "Apropie cardul NFC pentru autentificare"}
                </p>
              </div>
            )}

            {/* Help text */}
            <p className="text-xs text-center text-muted-foreground mt-6 bg-muted/50 py-2 rounded-lg">
              PIN demonstrativ: <span className="font-mono font-medium">{selectedUser?.pin}</span>
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          RestoPOS v2.0 • © 2024
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
