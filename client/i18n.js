const NextI18Next = require('next-i18next').default;
const path = require('path');

const NextI18NextInstance = new NextI18Next({
  otherLanguages: [],
  defaultLanguage: 'en',
  localePath: path.resolve('./public/locales'),
});

export default NextI18NextInstance;

export const {
  appWithTranslation,
  Link,
  Trans,
  config,
  withTranslation,
  i18n,
} = NextI18NextInstance;
