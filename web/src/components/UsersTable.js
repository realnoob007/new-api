import React, { useEffect, useState } from 'react';
import { API, useShowError, showSuccess } from '../helpers';
import {
  Button,
  Form,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
} from '@douyinfe/semi-ui';
import { ITEMS_PER_PAGE } from '../constants';
import { renderGroup, renderNumber, renderQuota } from '../helpers/render';
import AddUser from '../pages/User/AddUser';
import EditUser from '../pages/User/EditUser';
import { useTranslation } from 'react-i18next';

const UsersTable = () => {
  const showError = useShowError();
  const { t } = useTranslation();
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
    },
    {
      title: t('components.UsersTable.username'),
      dataIndex: 'username',
    },
    {
      title: t('components.UsersTable.group'),
      dataIndex: 'group',
      render: (text, record, index) => {
        return <div>{renderGroup(text)}</div>;
      },
    },
    {
      title: t('components.UsersTable.info'),
      dataIndex: 'info',
      render: (text, record, index) => {
        return (
          <div>
            <Space spacing={1}>
              <Tooltip content={t('components.UsersTable.remainingQuota')}>
                <Tag color='white' size='large'>
                  {renderQuota(record.quota)}
                </Tag>
              </Tooltip>
              <Tooltip content={t('components.UsersTable.usedQuota')}>
                <Tag color='white' size='large'>
                  {renderQuota(record.used_quota)}
                </Tag>
              </Tooltip>
              <Tooltip content={t('components.UsersTable.requestCount')}>
                <Tag color='white' size='large'>
                  {renderNumber(record.request_count)}
                </Tag>
              </Tooltip>
            </Space>
          </div>
        );
      },
    },
    {
      title: t('components.UsersTable.inviteInfo'),
      dataIndex: 'invite',
      render: (text, record, index) => {
        return (
          <div>
            <Space spacing={1}>
              <Tooltip content={t('components.UsersTable.inviteCount')}>
                <Tag color='white' size='large'>
                  {renderNumber(record.aff_count)}
                </Tag>
              </Tooltip>
              <Tooltip content={t('components.UsersTable.inviteTotal')}>
                <Tag color='white' size='large'>
                  {renderQuota(record.aff_history_quota)}
                </Tag>
              </Tooltip>
              <Tooltip content={t('components.UsersTable.inviterId')}>
                {record.inviter_id === 0 ? (
                  <Tag color='white' size='large'>
                    {t('components.UsersTable.none')}
                  </Tag>
                ) : (
                  <Tag color='white' size='large'>
                    {record.inviter_id}
                  </Tag>
                )}
              </Tooltip>
            </Space>
          </div>
        );
      },
    },
    {
      title: t('components.UsersTable.role'),
      dataIndex: 'role',
      render: (text, record, index) => {
        return (
          <div>
            {(() => {
              switch (text) {
                case 1:
                  return (
                    <Tag size='large'>
                      {t('components.UsersTable.commonUser')}
                    </Tag>
                  );
                case 10:
                  return (
                    <Tag color='yellow' size='large'>
                      {t('components.UsersTable.admin')}
                    </Tag>
                  );
                case 100:
                  return (
                    <Tag color='orange' size='large'>
                      {t('components.UsersTable.superAdmin')}
                    </Tag>
                  );
                default:
                  return (
                    <Tag color='red' size='large'>
                      {t('components.UsersTable.unknownRole')}
                    </Tag>
                  );
              }
            })()}
          </div>
        );
      },
    },
    {
      title: t('components.UsersTable.status'),
      dataIndex: 'status',
      render: (text, record, index) => {
        return (
          <div>
            {record.DeletedAt !== null ? (
              <Tag color='red'>{t('components.UsersTable.deactivated')}</Tag>
            ) : (
              renderStatus(text)
            )}
          </div>
        );
      },
    },
    {
      title: '',
      dataIndex: 'operate',
      render: (text, record, index) => (
        <div>
          {record.DeletedAt !== null ? (
            <></>
          ) : (
            <>
              <Popconfirm
                title={t('components.UsersTable.confirm')}
                okType={'warning'}
                onConfirm={() => {
                  manageUser(record.username, 'promote', record);
                }}
              >
                <Button theme='light' type='warning' style={{ marginRight: 1 }}>
                  {t('components.UsersTable.promote')}
                </Button>
              </Popconfirm>
              <Popconfirm
                title={t('components.UsersTable.confirm')}
                okType={'warning'}
                onConfirm={() => {
                  manageUser(record.username, 'demote', record);
                }}
              >
                <Button
                  theme='light'
                  type='secondary'
                  style={{ marginRight: 1 }}
                >
                  {t('components.UsersTable.demote')}
                </Button>
              </Popconfirm>
              {record.status === 1 ? (
                <Button
                  theme='light'
                  type='warning'
                  style={{ marginRight: 1 }}
                  onClick={async () => {
                    manageUser(record.username, 'disable', record);
                  }}
                >
                  {t('components.UsersTable.disable')}
                </Button>
              ) : (
                <Button
                  theme='light'
                  type='secondary'
                  style={{ marginRight: 1 }}
                  onClick={async () => {
                    manageUser(record.username, 'enable', record);
                  }}
                  disabled={record.status === 3}
                >
                  {t('components.UsersTable.enable')}
                </Button>
              )}
              <Button
                theme='light'
                type='tertiary'
                style={{ marginRight: 1 }}
                onClick={() => {
                  setEditingUser(record);
                  setShowEditUser(true);
                }}
              >
                {t('components.UsersTable.edit')}
              </Button>
            </>
          )}
          <Popconfirm
            title={t('components.UsersTable.confirmDelete')}
            content={t('components.UsersTable.hardDeleteWarning')}
            okType={'danger'}
            position={'left'}
            onConfirm={() => {
              manageUser(record.username, 'delete', record).then(() => {
                removeRecord(record.id);
              });
            }}
          >
            <Button theme='light' type='danger' style={{ marginRight: 1 }}>
              {t('components.UsersTable.delete')}
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchGroup, setSearchGroup] = useState('');
  const [groupOptions, setGroupOptions] = useState([]);
  const [userCount, setUserCount] = useState(ITEMS_PER_PAGE);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState({
    id: undefined,
  });

  const setCount = (data) => {
    if (data.length >= activePage * ITEMS_PER_PAGE) {
      setUserCount(data.length + 1);
    } else {
      setUserCount(data.length);
    }
  };

  const removeRecord = (key) => {
    console.log(key);
    let newDataSource = [...users];
    if (key != null) {
      let idx = newDataSource.findIndex((data) => data.id === key);

      if (idx > -1) {
        newDataSource.splice(idx, 1);
        setUsers(newDataSource);
      }
    }
  };

  const loadUsers = async (startIdx) => {
    const res = await API.get(`/api/user/?p=${startIdx}`);
    const { success, message, data } = res.data;
    if (success) {
      if (startIdx === 0) {
        setUsers(data);
        setCount(data);
      } else {
        let newUsers = users;
        newUsers.push(...data);
        setUsers(newUsers);
        setCount(newUsers);
      }
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const onPaginationChange = (e, { activePage }) => {
    (async () => {
      if (activePage === Math.ceil(users.length / ITEMS_PER_PAGE) + 1) {
        await loadUsers(activePage - 1);
      }
      setActivePage(activePage);
    })();
  };

  useEffect(() => {
    loadUsers(0)
      .then()
      .catch((reason) => {
        showError(reason);
      });
    fetchGroups().then();
  }, []);

  const manageUser = async (username, action, record) => {
    const res = await API.post('/api/user/manage', {
      username,
      action,
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('components.UsersTable.operationSuccess'));
      let user = res.data.data;
      let newUsers = [...users];
      if (action === 'delete') {
      } else {
        record.status = user.status;
        record.role = user.role;
      }
      setUsers(newUsers);
    } else {
      showError(message);
    }
  };

  const renderStatus = (status) => {
    switch (status) {
      case 1:
        return <Tag size='large'>{t('components.UsersTable.activated')}</Tag>;
      case 2:
        return (
          <Tag size='large' color='red'>
            {t('components.UsersTable.banned')}
          </Tag>
        );
      default:
        return (
          <Tag size='large' color='grey'>
            {t('components.UsersTable.unknownStatus')}
          </Tag>
        );
    }
  };

  const searchUsers = async (searchKeyword, searchGroup) => {
    if (searchKeyword === '' && searchGroup === '') {
      await loadUsers(0);
      setActivePage(1);
      return;
    }
    setSearching(true);
    const res = await API.get(
      `/api/user/search?keyword=${searchKeyword}&group=${searchGroup}`,
    );
    const { success, message, data } = res.data;
    if (success) {
      setUsers(data);
      setActivePage(1);
    } else {
      showError(message);
    }
    setSearching(false);
  };

  const handleKeywordChange = async (value) => {
    setSearchKeyword(value.trim());
  };

  const sortUser = (key) => {
    if (users.length === 0) return;
    setLoading(true);
    let sortedUsers = [...users];
    sortedUsers.sort((a, b) => {
      return ('' + a[key]).localeCompare(b[key]);
    });
    if (sortedUsers[0].id === users[0].id) {
      sortedUsers.reverse();
    }
    setUsers(sortedUsers);
    setLoading(false);
  };

  const handlePageChange = (page) => {
    setActivePage(page);
    if (page === Math.ceil(users.length / ITEMS_PER_PAGE) + 1) {
      loadUsers(page - 1).then((r) => {});
    }
  };

  const pageData = users.slice(
    (activePage - 1) * ITEMS_PER_PAGE,
    activePage * ITEMS_PER_PAGE,
  );

  const closeAddUser = () => {
    setShowAddUser(false);
  };

  const closeEditUser = () => {
    setShowEditUser(false);
    setEditingUser({
      id: undefined,
    });
  };

  const refresh = async () => {
    if (searchKeyword === '') {
      await loadUsers(activePage - 1);
    } else {
      await searchUsers();
    }
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

  return (
    <>
      <AddUser
        refresh={refresh}
        visible={showAddUser}
        handleClose={closeAddUser}
      ></AddUser>
      <EditUser
        refresh={refresh}
        visible={showEditUser}
        handleClose={closeEditUser}
        editingUser={editingUser}
      ></EditUser>
      <Form
        onSubmit={() => {
          searchUsers(searchKeyword, searchGroup);
        }}
        labelPosition='left'
      >
        <div style={{ display: 'flex' }}>
          <Space>
            <Form.Input
              label={t('components.UsersTable.searchKeyword')}
              icon='search'
              field='keyword'
              iconPosition='left'
              placeholder={t('components.UsersTable.searchPlaceholder')}
              value={searchKeyword}
              loading={searching}
              onChange={(value) => handleKeywordChange(value)}
            />
            <Form.Select
              field='group'
              label={t('components.UsersTable.group')}
              optionList={groupOptions}
              onChange={(value) => {
                setSearchGroup(value);
                searchUsers(searchKeyword, value);
              }}
            />
            <Button
              label={t('components.UsersTable.query')}
              type='primary'
              htmlType='submit'
              className='btn-margin-right'
              style={{ marginRight: 8 }}
            >
              {t('components.UsersTable.query')}
            </Button>
          </Space>
        </div>
      </Form>

      <Table
        columns={columns}
        dataSource={pageData}
        pagination={{
          currentPage: activePage,
          pageSize: ITEMS_PER_PAGE,
          total: userCount,
          pageSizeOpts: [10, 20, 50, 100],
          onPageChange: handlePageChange,
        }}
        loading={loading}
      />
      <Button
        theme='light'
        type='primary'
        style={{ marginRight: 8 }}
        onClick={() => {
          setShowAddUser(true);
        }}
      >
        {t('components.UsersTable.addUser')}
      </Button>
    </>
  );
};

export default UsersTable;
