import React, { useEffect, useState } from 'react';
import {
  Button,
  Form,
  Grid,
  Header,
  Image,
  Message,
  Segment,
} from 'semantic-ui-react';
import { Link, useNavigate } from 'react-router-dom';
import { API, getLogo, useShowError, showInfo, showSuccess } from '../helpers';
import Turnstile from 'react-turnstile';
import { useTranslation } from 'react-i18next';

const RegisterForm = () => {
  const showError = useShowError();
  const { t } = useTranslation();
  const [inputs, setInputs] = useState({
    username: '',
    password: '',
    password2: '',
    email: '',
    verification_code: '',
  });
  const { username, password, password2 } = inputs;
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const logo = getLogo();
  let affCode = new URLSearchParams(window.location.search).get('aff');
  if (affCode) {
    localStorage.setItem('aff', affCode);
  }

  useEffect(() => {
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      setShowEmailVerification(status.email_verification);
      if (status.turnstile_check) {
        setTurnstileEnabled(true);
        setTurnstileSiteKey(status.turnstile_site_key);
      }
    }
  });

  let navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    console.log(name, value);
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  }

  async function handleSubmit(e) {
    if (password.length < 8) {
      showInfo(t('components.RegisterForm.shortPassword'));
      return;
    }
    if (password !== password2) {
      showInfo(t('components.RegisterForm.passwordMismatch'));
      return;
    }
    if (username && password) {
      if (turnstileEnabled && turnstileToken === '') {
        showInfo(t('components.RegisterForm.turnstileCheck'));
        return;
      }
      setLoading(true);
      if (!affCode) {
        affCode = localStorage.getItem('aff');
      }
      inputs.aff_code = affCode;
      const res = await API.post(
        `/api/user/register?turnstile=${turnstileToken}`,
        inputs,
      );
      const { success, message } = res.data;
      if (success) {
        navigate('/login');
        showSuccess(t('components.RegisterForm.registrationSuccess'));
      } else {
        showError(message);
      }
      setLoading(false);
    }
  }

  const sendVerificationCode = async () => {
    if (inputs.email === '') return;
    if (turnstileEnabled && turnstileToken === '') {
      showInfo(t('components.RegisterForm.turnstileCheck'));
      return;
    }
    setLoading(true);
    const res = await API.get(
      `/api/verification?email=${inputs.email}&turnstile=${turnstileToken}`,
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('components.RegisterForm.verificationCodeSent'));
    } else {
      showError(message);
    }
    setLoading(false);
  };

  return (
    <Grid textAlign='center' style={{ marginTop: '48px' }}>
      <Grid.Column style={{ maxWidth: 450 }}>
        <Header as='h2' color='' textAlign='center'>
          <Image src={logo} /> {t('components.RegisterForm.newUserRegister')}
        </Header>
        <Form size='large'>
          <Segment>
            <Form.Input
              fluid
              icon='user'
              iconPosition='left'
              placeholder={t('components.RegisterForm.enterUsername')}
              onChange={handleChange}
              name='username'
            />
            <Form.Input
              fluid
              icon='lock'
              iconPosition='left'
              placeholder={t('components.RegisterForm.enterPassword')}
              onChange={handleChange}
              name='password'
              type='password'
            />
            <Form.Input
              fluid
              icon='lock'
              iconPosition='left'
              placeholder={t('components.RegisterForm.confirmPassword')}
              onChange={handleChange}
              name='password2'
              type='password'
            />
            {showEmailVerification ? (
              <>
                <Form.Input
                  fluid
                  icon='mail'
                  iconPosition='left'
                  placeholder={t('components.RegisterForm.enterEmail')}
                  onChange={handleChange}
                  name='email'
                  type='email'
                  action={
                    <Button onClick={sendVerificationCode} disabled={loading}>
                      {t('components.RegisterForm.getVerificationCode')}
                    </Button>
                  }
                />
                <Form.Input
                  fluid
                  icon='lock'
                  iconPosition='left'
                  placeholder={t(
                    'components.RegisterForm.enterVerificationCode',
                  )}
                  onChange={handleChange}
                  name='verification_code'
                />
              </>
            ) : (
              <></>
            )}
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
            <Button
              color='green'
              fluid
              size='large'
              onClick={handleSubmit}
              loading={loading}
            >
              {t('components.RegisterForm.register')}
            </Button>
          </Segment>
        </Form>
        <Message>
          {t('components.RegisterForm.haveAccount')}
          <Link to='/login' className='btn btn-link'>
            {t('components.RegisterForm.clickToLogin')}
          </Link>
        </Message>
      </Grid.Column>
    </Grid>
  );
};

export default RegisterForm;
