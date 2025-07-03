import React, { useState } from 'react';
import GoogleAuth from './GoogleAuth';

interface AuthSelectorProps {
  onLoginSuccess: (user: any) => void;
  onLoginFailure: (error: any) => void;
}

const AuthSelector: React.FC<AuthSelectorProps> = ({ onLoginSuccess, onLoginFailure }) => {
  return (
    <div className="bg-white shadow-card rounded-lg p-4 sm:p-8 max-w-md w-full">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-center">Добро пожаловать</h2>
      
      <div className="text-center">
        <p className="text-neutral-600 mb-4 sm:mb-8">
          Войдите с помощью аккаунта Google для работы с вашими таблицами.
        </p>
        <GoogleAuth onLoginSuccess={onLoginSuccess} onLoginFailure={onLoginFailure} />
      </div>
    </div>
  );
};

export default AuthSelector; 