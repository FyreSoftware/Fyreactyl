import React from 'react';

import { SuccessButton, PrimaryButton } from '@components';

import { TFunction } from 'next-i18next';

import { withTranslation } from '@i18n';

const MainComponent: React.FC<{ t: TFunction }> = ({ t }) => {
  return (
    <div className='flex text-center font-light py-5 bg-gray-700'>
      <div className='container mx-auto'>
        <h1 className='text-white text-8xl mb-2'>{t('name')}</h1>
        <p className='text-lg text-white mb-3'>{t('description')}</p>
        <div className='gap-6'>
          <SuccessButton type='button'>
            <a href='/login'>Login</a>
          </SuccessButton>
          <PrimaryButton type='button'>
            <a href='/signup'>Sign up</a>
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export const Main = withTranslation(['home'])(MainComponent);
