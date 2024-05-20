import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserContext } from '../context/User';
import { API, getLogo, useShowError, showInfo, showSuccess } from '../helpers';
import { onGitHubOAuthClicked } from './utils';
import Turnstile from 'react-turnstile';
import {
  Button,
  Card,
  Divider,
  Form,
  Icon,
  Layout,
  Modal,
} from '@douyinfe/semi-ui';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import Text from '@douyinfe/semi-ui/lib/es/typography/text';
import TelegramLoginButton from 'react-telegram-login';
import { IconGithubLogo } from '@douyinfe/semi-icons';
import WeChatIcon from './WeChatIcon';
import { setUserData } from '../helpers/data.js';
import { useTranslation } from 'react-i18next';

const LoginForm = () => {
  const showError = useShowError();
  const { t } = useTranslation();
  const [inputs, setInputs] = useState({
    username: '',
    password: '',
    wechat_verification_code: '',
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const { username, password } = inputs;
  const [userState, userDispatch] = useContext(UserContext);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  let navigate = useNavigate();
  const [status, setStatus] = useState({});
  const logo = getLogo();

  useEffect(() => {
    if (searchParams.get('expired')) {
      showError(t('components.LoginForm.errors.sessionExpired'));
    }
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      setStatus(status);
      if (status.turnstile_check) {
        setTurnstileEnabled(true);
        setTurnstileSiteKey(status.turnstile_site_key);
      }
    }
  }, []);

  const [showWeChatLoginModal, setShowWeChatLoginModal] = useState(false);

  const onWeChatLoginClicked = () => {
    setShowWeChatLoginModal(true);
  };

  const onSubmitWeChatVerificationCode = async () => {
    if (turnstileEnabled && turnstileToken === '') {
      showInfo(t('components.LoginForm.errors.turnstileCheck'));
      return;
    }
    const res = await API.get(
      `/api/oauth/wechat?code=${inputs.wechat_verification_code}`,
    );
    const { success, message, data } = res.data;
    if (success) {
      userDispatch({ type: 'login', payload: data });
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/');
      showSuccess(t('components.LoginForm.success.wechatLogin'));
      setShowWeChatLoginModal(false);
    } else {
      showError(message);
    }
  };

  function handleChange(name, value) {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  }

  async function handleSubmit(e) {
    if (turnstileEnabled && turnstileToken === '') {
      showInfo(t('components.LoginForm.errors.turnstileCheck'));
      return;
    }
    setSubmitted(true);
    if (username && password) {
      const res = await API.post(
        `/api/user/login?turnstile=${turnstileToken}`,
        {
          username,
          password,
        },
      );
      const { success, message, data } = res.data;
      if (success) {
        userDispatch({ type: 'login', payload: data });
        setUserData(data);
        showSuccess(t('components.LoginForm.success.login'));
        if (username === 'root' && password === '123456') {
          Modal.error({
            title: t('components.LoginForm.errors.defaultPasswordTitle'),
            content: t('components.LoginForm.errors.defaultPasswordContent'),
            centered: true,
          });
        }
        navigate('/token');
      } else {
        showError(message);
      }
    } else {
      showError(t('components.LoginForm.errors.missingCredentials'));
    }
  }

  // 添加Telegram登录处理函数
  const onTelegramLoginClicked = async (response) => {
    const fields = [
      'id',
      'first_name',
      'last_name',
      'username',
      'photo_url',
      'auth_date',
      'hash',
      'lang',
    ];
    const params = {};
    fields.forEach((field) => {
      if (response[field]) {
        params[field] = response[field];
      }
    });
    const res = await API.get(`/api/oauth/telegram/login`, { params });
    const { success, message, data } = res.data;
    if (success) {
      userDispatch({ type: 'login', payload: data });
      localStorage.setItem('user', JSON.stringify(data));
      showSuccess(t('components.LoginForm.success.telegramLogin'));
      navigate('/');
    } else {
      showError(message);
    }
  };

  return (
    <div>
      <Layout>
        <Layout.Header></Layout.Header>
        <Layout.Content>
          <div
            style={{
              justifyContent: 'center',
              display: 'flex',
              marginTop: 120,
            }}
          >
            <div style={{ width: 500 }}>
              <Card>
                <Title heading={2} style={{ textAlign: 'center' }}>
                  {t('components.LoginForm.title')}
                </Title>
                <Form>
                  <Form.Input
                    field={'username'}
                    label={t('components.LoginForm.labels.username')}
                    placeholder={t(
                      'components.LoginForm.placeholders.username',
                    )}
                    name='username'
                    onChange={(value) => handleChange('username', value)}
                  />
                  <Form.Input
                    field={'password'}
                    label={t('components.LoginForm.labels.password')}
                    placeholder={t(
                      'components.LoginForm.placeholders.password',
                    )}
                    name='password'
                    type='password'
                    onChange={(value) => handleChange('password', value)}
                  />

                  <Button
                    theme='solid'
                    style={{ width: '100%' }}
                    type={'primary'}
                    size='large'
                    htmlType={'submit'}
                    onClick={handleSubmit}
                  >
                    {t('components.LoginForm.buttons.login')}
                  </Button>
                </Form>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 20,
                  }}
                >
                  <Text>
                    {t('components.LoginForm.links.registerPrefix')}{' '}
                    <Link to='/register'>
                      {t('components.LoginForm.links.register')}
                    </Link>
                  </Text>
                  <Text>
                    {t('components.LoginForm.links.forgotPassword')}{' '}
                    <Link to='/reset'>
                      {t('components.LoginForm.links.reset')}
                    </Link>
                  </Text>
                </div>
                {status.github_oauth ||
                status.wechat_login ||
                status.telegram_oauth ? (
                  <>
                    <Divider margin='12px' align='center'>
                      {t('components.LoginForm.dividers.thirdParty')}
                    </Divider>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: 20,
                      }}
                    >
                      {status.github_oauth && (
                        <Button
                          type='primary'
                          icon={<IconGithubLogo />}
                          onClick={() =>
                            onGitHubOAuthClicked(status.github_client_id)
                          }
                        />
                      )}
                      {status.wechat_login && (
                        <Button
                          type='primary'
                          style={{ color: 'rgba(var(--semi-green-5), 1)' }}
                          icon={<Icon svg={<WeChatIcon />} />}
                          onClick={onWeChatLoginClicked}
                        />
                      )}
                    </div>
                    {status.telegram_oauth && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          marginTop: 5,
                        }}
                      >
                        <TelegramLoginButton
                          dataOnauth={onTelegramLoginClicked}
                          botName={status.telegram_bot_name}
                        />
                      </div>
                    )}
                  </>
                ) : null}
                <Modal
                  title={t('components.LoginForm.modals.wechatLogin.title')}
                  visible={showWeChatLoginModal}
                  maskClosable={true}
                  onOk={onSubmitWeChatVerificationCode}
                  onCancel={() => setShowWeChatLoginModal(false)}
                  okText={t('components.LoginForm.modals.wechatLogin.okText')}
                  size={'small'}
                  centered={true}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexDirection: 'column',
                    }}
                  >
                    <img
                      src={status.wechat_qrcode}
                      alt={t('components.LoginForm.modals.wechatLogin.altText')}
                    />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p>
                      {t('components.LoginForm.modals.wechatLogin.description')}
                    </p>
                  </div>
                  <Form size='large'>
                    <Form.Input
                      field={'wechat_verification_code'}
                      placeholder={t(
                        'components.LoginForm.modals.wechatLogin.placeholder',
                      )}
                      label={t('components.LoginForm.modals.wechatLogin.label')}
                      value={inputs.wechat_verification_code}
                      onChange={(value) =>
                        handleChange('wechat_verification_code', value)
                      }
                    />
                  </Form>
                </Modal>
              </Card>
              {turnstileEnabled && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: 20,
                  }}
                >
                  <Turnstile
                    sitekey={turnstileSiteKey}
                    onVerify={(token) => {
                      setTurnstileToken(token);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </Layout.Content>
      </Layout>
    </div>
  );
};

export default LoginForm;
