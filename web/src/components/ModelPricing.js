import React, { useContext, useEffect, useRef, useState } from 'react';
import { API, copy, useShowError, showSuccess } from '../helpers';

import {
  Banner,
  Input,
  Layout,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
} from '@douyinfe/semi-ui';
import { stringToColor } from '../helpers/render.js';
import { UserContext } from '../context/User/index.js';
import Text from '@douyinfe/semi-ui/lib/es/typography/text';
import { useTranslation } from 'react-i18next';

const ModelPricing = () => {
  const showError = useShowError();
  const { t } = useTranslation();
  const [filteredValue, setFilteredValue] = useState([]);
  const compositionRef = useRef({ isComposition: false });

  const handleChange = (value) => {
    if (compositionRef.current.isComposition) {
      return;
    }
    const newFilteredValue = value ? [value] : [];
    setFilteredValue(newFilteredValue);
  };
  const handleCompositionStart = () => {
    compositionRef.current.isComposition = true;
  };

  const handleCompositionEnd = (event) => {
    compositionRef.current.isComposition = false;
    const value = event.target.value;
    const newFilteredValue = value ? [value] : [];
    setFilteredValue(newFilteredValue);
  };

  function renderQuotaType(type) {
    // Ensure all cases are string literals by adding quotes.
    switch (type) {
      case 1:
        return (
          <Tag color='green' size='large'>
            {t('components.ModelPricing.quotaType.perUsage')}
          </Tag>
        );
      case 0:
        return (
          <Tag color='blue' size='large'>
            {t('components.ModelPricing.quotaType.perQuantity')}
          </Tag>
        );
      default:
        return (
          <Tag color='white' size='large'>
            {t('components.ModelPricing.quotaType.unknown')}
          </Tag>
        );
    }
  }

  function renderAvailable(available) {
    return available ? (
      <Tag color='green' size='large'>
        {t('components.ModelPricing.available')}
      </Tag>
    ) : (
      <Tooltip content={t('components.ModelPricing.unavailableTooltip')}>
        <Tag color='red' size='large'>
          {t('components.ModelPricing.unavailable')}
        </Tag>
      </Tooltip>
    );
  }

  const columns = [
    {
      title: t('components.ModelPricing.columns.availability'),
      dataIndex: 'available',
      render: (text, record, index) => {
        return renderAvailable(text);
      },
      sorter: (a, b) => a.available - b.available,
    },
    {
      title: (
        <Space>
          <span>{t('components.ModelPricing.columns.modelName')}</span>
          <Input
            placeholder={t('components.ModelPricing.columns.searchPlaceholder')}
            style={{ width: 200 }}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onChange={handleChange}
            showClear
          />
        </Space>
      ),
      dataIndex: 'model_name', // 以finish_time作为dataIndex
      render: (text, record, index) => {
        return (
          <>
            <Tag
              color={stringToColor(text)}
              size='large'
              onClick={() => {
                copyText(text);
              }}
            >
              {text}
            </Tag>
          </>
        );
      },
      onFilter: (value, record) => record.model_name.includes(value),
      filteredValue,
    },
    {
      title: t('components.ModelPricing.columns.billingType'),
      dataIndex: 'quota_type',
      render: (text, record, index) => {
        return renderQuotaType(parseInt(text));
      },
      sorter: (a, b) => a.quota_type - b.quota_type,
    },
    {
      title: t('components.ModelPricing.columns.modelRatio'),
      dataIndex: 'model_ratio',
      render: (text, record, index) => {
        return <div>{record.quota_type === 0 ? text : 'N/A'}</div>;
      },
    },
    {
      title: t('components.ModelPricing.columns.completionRatio'),
      dataIndex: 'completion_ratio',
      render: (text, record, index) => {
        let ratio = parseFloat(text.toFixed(3));
        return <div>{record.quota_type === 0 ? ratio : 'N/A'}</div>;
      },
    },
    {
      title: t('components.ModelPricing.columns.modelPrice'),
      dataIndex: 'model_price',
      render: (text, record, index) => {
        let content = text;
        if (record.quota_type === 0) {
          let inputRatioPrice = record.model_ratio * 2.0 * record.group_ratio;
          let completionRatioPrice =
            record.model_ratio *
            record.completion_ratio *
            2.0 *
            record.group_ratio;
          content = (
            <>
              <Text>
                {t('components.ModelPricing.columns.promptPrice')} $
                {inputRatioPrice} / 1M tokens
              </Text>
              <br />
              <Text>
                {t('components.ModelPricing.columns.completionPrice')} $
                {completionRatioPrice} / 1M tokens
              </Text>
            </>
          );
        } else {
          let price = parseFloat(text) * record.group_ratio;
          content = (
            <>
              {t('components.ModelPricing.columns.modelPriceLabel')} ${price}
            </>
          );
        }
        return <div>{content}</div>;
      },
    },
  ];

  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userState, userDispatch] = useContext(UserContext);
  const [groupRatio, setGroupRatio] = useState(1);

  const setModelsFormat = (models, groupRatio) => {
    for (let i = 0; i < models.length; i++) {
      models[i].key = i;
      models[i].group_ratio = groupRatio;
    }
    // sort by quota_type
    models.sort((a, b) => {
      return a.quota_type - b.quota_type;
    });

    // sort by model_name, start with gpt is max, other use localeCompare
    models.sort((a, b) => {
      if (a.model_name.startsWith('gpt') && !b.model_name.startsWith('gpt')) {
        return -1;
      } else if (
        !a.model_name.startsWith('gpt') &&
        b.model_name.startsWith('gpt')
      ) {
        return 1;
      } else {
        return a.model_name.localeCompare(b.model_name);
      }
    });

    setModels(models);
  };

  const loadPricing = async () => {
    setLoading(true);

    let url = '';
    url = `/api/pricing`;
    const res = await API.get(url);
    const { success, message, data, group_ratio } = res.data;
    if (success) {
      setGroupRatio(group_ratio);
      setModelsFormat(data, group_ratio);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const refresh = async () => {
    await loadPricing();
  };

  const copyText = async (text) => {
    if (await copy(text)) {
      showSuccess(t('components.ModelPricing.copySuccess') + text);
    } else {
      // setSearchKeyword(text);
      Modal.error({
        title: t('components.ModelPricing.copyErrorTitle'),
        content: text,
      });
    }
  };

  useEffect(() => {
    refresh().then();
  }, []);

  return (
    <>
      <Layout>
        {userState.user ? (
          <Banner
            type='info'
            description={t('components.ModelPricing.userGroupInfo', {
              group: userState.user.group,
              groupRatio,
            })}
          />
        ) : (
          <Banner
            type='warning'
            description={t('components.ModelPricing.notLoggedIn', {
              groupRatio,
            })}
          />
        )}
        <Table
          style={{ marginTop: 5 }}
          columns={columns}
          dataSource={models}
          loading={loading}
          pagination={{
            pageSize: models.length,
            showSizeChanger: false,
          }}
        />
      </Layout>
    </>
  );
};

export default ModelPricing;
