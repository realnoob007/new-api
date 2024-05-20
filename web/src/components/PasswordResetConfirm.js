import React, { useEffect, useState } from 'react';
import { Button, Form, Grid, Header, Image, Segment } from 'semantic-ui-react';
import { API, copy, useShowError, showNotice } from '../helpers';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PasswordResetConfirm = () => {
  const showError = useShowError();
  const { t } = useTranslation();
  const [inputs, setInputs] = useState({
    email: '',
    token: '',
  });
  const { email, token } = inputs;

  const [loading, setLoading] = useState(false);

  const [disableButton, setDisableButton] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const [newPassword, setNewPassword] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    let token = searchParams.get('token');
    let email = searchParams.get('email');
    setInputs({
      token,
      email,
    });
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
    return () => clearInterval(countdownInterval);
  }, [disableButton, countdown]);

  async function handleSubmit(e) {
    setDisableButton(true);
    if (!email) return;
    setLoading(true);
    const res = await API.post(`/api/user/reset`, {
      email,
      token,
    });
    const { success, message } = res.data;
    if (success) {
      let password = res.data.data;
      setNewPassword(password);
      await copy(password);
      showNotice(
        t('components.PasswordResetConfirm.passwordCopied', { password }),
      );
    } else {
      showError(message);
    }
    setLoading(false);
  }

  return (
    <Grid textAlign='center' style={{ marginTop: '48px' }}>
      <Grid.Column style={{ maxWidth: 450 }}>
        <Header as='h2' color='' textAlign='center'>
          <Image src='/logo.png' />{' '}
          {t('components.PasswordResetConfirm.passwordResetConfirm')}
        </Header>
        <Form size='large'>
          <Segment>
            <Form.Input
              fluid
              icon='mail'
              iconPosition='left'
              placeholder={t(
                'components.PasswordResetConfirm.emailPlaceholder',
              )}
              name='email'
              value={email}
              readOnly
            />
            {newPassword && (
              <Form.Input
                fluid
                icon='lock'
                iconPosition='left'
                placeholder={t(
                  'components.PasswordResetConfirm.newPasswordPlaceholder',
                )}
                name='newPassword'
                value={newPassword}
                readOnly
                onClick={(e) => {
                  e.target.select();
                  navigator.clipboard.writeText(newPassword);
                  showNotice(
                    t('components.PasswordResetConfirm.passwordCopied', {
                      password: newPassword,
                    }),
                  );
                }}
              />
            )}
            <Button
              color='green'
              fluid
              size='large'
              onClick={handleSubmit}
              loading={loading}
              disabled={disableButton}
            >
              {disableButton
                ? t('components.PasswordResetConfirm.resetCompleted')
                : t('components.PasswordResetConfirm.submit')}
            </Button>
          </Segment>
        </Form>
      </Grid.Column>
    </Grid>
  );
};

export default PasswordResetConfirm;
