import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (phone: string, otp: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('fitzone_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('fitzone_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fitzone_user');
    }
  }, [user]);

  // Mock Login Function
  const login = async (phone: string, _otp: string) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock Logic: 
    // If phone is '9999999999', they are admin. Otherwise, member.
    // Accept any OTP for this mock.
    if (phone === '9999999999' || phone === '+919999999999') {
      setUser({
        id: 'admin_1',
        phone: phone,
        role: 'admin',
        name: 'Gym Owner',
      });
    } else {
      setUser({
        id: 'member_mock_' + phone.slice(-4),
        phone: phone,
        role: 'member',
        name: 'Member ' + phone.slice(-4),
      });
    }
    
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
