import React from 'react';

import { Logo } from '@components';

export const Header: React.FC = () => {
  return (
    <div className='bg-gray-800 text-left'>
      <Logo />
    </div>
  );
};
