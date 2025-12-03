import React, { useState } from 'react';
import { User } from '../types';
import { MOCK_USERS } from '../constants';
import { Coffee, Lock, User as UserIcon } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Normalize input: remove spaces and convert to lowercase for email
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim(); // Optional: password usually cares about case, but spaces at ends are often mistakes

    const user = MOCK_USERS.find(u => 
      (u.email.toLowerCase() === cleanEmail || u.id === cleanEmail) && 
      u.password === password // Password case sensitive usually, keeping it simple as '123'
    );

    if (user) {
      onLogin(user);
    } else {
      setError('Credenciales inválidas. Verifique espacios o mayúsculas.');
      console.log('Login failed for:', cleanEmail);
    }
  };

  return (
    <div className="min-h-screen bg-coffee-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-coffee-200">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-coffee-500 p-4 rounded-full mb-4">
            <Coffee className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-coffee-900">Control de Alfajores</h1>
          <p className="text-gray-500">Sistema de Gestión</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email o ID</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                placeholder="ej. admin@cafe.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-500 focus:border-transparent outline-none"
                placeholder="••••••"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded border border-red-100">{error}</p>}

          <button
            type="submit"
            className="w-full bg-coffee-600 hover:bg-coffee-700 text-white font-bold py-3 rounded-lg transition-colors duration-200 shadow-lg"
          >
            Ingresar
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400 bg-gray-50 p-4 rounded-lg border border-gray-100">
          <p className="font-semibold mb-2">Credenciales Demo:</p>
          <div className="grid grid-cols-1 gap-1">
            <p><span className="font-bold">Admin:</span> admin@cafe.com / 123</p>
            <p><span className="font-bold">Cajero:</span> cajero@cafe.com / 123</p>
            <p><span className="font-bold">Almacén:</span> almacen@cafe.com / 123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;