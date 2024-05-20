import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  API,
  copy,
  isRoot,
  useShowError,
  showInfo,
  showSuccess,
} from '../helpers';
import Turnstile from 'react-turnstile';
import { UserContext } from '../context/User';
import { onGitHubOAuthClicked } from './utils';
import {
  Avatar,
  Banner,
  Button,
  Card,
  Descriptions,
  Image,
  Input,
  InputNumber,
  Layout,
  Modal,
  Space,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import {
  getQuotaPerUnit,
  renderQuota,
  renderQuotaWithPrompt,
  stringToColor,
} from '../helpers/render';
import TelegramLoginButton from 'react-telegram-login';
import { useTranslation } from 'react-i18next';

const PersonalSetting = () => {
  const showError = useShowError();
  const { t } = useTranslation();
  const [userState, userDispatch] = useContext(UserContext);
  let navigate = useNavigate();

  const [inputs, setInputs] = useState({
    wechat_verification_code: '',
    email_verification_code: '',
    email: '',
    self_account_deletion_confirmation: '',
    set_new_password: '',
    set_new_password_confirmation: '',
  });
  const [status, setStatus] = useState({});
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showWeChatBindModal, setShowWeChatBindModal] = useState(false);
  const [showEmailBindModal, setShowEmailBindModal] = useState(false);
  const [showAccountDeleteModal, setShowAccountDeleteModal] = useState(false);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [affLink, setAffLink] = useState('');
  const [systemToken, setSystemToken] = useState('');
  const [models, setModels] = useState([]);
  const [openTransfer, setOpenTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState(0);

  useEffect(() => {
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      setStatus(status);
      if (status.turnstile_check) {
        setTurnstileEnabled(true);
        setTurnstileSiteKey(status.turnstile_site_key);
      }
    }
    getUserData().then((res) => {
      console.log(userState);
    });
    loadModels().then();
    getAffLink().then();
    setTransferAmount(getQuotaPerUnit());
  }, []);

  useEffect(() => {
    let countdownInterval = null;
    if (disableButton && countdown > 0) {
      countdownInterval = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setDisableButton(false);
      setCountdown(30);
    }
    return () => clearInterval(countdownInterval); // Clean up on unmount
  }, [disableButton, countdown]);

  const handleInputChange = (name, value) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  const generateAccessToken = async () => {
    const res = await API.get('/api/user/token');
    const { success, message, data } = res.data;
    if (success) {
      setSystemToken(data);
      await copy(data);
      showSuccess(t('components.PersonalSetting.tokenResetSuccess'));
    } else {
      showError(message);
    }
  };

  const getAffLink = async () => {
    const res = await API.get('/api/user/aff');
    const { success, message, data } = res.data;
    if (success) {
      let link = `${window.location.origin}/register?aff=${data}`;
      setAffLink(link);
    } else {
      showError(message);
    }
  };

  const getUserData = async () => {
    let res = await API.get(`/api/user/self`);
    const { success, message, data } = res.data;
    if (success) {
      userDispatch({ type: 'login', payload: data });
    } else {
      showError(message);
    }
  };

  const loadModels = async () => {
    let res = await API.get(`/api/user/models`);
    const { success, message, data } = res.data;
    if (success) {
      setModels(data);
      console.log(data);
    } else {
      showError(message);
    }
  };

  const handleAffLinkClick = async (e) => {
    e.target.select();
    await copy(e.target.value);
    showSuccess(t('components.PersonalSetting.inviteLinkCopied'));
  };

  const handleSystemTokenClick = async (e) => {
    e.target.select();
    await copy(e.target.value);
    showSuccess(t('components.PersonalSetting.systemTokenCopied'));
  };

  const deleteAccount = async () => {
    if (inputs.self_account_deletion_confirmation !== userState.user.username) {
      showError(t('components.PersonalSetting.confirmDeleteUsername'));
      return;
    }

    const res = await API.delete('/api/user/self');
    const { success, message } = res.data;

    if (success) {
      showSuccess(t('components.PersonalSetting.accountDeleted'));
      await API.get('/api/user/logout');
      userDispatch({ type: 'logout' });
      localStorage.removeItem('user');
      navigate('/login');
    } else {
      showError(message);
    }
  };

  const bindWeChat = async () => {
    if (inputs.wechat_verification_code === '') return;
    const res = await API.get(
      `/api/oauth/wechat/bind?code=${inputs.wechat_verification_code}`,
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('components.PersonalSetting.wechatBindSuccess'));
      setShowWeChatBindModal(false);
    } else {
      showError(message);
    }
  };

  const changePassword = async () => {
    if (inputs.set_new_password !== inputs.set_new_password_confirmation) {
      showError(t('components.PersonalSetting.passwordsNotMatch'));
      return;
    }
    const res = await API.put(`/api/user/self`, {
      password: inputs.set_new_password,
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('components.PersonalSetting.passwordChangeSuccess'));
      setShowWeChatBindModal(false);
    } else {
      showError(message);
    }
    setShowChangePasswordModal(false);
  };

  const transfer = async () => {
    if (transferAmount < getQuotaPerUnit()) {
      showError(
        t('components.PersonalSetting.transferMinAmount') +
          renderQuota(getQuotaPerUnit()),
      );
      return;
    }
    const res = await API.post(`/api/user/aff_transfer`, {
      quota: transferAmount,
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess(message);
      setOpenTransfer(false);
      getUserData().then();
    } else {
      showError(message);
    }
  };

  const sendVerificationCode = async () => {
    if (inputs.email === '') {
      showError(t('components.PersonalSetting.enterEmail'));
      return;
    }
    setDisableButton(true);
    if (turnstileEnabled && turnstileToken === '') {
      showInfo(t('components.PersonalSetting.turnstileCheck'));
      return;
    }
    setLoading(true);
    const res = await API.get(
      `/api/verification?email=${inputs.email}&turnstile=${turnstileToken}`,
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('components.PersonalSetting.verificationCodeSent'));
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const bindEmail = async () => {
    if (inputs.email_verification_code === '') {
      showError(t('components.PersonalSetting.enterVerificationCode'));
      return;
    }
    setLoading(true);
    const res = await API.get(
      `/api/oauth/email/bind?email=${inputs.email}&code=${inputs.email_verification_code}`,
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('components.PersonalSetting.emailBindSuccess'));
      setShowEmailBindModal(false);
      userState.user.email = inputs.email;
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const getUsername = () => {
    if (userState.user) {
      return userState.user.username;
    } else {
      return 'null';
    }
  };

  const handleCancel = () => {
    setOpenTransfer(false);
  };

  const copyText = async (text) => {
    if (await copy(text)) {
      showSuccess(t('components.PersonalSetting.copied') + text);
    } else {
      Modal.error({
        title: t('components.PersonalSetting.copyErrorTitle'),
        content: text,
      });
    }
  };

  return (
    <div>
      <Layout>
        <Layout.Content>
          <Modal
            title={t('components.PersonalSetting.enterTransferAmount')}
            visible={openTransfer}
            onOk={transfer}
            onCancel={handleCancel}
            maskClosable={false}
            size={'small'}
            centered={true}
          >
            <div style={{ marginTop: 20 }}>
              <Typography.Text>
                {t('components.PersonalSetting.availableQuota')}
                {renderQuotaWithPrompt(userState?.user?.aff_quota)}
              </Typography.Text>
              <Input
                style={{ marginTop: 5 }}
                value={userState?.user?.aff_quota}
                disabled={true}
              ></Input>
            </div>
            <div style={{ marginTop: 20 }}>
              <Typography.Text>
                {t('components.PersonalSetting.transferQuota')}
                {renderQuotaWithPrompt(transferAmount)}{' '}
                {t('components.PersonalSetting.transferMinAmount') +
                  renderQuota(getQuotaPerUnit())}
              </Typography.Text>
              <div>
                <InputNumber
                  min={0}
                  style={{ marginTop: 5 }}
                  value={transferAmount}
                  onChange={(value) => setTransferAmount(value)}
                  disabled={false}
                ></InputNumber>
              </div>
            </div>
          </Modal>
          <div style={{ marginTop: 20 }}>
            <Card
              title={
                <Card.Meta
                  avatar={
                    <Avatar
                      size='default'
                      color={stringToColor(getUsername())}
                      style={{ marginRight: 4 }}
                    >
                      {typeof getUsername() === 'string' &&
                        getUsername().slice(0, 1)}
                    </Avatar>
                  }
                  title={<Typography.Text>{getUsername()}</Typography.Text>}
                  description={
                    isRoot() ? (
                      <Tag color='red'>
                        {t('components.PersonalSetting.admin')}
                      </Tag>
                    ) : (
                      <Tag color='blue'>
                        {t('components.PersonalSetting.user')}
                      </Tag>
                    )
                  }
                ></Card.Meta>
              }
              headerExtraContent={
                <>
                  <Space vertical align='start'>
                    <Tag color='green'>
                      {t('components.PersonalSetting.id') + userState?.user?.id}
                    </Tag>
                    <Tag color='blue'>{userState?.user?.group}</Tag>
                  </Space>
                </>
              }
              footer={
                <Descriptions row>
                  <Descriptions.Item
                    itemKey={t('components.PersonalSetting.currentBalance')}
                  >
                    {renderQuota(userState?.user?.quota)}
                  </Descriptions.Item>
                  <Descriptions.Item
                    itemKey={t('components.PersonalSetting.historyUsage')}
                  >
                    {renderQuota(userState?.user?.used_quota)}
                  </Descriptions.Item>
                  <Descriptions.Item
                    itemKey={t('components.PersonalSetting.requestCount')}
                  >
                    {userState.user?.request_count}
                  </Descriptions.Item>
                </Descriptions>
              }
            >
              <Typography.Title heading={6}>
                {t('components.PersonalSetting.availableModels')}
              </Typography.Title>
              <div style={{ marginTop: 10 }}>
                <Space wrap>
                  {models.map((model) => (
                    <Tag
                      key={model}
                      color='cyan'
                      onClick={() => {
                        copyText(model);
                      }}
                    >
                      {model}
                    </Tag>
                  ))}
                </Space>
              </div>
            </Card>
            <Card
              footer={
                <div>
                  <Typography.Text>
                    {t('components.PersonalSetting.inviteLink')}
                  </Typography.Text>
                  <Input
                    style={{ marginTop: 10 }}
                    value={affLink}
                    onClick={handleAffLinkClick}
                    readOnly
                  />
                </div>
              }
            >
              <Typography.Title heading={6}>
                {t('components.PersonalSetting.inviteInfo')}
              </Typography.Title>
              <div style={{ marginTop: 10 }}>
                <Descriptions row>
                  <Descriptions.Item
                    itemKey={t('components.PersonalSetting.pendingEarnings')}
                  >
                    <span style={{ color: 'rgba(var(--semi-red-5), 1)' }}>
                      {renderQuota(userState?.user?.aff_quota)}
                    </span>
                    <Button
                      type={'secondary'}
                      onClick={() => setOpenTransfer(true)}
                      size={'small'}
                      style={{ marginLeft: 10 }}
                    >
                      {t('components.PersonalSetting.transfer')}
                    </Button>
                  </Descriptions.Item>
                  <Descriptions.Item
                    itemKey={t('components.PersonalSetting.totalEarnings')}
                  >
                    {renderQuota(userState?.user?.aff_history_quota)}
                  </Descriptions.Item>
                  <Descriptions.Item
                    itemKey={t('components.PersonalSetting.inviteCount')}
                  >
                    {userState?.user?.aff_count}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </Card>
            <Card>
              <Typography.Title heading={6}>
                {t('components.PersonalSetting.personalInfo')}
              </Typography.Title>
              <div style={{ marginTop: 20 }}>
                <Typography.Text strong>
                  {t('components.PersonalSetting.email')}
                </Typography.Text>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <div>
                    <Input
                      value={
                        userState.user && userState.user.email !== ''
                          ? userState.user.email
                          : t('components.PersonalSetting.notBound')
                      }
                      readonly={true}
                    ></Input>
                  </div>
                  <div>
                    <Button
                      onClick={() => {
                        setShowEmailBindModal(true);
                      }}
                    >
                      {userState.user && userState.user.email !== ''
                        ? t('components.PersonalSetting.changeBind')
                        : t('components.PersonalSetting.bindEmail')}
                    </Button>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>
                  {t('components.PersonalSetting.wechat')}
                </Typography.Text>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <div>
                    <Input
                      value={
                        userState.user && userState.user.wechat_id !== ''
                          ? t('components.PersonalSetting.bound')
                          : t('components.PersonalSetting.notBound')
                      }
                      readonly={true}
                    ></Input>
                  </div>
                  <div>
                    <Button
                      disabled={
                        (userState.user && userState.user.wechat_id !== '') ||
                        !status.wechat_login
                      }
                    >
                      {status.wechat_login
                        ? t('components.PersonalSetting.bind')
                        : t('components.PersonalSetting.notEnabled')}
                    </Button>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>
                  {t('components.PersonalSetting.github')}
                </Typography.Text>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <div>
                    <Input
                      value={
                        userState.user && userState.user.github_id !== ''
                          ? userState.user.github_id
                          : t('components.PersonalSetting.notBound')
                      }
                      readonly={true}
                    ></Input>
                  </div>
                  <div>
                    <Button
                      onClick={() => {
                        onGitHubOAuthClicked(status.github_client_id);
                      }}
                      disabled={
                        (userState.user && userState.user.github_id !== '') ||
                        !status.github_oauth
                      }
                    >
                      {status.github_oauth
                        ? t('components.PersonalSetting.bind')
                        : t('components.PersonalSetting.notEnabled')}
                    </Button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>
                  {t('components.PersonalSetting.telegram')}
                </Typography.Text>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <div>
                    <Input
                      value={
                        userState.user && userState.user.telegram_id !== ''
                          ? userState.user.telegram_id
                          : t('components.PersonalSetting.notBound')
                      }
                      readonly={true}
                    ></Input>
                  </div>
                  <div>
                    {status.telegram_oauth ? (
                      userState.user.telegram_id !== '' ? (
                        <Button disabled={true}>
                          {t('components.PersonalSetting.bound')}
                        </Button>
                      ) : (
                        <TelegramLoginButton
                          dataAuthUrl='/api/oauth/telegram/bind'
                          botName={status.telegram_bot_name}
                        />
                      )
                    ) : (
                      <Button disabled={true}>
                        {t('components.PersonalSetting.notEnabled')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <Space>
                  <Button onClick={generateAccessToken}>
                    {t('components.PersonalSetting.generateToken')}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowChangePasswordModal(true);
                    }}
                  >
                    {t('components.PersonalSetting.changePassword')}
                  </Button>
                  <Button
                    type={'danger'}
                    onClick={() => {
                      setShowAccountDeleteModal(true);
                    }}
                  >
                    {t('components.PersonalSetting.deleteAccount')}
                  </Button>
                </Space>

                {systemToken && (
                  <Input
                    readOnly
                    value={systemToken}
                    onClick={handleSystemTokenClick}
                    style={{ marginTop: '10px' }}
                  />
                )}
                {status.wechat_login && (
                  <Button
                    onClick={() => {
                      setShowWeChatBindModal(true);
                    }}
                  >
                    {t('components.PersonalSetting.bindWechat')}
                  </Button>
                )}
                <Modal
                  onCancel={() => setShowWeChatBindModal(false)}
                  visible={showWeChatBindModal}
                  size={'small'}
                >
                  <Image src={status.wechat_qrcode} />
                  <div style={{ textAlign: 'center' }}>
                    <p>
                      {t('components.PersonalSetting.wechatQrCodeInstruction')}
                    </p>
                  </div>
                  <Input
                    placeholder={t(
                      'components.PersonalSetting.verificationCode',
                    )}
                    name='wechat_verification_code'
                    value={inputs.wechat_verification_code}
                    onChange={(v) =>
                      handleInputChange('wechat_verification_code', v)
                    }
                  />
                  <Button color='' fluid size='large' onClick={bindWeChat}>
                    {t('components.PersonalSetting.bind')}
                  </Button>
                </Modal>
              </div>
            </Card>
            <Modal
              onCancel={() => setShowEmailBindModal(false)}
              onOk={bindEmail}
              visible={showEmailBindModal}
              size={'small'}
              centered={true}
              maskClosable={false}
            >
              <Typography.Title heading={6}>
                {t('components.PersonalSetting.bindEmail')}
              </Typography.Title>
              <div
                style={{
                  marginTop: 20,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <Input
                  fluid
                  placeholder={t('components.PersonalSetting.enterEmail')}
                  onChange={(value) => handleInputChange('email', value)}
                  name='email'
                  type='email'
                />
                <Button
                  onClick={sendVerificationCode}
                  disabled={disableButton || loading}
                >
                  {disableButton
                    ? t('components.PersonalSetting.resend') + ` (${countdown})`
                    : t('components.PersonalSetting.getVerificationCode')}
                </Button>
              </div>
              <div style={{ marginTop: 10 }}>
                <Input
                  fluid
                  placeholder={t('components.PersonalSetting.verificationCode')}
                  name='email_verification_code'
                  value={inputs.email_verification_code}
                  onChange={(value) =>
                    handleInputChange('email_verification_code', value)
                  }
                />
              </div>
              {turnstileEnabled ? (
                <Turnstile
                  sitekey={turnstileSiteKey}
                  onVerify={(token) => {
                    setTurnstileToken(token);
                  }}
                />
              ) : (
                <></>
              )}
            </Modal>
            <Modal
              onCancel={() => setShowAccountDeleteModal(false)}
              visible={showAccountDeleteModal}
              size={'small'}
              centered={true}
              onOk={deleteAccount}
            >
              <div style={{ marginTop: 20 }}>
                <Banner
                  type='danger'
                  description={t(
                    'components.PersonalSetting.deleteAccountWarning',
                  )}
                  closeIcon={null}
                />
              </div>
              <div style={{ marginTop: 20 }}>
                <Input
                  placeholder={
                    t('components.PersonalSetting.confirmDeleteAccount') +
                    userState?.user?.username
                  }
                  name='self_account_deletion_confirmation'
                  value={inputs.self_account_deletion_confirmation}
                  onChange={(value) =>
                    handleInputChange(
                      'self_account_deletion_confirmation',
                      value,
                    )
                  }
                />
                {turnstileEnabled ? (
                  <Turnstile
                    sitekey={turnstileSiteKey}
                    onVerify={(token) => {
                      setTurnstileToken(token);
                    }}
                  />
                ) : (
                  <></>
                )}
              </div>
            </Modal>
            <Modal
              onCancel={() => setShowChangePasswordModal(false)}
              visible={showChangePasswordModal}
              size={'small'}
              centered={true}
              onOk={changePassword}
            >
              <div style={{ marginTop: 20 }}>
                <Input
                  name='set_new_password'
                  placeholder={t('components.PersonalSetting.newPassword')}
                  value={inputs.set_new_password}
                  onChange={(value) =>
                    handleInputChange('set_new_password', value)
                  }
                />
                <Input
                  style={{ marginTop: 20 }}
                  name='set_new_password_confirmation'
                  placeholder={t(
                    'components.PersonalSetting.confirmNewPassword',
                  )}
                  value={inputs.set_new_password_confirmation}
                  onChange={(value) =>
                    handleInputChange('set_new_password_confirmation', value)
                  }
                />
                {turnstileEnabled ? (
                  <Turnstile
                    sitekey={turnstileSiteKey}
                    onVerify={(token) => {
                      setTurnstileToken(token);
                    }}
                  />
                ) : (
                  <></>
                )}
              </div>
            </Modal>
          </div>
        </Layout.Content>
      </Layout>
    </div>
  );
};

export default PersonalSetting;
