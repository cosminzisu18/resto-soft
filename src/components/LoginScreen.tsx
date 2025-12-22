import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { users } from '@/data/mockData';
import { useRestaurant } from '@/context/RestaurantContext';
import { cn } from '@/lib/utils';
import { Lock, ChefHat, User, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const { login } = useRestaurant();
  const { toast } = useToast();

  const handlePinSubmit = () => {
    if (!selectedUserId) return;
    
    const success = login(selectedUserId, pin);
    if (success) {
      toast({
        title: 'Conectat cu succes',
        description: 'Bine ai venit!',
      });
      onLoginSuccess();
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
            if (success) {
              toast({ title: 'Conectat cu succes' });
              onLoginSuccess();
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-5 h-5" />;
      case 'kitchen': return <ChefHat className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'kitchen': return 'Bucătărie';
      default: return 'Ospătar';
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-lg mb-4">
            <ChefHat className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">RestoPOS</h1>
          <p className="text-muted-foreground mt-2">Sistem de gestiune restaurant</p>
        </div>

        {!selectedUserId ? (
          <div className="bg-card rounded-2xl shadow-xl p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4 text-center">Selectează contul</h2>
            <div className="grid grid-cols-2 gap-3">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-200",
                    "hover:border-primary hover:bg-primary/5",
                    "flex flex-col items-center gap-2",
                    "border-border bg-background"
                  )}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {user.avatar}
                  </div>
                  <span className="font-medium text-sm text-foreground">{user.name}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {getRoleIcon(user.role)}
                    {getRoleLabel(user.role)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl shadow-xl p-6 border border-border">
            <button
              onClick={() => { setSelectedUserId(null); setPin(''); }}
              className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
            >
              ← Înapoi
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl mx-auto mb-3">
                {selectedUser?.avatar}
              </div>
              <h2 className="text-lg font-semibold">{selectedUser?.name}</h2>
              <p className="text-sm text-muted-foreground">{getRoleLabel(selectedUser?.role || '')}</p>
            </div>

            <div className="flex items-center justify-center gap-3 mb-6">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-2">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all",
                      i < pin.length ? "bg-primary scale-110" : "bg-border"
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
                    "h-14 rounded-xl font-semibold text-xl transition-all",
                    num === '⌫' 
                      ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                      : num 
                        ? "bg-secondary hover:bg-primary hover:text-primary-foreground"
                        : "invisible"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          PIN demo: Admin (0000), Maria (1234), Ion (5678)
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
