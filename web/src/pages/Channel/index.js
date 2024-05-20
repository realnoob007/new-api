import React from 'react';
import ChannelsTable from '../../components/ChannelsTable';
import { Layout } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

const File = () => {
  const { t } = useTranslation();

  return (
    <>
      <Layout>
        <Layout.Header>
          <h3>{t('pages.Channel.index.manageChannels')}</h3>
        </Layout.Header>
        <Layout.Content>
          <ChannelsTable />
        </Layout.Content>
      </Layout>
    </>
  );
};

export default File;
