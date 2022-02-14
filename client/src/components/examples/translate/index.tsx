import React from 'react';
import { TFunction } from 'next-i18next';

import { withTranslation } from '@i18n';
import i18n from '@i18n';

/**
 * This component is generated as en example usage of next-i18next
 *
 * To learn more about next-i18next and i18n
 * please visit https://github.com/isaachinman/next-i18next
 */

const I18NExampleComponent: React.FC<{ t: TFunction }> = ({ t }) => {
  const changeLanguage = () => {
    i18n.i18n.changeLanguage(i18n.i18n.language === 'tr' ? 'en' : 'tr');
  };
  return (
    <div>
      <header>
        <h2>{t`home:title`}</h2>
        <div>
          <button onClick={changeLanguage}>{t(`common:language.en`)}</button>
          <button onClick={changeLanguage}>{t(`common:language.tr`)}</button>
        </div>
      </header>
      <main>
        <p>{t('common:greet', { name: t`common:world` })}</p>
        <p>{t`home:someText`}</p>
      </main>
      <footer>
        <a
          href='https://github.com/isaachinman/next-i18next'
          target='_blank'
          rel='noopener noreferrer'
        >
          {t`common:documentation`}
        </a>
      </footer>
    </div>
  );
};

export const I18NExample = withTranslation(['common', 'home'])(
  I18NExampleComponent
);
