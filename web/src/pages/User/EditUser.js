import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, isMobile, useShowError, showSuccess } from '../../helpers';
import { renderQuota, renderQuotaWithPrompt } from '../../helpers/render';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import {
  Button,
  Divider,
  Input,
  Modal,
  Select,
  SideSheet,
  Space,
  Spin,
  Typography,
} from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

const EditUser = (props) => {
  const showError = useShowError();
  const { t } = useTranslation();
  const userId = props.editingUser.id;
  const [loading, setLoading] = useState(true);
  const [addQuotaModalOpen, setIsModalOpen] = useState(false);
  const [addQuotaLocal, setAddQuotaLocal] = useState('');
  const [inputs, setInputs] = useState({
    username: '',
    display_name: '',
    password: '',
    github_id: '',
    wechat_id: '',
    email: '',
    quota: 0,
    group: 'default',
  });
  const [groupOptions, setGroupOptions] = useState([]);
  const {
    username,
    display_name,
    password,
    github_id,
    wechat_id,
    telegram_id,
    email,
    quota,
    group,
  } = inputs;
  const handleInputChange = (name, value) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };
  const fetchGroups = async () => {
    try {
      let res = await API.get(`/api/group/`);
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
  const navigate = useNavigate();
  const handleCancel = () => {
    props.handleClose();
  };
  const loadUser = async () => {
    setLoading(true);
    let res = undefined;
    if (userId) {
      res = await API.get(`/api/user/${userId}`);
    } else {
      res = await API.get(`/api/user/self`);
    }
    const { success, message, data } = res.data;
    if (success) {
      data.password = '';
      setInputs(data);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser().then();
    if (userId) {
      fetchGroups().then();
    }
  }, [props.editingUser.id]);

  const submit = async () => {
    setLoading(true);
    let res = undefined;
    if (userId) {
      let data = { ...inputs, id: parseInt(userId) };
      if (typeof data.quota === 'string') {
        data.quota = parseInt(data.quota);
      }
      res = await API.put(`/api/user/`, data);
    } else {
      res = await API.put(`/api/user/self`, inputs);
    }
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('pages.User.EditUser.userUpdateSuccess'));
      props.refresh();
      props.handleClose();
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const addLocalQuota = () => {
    let newQuota = parseInt(quota) + parseInt(addQuotaLocal);
    setInputs((inputs) => ({ ...inputs, quota: newQuota }));
  };

  const openAddQuotaModal = () => {
    setAddQuotaLocal('0');
    setIsModalOpen(true);
  };

  const rwp = renderQuotaWithPrompt(quota);

  return (
    <>
      <SideSheet
        placement={'right'}
        title={<Title level={3}>{t('pages.User.EditUser.editUser')}</Title>}
        headerStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
        bodyStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
        visible={props.visible}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button theme='solid' size={'large'} onClick={submit}>
                {t('pages.User.EditUser.submit')}
              </Button>
              <Button
                theme='solid'
                size={'large'}
                type={'tertiary'}
                onClick={handleCancel}
              >
                {t('pages.User.EditUser.cancel')}
              </Button>
            </Space>
          </div>
        }
        closeIcon={null}
        onCancel={() => handleCancel()}
        width={isMobile() ? '100%' : 600}
      >
        <Spin spinning={loading}>
          <div style={{ marginTop: 20 }}>
            <Typography.Text>
              {t('pages.User.EditUser.username')}
            </Typography.Text>
          </div>
          <Input
            label={t('pages.User.EditUser.username')}
            name='username'
            placeholder={t('pages.User.EditUser.usernamePlaceholder')}
            onChange={(value) => handleInputChange('username', value)}
            value={username}
            autoComplete='new-password'
          />
          <div style={{ marginTop: 20 }}>
            <Typography.Text>
              {t('pages.User.EditUser.password')}
            </Typography.Text>
          </div>
          <Input
            label={t('pages.User.EditUser.password')}
            name='password'
            type={'password'}
            placeholder={t('pages.User.EditUser.passwordPlaceholder')}
            onChange={(value) => handleInputChange('password', value)}
            value={password}
            autoComplete='new-password'
          />
          <div style={{ marginTop: 20 }}>
            <Typography.Text>
              {t('pages.User.EditUser.displayName')}
            </Typography.Text>
          </div>
          <Input
            label={t('pages.User.EditUser.displayName')}
            name='display_name'
            placeholder={t('pages.User.EditUser.displayNamePlaceholder')}
            onChange={(value) => handleInputChange('display_name', value)}
            value={display_name}
            autoComplete='new-password'
          />
          {userId && (
            <>
              <div style={{ marginTop: 20 }}>
                <Typography.Text>
                  {t('pages.User.EditUser.group')}
                </Typography.Text>
              </div>
              <Select
                placeholder={t('pages.User.EditUser.groupPlaceholder')}
                name='group'
                fluid
                search
                selection
                allowAdditions
                additionLabel={t('pages.User.EditUser.addGroupLabel')}
                onChange={(value) => handleInputChange('group', value)}
                value={inputs.group}
                autoComplete='new-password'
                optionList={groupOptions}
              />
              <div style={{ marginTop: 20 }}>
                <Typography.Text>{`${t('pages.User.EditUser.remainingQuota')}${rwp}`}</Typography.Text>
              </div>
              <Space>
                <Input
                  name='quota'
                  placeholder={t('pages.User.EditUser.quotaPlaceholder')}
                  onChange={(value) => handleInputChange('quota', value)}
                  value={quota}
                  type={'number'}
                  autoComplete='new-password'
                />
                <Button onClick={openAddQuotaModal}>
                  {t('pages.User.EditUser.addQuota')}
                </Button>
              </Space>
            </>
          )}
          <Divider style={{ marginTop: 20 }}>
            {t('pages.User.EditUser.unchangeableInfo')}
          </Divider>
          <div style={{ marginTop: 20 }}>
            <Typography.Text>
              {t('pages.User.EditUser.githubAccount')}
            </Typography.Text>
          </div>
          <Input
            name='github_id'
            value={github_id}
            autoComplete='new-password'
            placeholder={t('pages.User.EditUser.readonlyPlaceholder')}
            readonly
          />
          <div style={{ marginTop: 20 }}>
            <Typography.Text>
              {t('pages.User.EditUser.wechatAccount')}
            </Typography.Text>
          </div>
          <Input
            name='wechat_id'
            value={wechat_id}
            autoComplete='new-password'
            placeholder={t('pages.User.EditUser.readonlyPlaceholder')}
            readonly
          />
          <div style={{ marginTop: 20 }}>
            <Typography.Text>
              {t('pages.User.EditUser.emailAccount')}
            </Typography.Text>
          </div>
          <Input
            name='email'
            value={email}
            autoComplete='new-password'
            placeholder={t('pages.User.EditUser.readonlyPlaceholder')}
            readonly
          />
          <div style={{ marginTop: 20 }}>
            <Typography.Text>
              {t('pages.User.EditUser.telegramAccount')}
            </Typography.Text>
          </div>
          <Input
            name='telegram_id'
            value={telegram_id}
            autoComplete='new-password'
            placeholder={t('pages.User.EditUser.readonlyPlaceholder')}
            readonly
          />
        </Spin>
      </SideSheet>
      <Modal
        centered={true}
        visible={addQuotaModalOpen}
        onOk={() => {
          addLocalQuota();
          setIsModalOpen(false);
        }}
        onCancel={() => setIsModalOpen(false)}
        closable={null}
      >
        <div style={{ marginTop: 20 }}>
          <Typography.Text>{`${t('pages.User.EditUser.newQuota', { currentQuota: renderQuota(quota), addQuota: renderQuota(addQuotaLocal), totalQuota: renderQuota(quota + parseInt(addQuotaLocal)) })}`}</Typography.Text>
        </div>
        <Input
          name='addQuotaLocal'
          placeholder={t('pages.User.EditUser.addQuotaPlaceholder')}
          onChange={(value) => {
            setAddQuotaLocal(value);
          }}
          value={addQuotaLocal}
          type={'number'}
          autoComplete='new-password'
        />
      </Modal>
    </>
  );
};

export default EditUser;
