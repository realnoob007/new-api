import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  API,
  isMobile,
  shouldShowPrompt,
  useShowError,
  showInfo,
  showSuccess,
  showWarning,
  timestamp2string,
} from '../helpers';

import { CHANNEL_OPTIONS, ITEMS_PER_PAGE } from '../constants';
import {
  renderGroup,
  renderNumberWithPoint,
  renderQuota,
} from '../helpers/render';
import {
  Button,
  Dropdown,
  Form,
  InputNumber,
  Popconfirm,
  Space,
  SplitButtonGroup,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from '@douyinfe/semi-ui';
import EditChannel from '../pages/Channel/EditChannel';
import { IconTreeTriangleDown } from '@douyinfe/semi-icons';
import { loadChannelModels } from './utils.js';

function renderTimestamp(timestamp) {
  return <>{timestamp2string(timestamp)}</>;
}

let type2label = undefined;

const ChannelsTable = () => {
  const showError = useShowError();
  const { t } = useTranslation();

  function renderType(type) {
    if (!type2label) {
      type2label = new Map();
      for (let i = 0; i < CHANNEL_OPTIONS.length; i++) {
        type2label[CHANNEL_OPTIONS[i].value] = CHANNEL_OPTIONS[i];
      }
      type2label[0] = {
        value: 0,
        text: t('components.ChannelsTable.unknownType'),
        color: 'grey',
      };
    }
    return (
      <Tag size='large' color={type2label[type]?.color}>
        {type2label[type]?.text}
      </Tag>
    );
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
    },
    {
      title: t('components.ChannelsTable.name'),
      dataIndex: 'name',
    },
    {
      title: t('components.ChannelsTable.group'),
      dataIndex: 'group',
      render: (text, record, index) => {
        return (
          <div>
            <Space spacing={2}>
              {text.split(',').map((item, index) => {
                return renderGroup(item);
              })}
            </Space>
          </div>
        );
      },
    },
    {
      title: t('components.ChannelsTable.type'),
      dataIndex: 'type',
      render: (text, record, index) => {
        return <div>{renderType(text)}</div>;
      },
    },
    {
      title: t('components.ChannelsTable.status'),
      dataIndex: 'status',
      render: (text, record, index) => {
        return <div>{renderStatus(text)}</div>;
      },
    },
    {
      title: t('components.ChannelsTable.responseTime'),
      dataIndex: 'response_time',
      render: (text, record, index) => {
        return <div>{renderResponseTime(text)}</div>;
      },
    },
    {
      title: t('components.ChannelsTable.quotaUsedRemaining'),
      dataIndex: 'expired_time',
      render: (text, record, index) => {
        return (
          <div>
            <Space spacing={1}>
              <Tooltip content={t('components.ChannelsTable.quotaUsed')}>
                <Tag color='white' type='ghost' size='large'>
                  {renderQuota(record.used_quota)}
                </Tag>
              </Tooltip>
              <Tooltip
                content={t('components.ChannelsTable.quotaRemaining', {
                  balance: record.balance,
                })}
              >
                <Tag
                  color='white'
                  type='ghost'
                  size='large'
                  onClick={() => {
                    updateChannelBalance(record);
                  }}
                >
                  ${renderNumberWithPoint(record.balance)}
                </Tag>
              </Tooltip>
            </Space>
          </div>
        );
      },
    },
    {
      title: t('components.ChannelsTable.priority'),
      dataIndex: 'priority',
      render: (text, record, index) => {
        return (
          <div>
            <InputNumber
              style={{ width: 70 }}
              name='priority'
              onBlur={(e) => {
                manageChannel(record.id, 'priority', record, e.target.value);
              }}
              keepFocus={true}
              innerButtons
              defaultValue={record.priority}
              min={-999}
            />
          </div>
        );
      },
    },
    {
      title: t('components.ChannelsTable.weight'),
      dataIndex: 'weight',
      render: (text, record, index) => {
        return (
          <div>
            <InputNumber
              style={{ width: 70 }}
              name='weight'
              onBlur={(e) => {
                manageChannel(record.id, 'weight', record, e.target.value);
              }}
              keepFocus={true}
              innerButtons
              defaultValue={record.weight}
              min={0}
            />
          </div>
        );
      },
    },
    {
      title: '',
      dataIndex: 'operate',
      render: (text, record, index) => (
        <div>
          <SplitButtonGroup
            style={{ marginRight: 1 }}
            aria-label={t('components.ChannelsTable.testActions')}
          >
            <Button
              theme='light'
              onClick={() => {
                testChannel(record, '');
              }}
            >
              {t('components.ChannelsTable.test')}
            </Button>
            <Dropdown
              trigger='click'
              position='bottomRight'
              menu={record.test_models}
            >
              <Button
                style={{ padding: '8px 4px' }}
                type='primary'
                icon={<IconTreeTriangleDown />}
              ></Button>
            </Dropdown>
          </SplitButtonGroup>
          <Popconfirm
            title={t('components.ChannelsTable.confirmDelete')}
            content={t('components.ChannelsTable.deleteWarning')}
            okType={'danger'}
            position={'left'}
            onConfirm={() => {
              manageChannel(record.id, 'delete', record).then(() => {
                removeRecord(record.id);
              });
            }}
          >
            <Button theme='light' type='danger' style={{ marginRight: 1 }}>
              {t('components.ChannelsTable.delete')}
            </Button>
          </Popconfirm>
          {record.status === 1 ? (
            <Button
              theme='light'
              type='warning'
              style={{ marginRight: 1 }}
              onClick={async () => {
                manageChannel(record.id, 'disable', record);
              }}
            >
              {t('components.ChannelsTable.disable')}
            </Button>
          ) : (
            <Button
              theme='light'
              type='secondary'
              style={{ marginRight: 1 }}
              onClick={async () => {
                manageChannel(record.id, 'enable', record);
              }}
            >
              {t('components.ChannelsTable.enable')}
            </Button>
          )}
          <Button
            theme='light'
            type='tertiary'
            style={{ marginRight: 1 }}
            onClick={() => {
              setEditingChannel(record);
              setShowEdit(true);
            }}
          >
            {t('components.ChannelsTable.edit')}
          </Button>
          <Popconfirm
            title={t('components.ChannelsTable.confirmCopy')}
            content={t('components.ChannelsTable.copyWarning')}
            okType={'danger'}
            position={'left'}
            onConfirm={async () => {
              copySelectedChannel(record.id);
            }}
          >
            <Button theme='light' type='primary' style={{ marginRight: 1 }}>
              {t('components.ChannelsTable.copy')}
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [idSort, setIdSort] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchGroup, setSearchGroup] = useState('');
  const [searchModel, setSearchModel] = useState('');
  const [searching, setSearching] = useState(false);
  const [updatingBalance, setUpdatingBalance] = useState(false);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [showPrompt, setShowPrompt] = useState(
    shouldShowPrompt('channel-test'),
  );
  const [channelCount, setChannelCount] = useState(pageSize);
  const [groupOptions, setGroupOptions] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [enableBatchDelete, setEnableBatchDelete] = useState(false);
  const [editingChannel, setEditingChannel] = useState({
    id: undefined,
  });
  const [selectedChannels, setSelectedChannels] = useState([]);

  const removeRecord = (id) => {
    let newDataSource = [...channels];
    if (id != null) {
      let idx = newDataSource.findIndex((data) => data.id === id);

      if (idx > -1) {
        newDataSource.splice(idx, 1);
        setChannels(newDataSource);
      }
    }
  };

  const setChannelFormat = (channels) => {
    for (let i = 0; i < channels.length; i++) {
      if (channels[i].type === 8) {
        showWarning(t('components.ChannelsTable.customChannelWarning1'));
        showWarning(t('components.ChannelsTable.customChannelWarning2'));
      }
      channels[i].key = '' + channels[i].id;
      let test_models = [];
      channels[i].models.split(',').forEach((item, index) => {
        test_models.push({
          node: 'item',
          name: item,
          onClick: () => {
            testChannel(channels[i], item);
          },
        });
      });
      channels[i].test_models = test_models;
    }
    setChannels(channels);
    if (channels.length >= pageSize) {
      setChannelCount(channels.length + pageSize);
    } else {
      setChannelCount(channels.length);
    }
  };

  const loadChannels = async (startIdx, pageSize, idSort) => {
    setLoading(true);
    const res = await API.get(
      `/api/channel/?p=${startIdx}&page_size=${pageSize}&id_sort=${idSort}`,
    );
    if (res === undefined) {
      return;
    }
    const { success, message, data } = res.data;
    if (success) {
      if (startIdx === 0) {
        setChannelFormat(data);
      } else {
        let newChannels = [...channels];
        newChannels.splice(startIdx * pageSize, data.length, ...data);
        setChannelFormat(newChannels);
      }
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const copySelectedChannel = async (id) => {
    const channelToCopy = channels.find(
      (channel) => String(channel.id) === String(id),
    );
    console.log(channelToCopy);
    channelToCopy.name += t('components.ChannelsTable.copySuffix');
    channelToCopy.created_time = null;
    channelToCopy.balance = 0;
    channelToCopy.used_quota = 0;
    if (!channelToCopy) {
      showError(t('components.ChannelsTable.channelNotFound'));
      return;
    }
    try {
      const newChannel = { ...channelToCopy, id: undefined };
      const response = await API.post('/api/channel/', newChannel);
      if (response.data.success) {
        showSuccess(t('components.ChannelsTable.copySuccess'));
        await refresh();
      } else {
        showError(response.data.message);
      }
    } catch (error) {
      showError(t('components.ChannelsTable.copyFailed') + error.message);
    }
  };

  const refresh = async () => {
    await loadChannels(activePage - 1, pageSize, idSort);
  };

  useEffect(() => {
    const localIdSort = localStorage.getItem('id-sort') === 'true';
    const localPageSize =
      parseInt(localStorage.getItem('page-size')) || ITEMS_PER_PAGE;
    setIdSort(localIdSort);
    setPageSize(localPageSize);
    loadChannels(0, localPageSize, localIdSort)
      .then()
      .catch((reason) => {
        showError(reason);
      });
    fetchGroups().then();
    loadChannelModels().then();
  }, []);

  const manageChannel = async (id, action, record, value) => {
    let data = { id };
    let res;
    switch (action) {
      case 'delete':
        res = await API.delete(`/api/channel/${id}/`);
        break;
      case 'enable':
        data.status = 1;
        res = await API.put('/api/channel/', data);
        break;
      case 'disable':
        data.status = 2;
        res = await API.put('/api/channel/', data);
        break;
      case 'priority':
        if (value === '') {
          return;
        }
        data.priority = parseInt(value);
        res = await API.put('/api/channel/', data);
        break;
      case 'weight':
        if (value === '') {
          return;
        }
        data.weight = parseInt(value);
        if (data.weight < 0) {
          data.weight = 0;
        }
        res = await API.put('/api/channel/', data);
        break;
    }
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('components.ChannelsTable.operationSuccess'));
      let channel = res.data.data;
      let newChannels = [...channels];
      if (action === 'delete') {
      } else {
        record.status = channel.status;
      }
      setChannels(newChannels);
    } else {
      showError(message);
    }
  };

  const renderStatus = (status) => {
    switch (status) {
      case 1:
        return (
          <Tag size='large' color='green'>
            {t('components.ChannelsTable.statusEnabled')}
          </Tag>
        );
      case 2:
        return (
          <Tag size='large' color='yellow'>
            {t('components.ChannelsTable.statusDisabled')}
          </Tag>
        );
      case 3:
        return (
          <Tag size='large' color='yellow'>
            {t('components.ChannelsTable.statusAutoDisabled')}
          </Tag>
        );
      default:
        return (
          <Tag size='large' color='grey'>
            {t('components.ChannelsTable.statusUnknown')}
          </Tag>
        );
    }
  };

  const renderResponseTime = (responseTime) => {
    const time =
      (responseTime / 1000).toFixed(2) + t('components.ChannelsTable.seconds');
    if (responseTime === 0) {
      return (
        <Tag size='large' color='grey'>
          {t('components.ChannelsTable.statusNotTested')}
        </Tag>
      );
    } else if (responseTime <= 1000) {
      return (
        <Tag size='large' color='green'>
          {time}
        </Tag>
      );
    } else if (responseTime <= 3000) {
      return (
        <Tag size='large' color='lime'>
          {time}
        </Tag>
      );
    } else if (responseTime <= 5000) {
      return (
        <Tag size='large' color='yellow'>
          {time}
        </Tag>
      );
    } else {
      return (
        <Tag size='large' color='red'>
          {time}
        </Tag>
      );
    }
  };

  const searchChannels = async (searchKeyword, searchGroup, searchModel) => {
    if (searchKeyword === '' && searchGroup === '' && searchModel === '') {
      // if keyword is blank, load files instead.
      await loadChannels(0, pageSize, idSort);
      setActivePage(1);
      return;
    }
    setSearching(true);
    const res = await API.get(
      `/api/channel/search?keyword=${searchKeyword}&group=${searchGroup}&model=${searchModel}`,
    );
    const { success, message, data } = res.data;
    if (success) {
      setChannels(data);
      setActivePage(1);
    } else {
      showError(message);
    }
    setSearching(false);
  };

  const testChannel = async (record, model) => {
    const res = await API.get(`/api/channel/test/${record.id}?model=${model}`);
    const { success, message, time } = res.data;
    if (success) {
      record.response_time = time * 1000;
      record.test_time = Date.now() / 1000;
      showInfo(
        t('components.ChannelsTable.testSuccess', {
          name: record.name,
          time: time.toFixed(2),
        }),
      );
    } else {
      showError(message);
    }
  };

  const testAllChannels = async () => {
    const res = await API.get(`/api/channel/test`);
    const { success, message } = res.data;
    if (success) {
      showInfo(t('components.ChannelsTable.testAllSuccess'));
    } else {
      showError(message);
    }
  };

  const deleteAllDisabledChannels = async () => {
    const res = await API.delete(`/api/channel/disabled`);
    const { success, message, data } = res.data;
    if (success) {
      showSuccess(
        t('components.ChannelsTable.deleteAllSuccess', { count: data }),
      );
      await refresh();
    } else {
      showError(message);
    }
  };

  const updateChannelBalance = async (record) => {
    const res = await API.get(`/api/channel/update_balance/${record.id}/`);
    const { success, message, balance } = res.data;
    if (success) {
      record.balance = balance;
      record.balance_updated_time = Date.now() / 1000;
      showInfo(
        t('components.ChannelsTable.updateBalanceSuccess', {
          name: record.name,
        }),
      );
    } else {
      showError(message);
    }
  };

  const updateAllChannelsBalance = async () => {
    setUpdatingBalance(true);
    const res = await API.get(`/api/channel/update_balance`);
    const { success, message } = res.data;
    if (success) {
      showInfo(t('components.ChannelsTable.updateAllBalanceSuccess'));
    } else {
      showError(message);
    }
    setUpdatingBalance(false);
  };

  const batchDeleteChannels = async () => {
    if (selectedChannels.length === 0) {
      showError(t('components.ChannelsTable.selectChannelsToDelete'));
      return;
    }
    setLoading(true);
    let ids = [];
    selectedChannels.forEach((channel) => {
      ids.push(channel.id);
    });
    const res = await API.post(`/api/channel/batch`, { ids: ids });
    const { success, message, data } = res.data;
    if (success) {
      showSuccess(
        t('components.ChannelsTable.batchDeleteSuccess', { count: data }),
      );
      await refresh();
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const fixChannelsAbilities = async () => {
    const res = await API.post(`/api/channel/fix`);
    const { success, message, data } = res.data;
    if (success) {
      showSuccess(
        t('components.ChannelsTable.fixDatabaseSuccess', { count: data }),
      );
      await refresh();
    } else {
      showError(message);
    }
  };

  let pageData = channels.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );

  const handlePageChange = (page) => {
    setActivePage(page);
    if (page === Math.ceil(channels.length / pageSize) + 1) {
      loadChannels(page - 1, pageSize, idSort).then((r) => {});
    }
  };

  const handlePageSizeChange = async (size) => {
    localStorage.setItem('page-size', size + '');
    setPageSize(size);
    setActivePage(1);
    loadChannels(0, size, idSort)
      .then()
      .catch((reason) => {
        showError(reason);
      });
  };

  const fetchGroups = async () => {
    try {
      let res = await API.get(`/api/group/`);
      if (res === undefined) {
        return;
      }
      setGroupOptions(
        res.data.data.map((group) => ({
          label: group,
          value: group,
        })),
      );
    } catch (error) {
      showError(error.message);
    }
  };

  const closeEdit = () => {
    setShowEdit(false);
  };

  const handleRow = (record, index) => {
    if (record.status !== 1) {
      return {
        style: {
          background: 'var(--semi-color-disabled-border)',
        },
      };
    } else {
      return {};
    }
  };

  return (
    <>
      <EditChannel
        refresh={refresh}
        visible={showEdit}
        handleClose={closeEdit}
        editingChannel={editingChannel}
      />
      <Form
        onSubmit={() => {
          searchChannels(searchKeyword, searchGroup, searchModel);
        }}
        labelPosition='left'
      >
        <div style={{ display: 'flex' }}>
          <Space>
            <Form.Input
              field='search_keyword'
              label={t('components.ChannelsTable.searchKeyword')}
              placeholder={t(
                'components.ChannelsTable.searchKeywordPlaceholder',
              )}
              value={searchKeyword}
              loading={searching}
              onChange={(v) => {
                setSearchKeyword(v.trim());
              }}
            />
            <Form.Input
              field='search_model'
              label={t('components.ChannelsTable.searchModel')}
              placeholder={t('components.ChannelsTable.searchModelPlaceholder')}
              value={searchModel}
              loading={searching}
              onChange={(v) => {
                setSearchModel(v.trim());
              }}
            />
            <Form.Select
              field='group'
              label={t('components.ChannelsTable.group')}
              optionList={groupOptions}
              onChange={(v) => {
                setSearchGroup(v);
                searchChannels(searchKeyword, v, searchModel);
              }}
            />
            <Button
              label={t('components.ChannelsTable.search')}
              type='primary'
              htmlType='submit'
              className='btn-margin-right'
              style={{ marginRight: 8 }}
            >
              {t('components.ChannelsTable.search')}
            </Button>
          </Space>
        </div>
      </Form>
      <div style={{ marginTop: 10, display: 'flex' }}>
        <Space>
          <Space>
            <Typography.Text strong>
              {t('components.ChannelsTable.useIdSort')}
            </Typography.Text>
            <Switch
              checked={idSort}
              label={t('components.ChannelsTable.useIdSort')}
              uncheckedText={t('components.ChannelsTable.off')}
              aria-label={t('components.ChannelsTable.useIdSortAria')}
              onChange={(v) => {
                localStorage.setItem('id-sort', v + '');
                setIdSort(v);
                loadChannels(0, pageSize, v)
                  .then()
                  .catch((reason) => {
                    showError(reason);
                  });
              }}
            ></Switch>
          </Space>
        </Space>
      </div>

      <Table
        className={'channel-table'}
        style={{ marginTop: 15 }}
        columns={columns}
        dataSource={pageData}
        pagination={{
          currentPage: activePage,
          pageSize: pageSize,
          total: channelCount,
          pageSizeOpts: [10, 20, 50, 100],
          showSizeChanger: true,
          formatPageText: (page) => '',
          onPageSizeChange: (size) => {
            handlePageSizeChange(size).then();
          },
          onPageChange: handlePageChange,
        }}
        loading={loading}
        onRow={handleRow}
        rowSelection={
          enableBatchDelete
            ? {
                onChange: (selectedRowKeys, selectedRows) => {
                  setSelectedChannels(selectedRows);
                },
              }
            : null
        }
      />
      <div
        style={{
          display: isMobile() ? '' : 'flex',
          marginTop: isMobile() ? 0 : -45,
          zIndex: 999,
          position: 'relative',
          pointerEvents: 'none',
        }}
      >
        <Space
          style={{ pointerEvents: 'auto', marginTop: isMobile() ? 0 : 45 }}
        >
          <Button
            theme='light'
            type='primary'
            style={{ marginRight: 8 }}
            onClick={() => {
              setEditingChannel({
                id: undefined,
              });
              setShowEdit(true);
            }}
          >
            {t('components.ChannelsTable.addChannel')}
          </Button>
          <Popconfirm
            title={t('components.ChannelsTable.confirm')}
            okType={'warning'}
            onConfirm={testAllChannels}
            position={isMobile() ? 'top' : 'top'}
          >
            <Button theme='light' type='warning' style={{ marginRight: 8 }}>
              {t('components.ChannelsTable.testAllChannels')}
            </Button>
          </Popconfirm>
          <Popconfirm
            title={t('components.ChannelsTable.confirm')}
            okType={'secondary'}
            onConfirm={updateAllChannelsBalance}
          >
            <Button theme='light' type='secondary' style={{ marginRight: 8 }}>
              {t('components.ChannelsTable.updateAllBalances')}
            </Button>
          </Popconfirm>
          <Popconfirm
            title={t('components.ChannelsTable.confirmDeleteDisabledChannels')}
            content={t('components.ChannelsTable.deleteWarning')}
            okType={'danger'}
            onConfirm={deleteAllDisabledChannels}
          >
            <Button theme='light' type='danger' style={{ marginRight: 8 }}>
              {t('components.ChannelsTable.deleteDisabledChannels')}
            </Button>
          </Popconfirm>

          <Button
            theme='light'
            type='primary'
            style={{ marginRight: 8 }}
            onClick={refresh}
          >
            {t('components.ChannelsTable.refresh')}
          </Button>
        </Space>
      </div>
      <div style={{ marginTop: 20 }}>
        <Space>
          <Typography.Text strong>
            {t('components.ChannelsTable.enableBatchDelete')}
          </Typography.Text>
          <Switch
            label={t('components.ChannelsTable.enableBatchDelete')}
            uncheckedText={t('components.ChannelsTable.off')}
            aria-label={t('components.ChannelsTable.enableBatchDeleteAria')}
            onChange={(v) => {
              setEnableBatchDelete(v);
            }}
          ></Switch>
          <Popconfirm
            title={t('components.ChannelsTable.confirmDeleteSelectedChannels')}
            content={t('components.ChannelsTable.deleteWarning')}
            okType={'danger'}
            onConfirm={batchDeleteChannels}
            disabled={!enableBatchDelete}
            position={'top'}
          >
            <Button
              disabled={!enableBatchDelete}
              theme='light'
              type='danger'
              style={{ marginRight: 8 }}
            >
              {t('components.ChannelsTable.deleteSelectedChannels')}
            </Button>
          </Popconfirm>
          <Popconfirm
            title={t('components.ChannelsTable.confirmFixDatabase')}
            content={t('components.ChannelsTable.fixDatabaseWarning')}
            okType={'warning'}
            onConfirm={fixChannelsAbilities}
            position={'top'}
          >
            <Button theme='light' type='secondary' style={{ marginRight: 8 }}>
              {t('components.ChannelsTable.fixDatabase')}
            </Button>
          </Popconfirm>
        </Space>
      </div>
    </>
  );
};

export default ChannelsTable;
