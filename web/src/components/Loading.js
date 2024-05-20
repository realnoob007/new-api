import React from 'react';
import { useTranslation } from 'react-i18next';
import { Spin } from '@douyinfe/semi-ui';

const Loading = ({ prompt: name = 'page' }) => {
  const { t } = useTranslation();

  return (
    <Spin style={{ height: 100 }} spinning={true}>
      {t('components.Loading.loading', { name })}
    </Spin>
  );
};

export default Loading;
