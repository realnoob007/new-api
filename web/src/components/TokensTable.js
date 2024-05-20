import React, { useEffect, useState } from 'react';
import {
  API,
  copy,
  showSuccess,
  timestamp2string,
  useShowError,
} from '../helpers';

import { ITEMS_PER_PAGE } from '../constants';
import { renderQuota } from '../helpers/render';
import {
  Button,
  Dropdown,
  Form,
  Modal,
  Popconfirm,
  Popover,
  SplitButtonGroup,
  Table,
  Tag,
} from '@douyinfe/semi-ui';

import { IconTreeTriangleDown } from '@douyinfe/semi-icons';
import EditToken from '../pages/Token/EditToken';
import { useTranslation } from 'react-i18next';

const COPY_OPTIONS = [
  { key: 'next', text: 'ChatGPT Next Web', value: 'next' },
  { key: 'ama', text: 'ChatGPT Web & Midjourney', value: 'ama' },
  { key: 'opencat', text: 'OpenCat', value: 'opencat' },
];

const OPEN_LINK_OPTIONS = [
  { key: 'ama', text: 'ChatGPT Web & Midjourney', value: 'ama' },
  { key: 'opencat', text: 'OpenCat', value: 'opencat' },
];

function renderTimestamp(timestamp) {
  return <>{timestamp2string(timestamp)}</>;
}

function renderStatus(status, model_limits_enabled = false) {
  const { t } = useTranslation();
  switch (status) {
    case 1:
      if (model_limits_enabled) {
        return (
          <Tag color='green' size='large'>
            {t('components.TokensTable.enabledWithLimit')}
          </Tag>
        );
      } else {
        return (
          <Tag color='green' size='large'>
            {t('components.TokensTable.enabled')}
          </Tag>
        );
      }
    case 2:
      return (
        <Tag color='red' size='large'>
          {t('components.TokensTable.disabled')}
        </Tag>
      );
    case 3:
      return (
        <Tag color='yellow' size='large'>
          {t('components.TokensTable.expired')}
        </Tag>
      );
    case 4:
      return (
        <Tag color='grey' size='large'>
          {t('components.TokensTable.exhausted')}
        </Tag>
      );
    default:
      return (
        <Tag color='black' size='large'>
          {t('components.TokensTable.unknownStatus')}
        </Tag>
      );
  }
}

const TokensTable = () => {
  const { t } = useTranslation();
  const link_menu = [
    {
      node: 'item',
      key: 'next',
      name: 'ChatGPT Next Web',
      onClick: () => {
        onOpenLink('next');
      },
    },
    { node: 'item', key: 'ama', name: 'AMA 问天', value: 'ama' },
    {
      node: 'item',
      key: 'next-mj',
      name: 'ChatGPT Web & Midjourney',
      value: 'next-mj',
      onClick: () => {
        onOpenLink('next-mj');
      },
    },
    { node: 'item', key: 'opencat', name: 'OpenCat', value: 'opencat' },
  ];

  const columns = [
    {
      title: t('components.TokensTable.name'),
      dataIndex: 'name',
    },
    {
      title: t('components.TokensTable.status'),
      dataIndex: 'status',
      key: 'status',
      render: (text, record, index) => {
        return <div>{renderStatus(text, record.model_limits_enabled)}</div>;
      },
    },
    {
      title: t('components.TokensTable.usedQuota'),
      dataIndex: 'used_quota',
      render: (text, record, index) => {
        return <div>{renderQuota(parseInt(text))}</div>;
      },
    },
    {
      title: t('components.TokensTable.remainingQuota'),
      dataIndex: 'remain_quota',
      render: (text, record, index) => {
        return (
          <div>
            {record.unlimited_quota ? (
              <Tag size={'large'} color={'white'}>
                {t('components.TokensTable.unlimited')}
              </Tag>
            ) : (
              <Tag size={'large'} color={'light-blue'}>
                {renderQuota(parseInt(text))}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: t('components.TokensTable.createdTime'),
      dataIndex: 'created_time',
      render: (text, record, index) => {
        return <div>{renderTimestamp(text)}</div>;
      },
    },
    {
      title: t('components.TokensTable.expiredTime'),
      dataIndex: 'expired_time',
      render: (text, record, index) => {
        return (
          <div>
            {record.expired_time === -1
              ? t('components.TokensTable.neverExpires')
              : renderTimestamp(text)}
          </div>
        );
      },
    },
    {
      title: '',
      dataIndex: 'operate',
      render: (text, record, index) => (
        <div>
          <Popover
            content={'sk-' + record.key}
            style={{ padding: 20 }}
            position='top'
          >
            <Button theme='light' type='tertiary' style={{ marginRight: 1 }}>
              {t('components.TokensTable.view')}
            </Button>
          </Popover>
          <Button
            theme='light'
            type='secondary'
            style={{ marginRight: 1 }}
            onClick={async (text) => {
              await copyText('sk-' + record.key);
            }}
          >
            {t('components.TokensTable.copy')}
          </Button>
          <SplitButtonGroup
            style={{ marginRight: 1 }}
            aria-label='项目操作按钮组'
          >
            <Button
              theme='light'
              style={{ color: 'rgba(var(--semi-teal-7), 1)' }}
              onClick={() => {
                onOpenLink('next', record.key);
              }}
            >
              {t('components.TokensTable.chat')}
            </Button>
            <Dropdown
              trigger='click'
              position='bottomRight'
              menu={[
                {
                  node: 'item',
                  key: 'next',
                  disabled: !localStorage.getItem('chat_link'),
                  name: 'ChatGPT Next Web',
                  onClick: () => {
                    onOpenLink('next', record.key);
                  },
                },
                {
                  node: 'item',
                  key: 'next-mj',
                  disabled: !localStorage.getItem('chat_link2'),
                  name: 'ChatGPT Web & Midjourney',
                  onClick: () => {
                    onOpenLink('next-mj', record.key);
                  },
                },
                {
                  node: 'item',
                  key: 'ama',
                  name: 'AMA 问天（BotGem）',
                  onClick: () => {
                    onOpenLink('ama', record.key);
                  },
                },
                {
                  node: 'item',
                  key: 'opencat',
                  name: 'OpenCat',
                  onClick: () => {
                    onOpenLink('opencat', record.key);
                  },
                },
              ]}
            >
              <Button
                style={{
                  padding: '8px 4px',
                  color: 'rgba(var(--semi-teal-7), 1)',
                }}
                type='primary'
                icon={<IconTreeTriangleDown />}
              ></Button>
            </Dropdown>
          </SplitButtonGroup>
          <Popconfirm
            title={t('components.TokensTable.confirmDelete')}
            content={t('components.TokensTable.hardDeleteWarning')}
            okType={'danger'}
            position={'left'}
            onConfirm={() => {
              manageToken(record.id, 'delete', record).then(() => {
                removeRecord(record.key);
              });
            }}
          >
            <Button theme='light' type='danger' style={{ marginRight: 1 }}>
              {t('components.TokensTable.delete')}
            </Button>
          </Popconfirm>
          {record.status === 1 ? (
            <Button
              theme='light'
              type='warning'
              style={{ marginRight: 1 }}
              onClick={async () => {
                manageToken(record.id, 'disable', record);
              }}
            >
              {t('components.TokensTable.disable')}
            </Button>
          ) : (
            <Button
              theme='light'
              type='secondary'
              style={{ marginRight: 1 }}
              onClick={async () => {
                manageToken(record.id, 'enable', record);
              }}
            >
              {t('components.TokensTable.enable')}
            </Button>
          )}
          <Button
            theme='light'
            type='tertiary'
            style={{ marginRight: 1 }}
            onClick={() => {
              setEditingToken(record);
              setShowEdit(true);
            }}
          >
            {t('components.TokensTable.edit')}
          </Button>
        </div>
      ),
    },
  ];
  const showError = useShowError();
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [showEdit, setShowEdit] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [tokenCount, setTokenCount] = useState(pageSize);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchToken, setSearchToken] = useState('');
  const [searching, setSearching] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [targetTokenIdx, setTargetTokenIdx] = useState(0);
  const [editingToken, setEditingToken] = useState({
    id: undefined,
  });

  const closeEdit = () => {
    setShowEdit(false);
    setTimeout(() => {
      setEditingToken({
        id: undefined,
      });
    }, 500);
  };

  const setTokensFormat = (tokens) => {
    setTokens(tokens);
    if (tokens.length >= pageSize) {
      setTokenCount(tokens.length + pageSize);
    } else {
      setTokenCount(tokens.length);
    }
  };

  let pageData = tokens.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );
  const loadTokens = async (startIdx) => {
    setLoading(true);
    const res = await API.get(`/api/token/?p=${startIdx}&size=${pageSize}`);
    const { success, message, data } = res.data;
    if (success) {
      if (startIdx === 0) {
        setTokensFormat(data);
      } else {
        let newTokens = [...tokens];
        newTokens.splice(startIdx * pageSize, data.length, ...data);
        setTokensFormat(newTokens);
      }
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const onPaginationChange = (e, { activePage }) => {
    (async () => {
      if (activePage === Math.ceil(tokens.length / pageSize) + 1) {
        // In this case we have to load more data and then append them.
        await loadTokens(activePage - 1);
      }
      setActivePage(activePage);
    })();
  };

  const refresh = async () => {
    await loadTokens(activePage - 1);
  };

  const onCopy = async (type, key) => {
    let status = localStorage.getItem('status');
    let serverAddress = '';
    if (status) {
      status = JSON.parse(status);
      serverAddress = status.server_address;
    }
    if (serverAddress === '') {
      serverAddress = window.location.origin;
    }
    let encodedServerAddress = encodeURIComponent(serverAddress);
    const nextLink = localStorage.getItem('chat_link');
    const mjLink = localStorage.getItem('chat_link2');
    let nextUrl;

    if (nextLink) {
      nextUrl =
        nextLink + `/#/?settings={"key":"sk-${key}","url":"${serverAddress}"}`;
    } else {
      nextUrl = `https://chat.oneapi.pro/#/?settings={"key":"sk-${key}","url":"${serverAddress}"}`;
    }

    let url;
    switch (type) {
      case 'ama':
        url =
          mjLink + `/#/?settings={"key":"sk-${key}","url":"${serverAddress}"}`;
        break;
      case 'opencat':
        url = `opencat://team/join?domain=${encodedServerAddress}&token=sk-${key}`;
        break;
      case 'next':
        url = nextUrl;
        break;
      default:
        url = `sk-${key}`;
    }
    // if (await copy(url)) {
    //     showSuccess('已复制到剪贴板！');
    // } else {
    //     showWarning('无法复制到剪贴板，请手动复制，已将令牌填入搜索框。');
    //     setSearchKeyword(url);
    // }
  };

  const copyText = async (text) => {
    if (await copy(text)) {
      showSuccess(t('components.TokensTable.copiedToClipboard'));
    } else {
      Modal.error({
        title: t('components.TokensTable.copyFailed'),
        content: text,
        size: 'large',
      });
    }
  };

  const onOpenLink = async (type, key) => {
    let status = localStorage.getItem('status');
    let serverAddress = '';
    if (status) {
      status = JSON.parse(status);
      serverAddress = status.server_address;
    }
    if (serverAddress === '') {
      serverAddress = window.location.origin;
    }
    let encodedServerAddress = encodeURIComponent(serverAddress);
    const chatLink = localStorage.getItem('chat_link');
    const mjLink = localStorage.getItem('chat_link2');
    let defaultUrl;

    if (chatLink) {
      defaultUrl =
        chatLink + `/#/?settings={"key":"sk-${key}","url":"${serverAddress}"}`;
    }
    let url;
    switch (type) {
      case 'ama':
        url = `ama://set-api-key?server=${encodedServerAddress}&key=sk-${key}`;
        break;
      case 'opencat':
        url = `opencat://team/join?domain=${encodedServerAddress}&token=sk-${key}`;
        break;
      case 'next-mj':
        url =
          mjLink + `/#/?settings={"key":"sk-${key}","url":"${serverAddress}"}`;
        break;
      default:
        if (!chatLink) {
          showError(t('components.TokensTable.chatLinkNotSet'));
          return;
        }
        url = defaultUrl;
    }

    window.open(url, '_blank');
  };

  useEffect(() => {
    loadTokens(0)
      .then()
      .catch((reason) => {
        showError(reason);
      });
  }, [pageSize]);

  const removeRecord = (key) => {
    let newDataSource = [...tokens];
    if (key != null) {
      let idx = newDataSource.findIndex((data) => data.key === key);

      if (idx > -1) {
        newDataSource.splice(idx, 1);
        setTokensFormat(newDataSource);
      }
    }
  };

  const manageToken = async (id, action, record) => {
    setLoading(true);
    let data = { id };
    let res;
    switch (action) {
      case 'delete':
        res = await API.delete(`/api/token/${id}/`);
        break;
      case 'enable':
        data.status = 1;
        res = await API.put('/api/token/?status_only=true', data);
        break;
      case 'disable':
        data.status = 2;
        res = await API.put('/api/token/?status_only=true', data);
        break;
    }
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('components.TokensTable.operationSuccess'));
      let token = res.data.data;
      let newTokens = [...tokens];
      if (action === 'delete') {
      } else {
        record.status = token.status;
      }
      setTokensFormat(newTokens);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const searchTokens = async () => {
    if (searchKeyword === '' && searchToken === '') {
      // if keyword is blank, load files instead.
      await loadTokens(0);
      setActivePage(1);
      return;
    }
    setSearching(true);
    const res = await API.get(
      `/api/token/search?keyword=${searchKeyword}&token=${searchToken}`,
    );
    const { success, message, data } = res.data;
    if (success) {
      setTokensFormat(data);
      setActivePage(1);
    } else {
      showError(message);
    }
    setSearching(false);
  };

  const handleKeywordChange = async (value) => {
    setSearchKeyword(value.trim());
  };

  const handleSearchTokenChange = async (value) => {
    setSearchToken(value.trim());
  };

  const sortToken = (key) => {
    if (tokens.length === 0) return;
    setLoading(true);
    let sortedTokens = [...tokens];
    sortedTokens.sort((a, b) => {
      return ('' + a[key]).localeCompare(b[key]);
    });
    if (sortedTokens[0].id === tokens[0].id) {
      sortedTokens.reverse();
    }
    setTokens(sortedTokens);
    setLoading(false);
  };

  const handlePageChange = (page) => {
    setActivePage(page);
    if (page === Math.ceil(tokens.length / pageSize) + 1) {
      // In this case we have to load more data and then append them.
      loadTokens(page - 1).then((r) => {});
    }
  };

  const rowSelection = {
    onSelect: (record, selected) => {},
    onSelectAll: (selected, selectedRows) => {},
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedKeys(selectedRows);
    },
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
      <EditToken
        refresh={refresh}
        editingToken={editingToken}
        visiable={showEdit}
        handleClose={closeEdit}
      ></EditToken>
      <Form
        layout='horizontal'
        style={{ marginTop: 10 }}
        labelPosition={'left'}
      >
        <Form.Input
          field='keyword'
          label={t('components.TokensTable.searchKeyword')}
          placeholder={t('components.TokensTable.searchPlaceholder')}
          value={searchKeyword}
          loading={searching}
          onChange={handleKeywordChange}
        />
        <Form.Input
          field='token'
          label='Key'
          placeholder={t('components.TokensTable.tokenPlaceholder')}
          value={searchToken}
          loading={searching}
          onChange={handleSearchTokenChange}
        />
        <Button
          label={t('components.TokensTable.query')}
          type='primary'
          htmlType='submit'
          className='btn-margin-right'
          onClick={searchTokens}
          style={{ marginRight: 8 }}
        >
          {t('components.TokensTable.query')}
        </Button>
      </Form>

      <Table
        style={{ marginTop: 20 }}
        columns={columns}
        dataSource={pageData}
        pagination={{
          currentPage: activePage,
          pageSize: pageSize,
          total: tokenCount,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          formatPageText: (page) =>
            `${t('components.TokensTable.pageText', { currentStart: page.currentStart, currentEnd: page.currentEnd, total: tokens.length })}`,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setActivePage(1);
          },
          onPageChange: handlePageChange,
        }}
        loading={loading}
        rowSelection={rowSelection}
        onRow={handleRow}
      ></Table>
      <Button
        theme='light'
        type='primary'
        style={{ marginRight: 8 }}
        onClick={() => {
          setEditingToken({
            id: undefined,
          });
          setShowEdit(true);
        }}
      >
        {t('components.TokensTable.addToken')}
      </Button>
      <Button
        label={t('components.TokensTable.copySelectedTokens')}
        type='warning'
        onClick={async () => {
          if (selectedKeys.length === 0) {
            showError(t('components.TokensTable.selectAtLeastOne'));
            return;
          }
          let keys = '';
          for (let i = 0; i < selectedKeys.length; i++) {
            keys +=
              selectedKeys[i].name + '    sk-' + selectedKeys[i].key + '\n';
          }
          await copyText(keys);
        }}
      >
        {t('components.TokensTable.copySelectedTokens')}
      </Button>
    </>
  );
};

export default TokensTable;
