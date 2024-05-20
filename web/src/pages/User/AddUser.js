import React, { useState } from 'react';
import { API, isMobile, useShowError, showSuccess } from '../../helpers';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import { Button, Input, SideSheet, Space, Spin } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

const AddUser = (props) => {
  const { t } = useTranslation();
  const showError = useShowError();
  const originInputs = {
    username: '',
    display_name: '',
    password: '',
  };
  const [inputs, setInputs] = useState(originInputs);
  const [loading, setLoading] = useState(false);
  const { username, display_name, password } = inputs;

  const handleInputChange = (name, value) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  const submit = async () => {
    setLoading(true);
    if (inputs.username === '' || inputs.password === '') return;
    const res = await API.post(`/api/user/`, inputs);
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('pages.User.AddUser.userCreationSuccess'));
      setInputs(originInputs);
      props.refresh();
      props.handleClose();
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    props.handleClose();
  };

  return (
    <>
      <SideSheet
        placement={'left'}
        title={<Title level={3}>{t('pages.User.AddUser.addUser')}</Title>}
        headerStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
        bodyStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
        visible={props.visible}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button theme='solid' size={'large'} onClick={submit}>
                {t('pages.User.AddUser.submit')}
              </Button>
              <Button
                theme='solid'
                size={'large'}
                type={'tertiary'}
                onClick={handleCancel}
              >
                {t('pages.User.AddUser.cancel')}
              </Button>
            </Space>
          </div>
        }
        closeIcon={null}
        onCancel={() => handleCancel()}
        width={isMobile() ? '100%' : 600}
      >
        <Spin spinning={loading}>
          <Input
            style={{ marginTop: 20 }}
            label={t('pages.User.AddUser.username')}
            name='username'
            addonBefore={t('pages.User.AddUser.username')}
            placeholder={t('pages.User.AddUser.usernamePlaceholder')}
            onChange={(value) => handleInputChange('username', value)}
            value={username}
            autoComplete='off'
          />
          <Input
            style={{ marginTop: 20 }}
            addonBefore={t('pages.User.AddUser.displayName')}
            label={t('pages.User.AddUser.displayName')}
            name='display_name'
            autoComplete='off'
            placeholder={t('pages.User.AddUser.displayNamePlaceholder')}
            onChange={(value) => handleInputChange('display_name', value)}
            value={display_name}
          />
          <Input
            style={{ marginTop: 20 }}
            label={t('pages.User.AddUser.password')}
            name='password'
            type={'password'}
            addonBefore={t('pages.User.AddUser.password')}
            placeholder={t('pages.User.AddUser.passwordPlaceholder')}
            onChange={(value) => handleInputChange('password', value)}
            value={password}
            autoComplete='off'
          />
        </Spin>
      </SideSheet>
    </>
  );
};

export default AddUser;
