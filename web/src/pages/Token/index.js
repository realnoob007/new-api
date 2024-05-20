import React from 'react';
import TokensTable from '../../components/TokensTable';
import { Layout } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

const Token = () => {
  const { t } = useTranslation();

  return (
    <>
      <Layout>
        <Layout.Header>
          <h3>{t('pages.Token.index.myTokens')}</h3>
        </Layout.Header>
        <Layout.Content>
          <TokensTable />
        </Layout.Content>
      </Layout>
    </>
  );
};

export default Token;
