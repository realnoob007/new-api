import React from 'react';
import { useTranslation } from 'react-i18next';
import { Message } from 'semantic-ui-react';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <>
      <Message negative>
        <Message.Header>{t('pages.NotFound.pageNotFound')}</Message.Header>
        <p>{t('pages.NotFound.checkAddress')}</p>
      </Message>
    </>
  );
};

export default NotFound;
