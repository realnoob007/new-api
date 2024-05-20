import React, { useEffect, useState } from 'react';
import {
  Button,
  Divider,
  Form,
  Grid,
  Header,
  Message,
  Modal,
} from 'semantic-ui-react';
import { API, removeTrailingSlash, useShowError, verifyJSON } from '../helpers';
import { useTheme } from '../context/Theme';
import { useTranslation } from 'react-i18next';

const SystemSetting = () => {
  const showError = useShowError();
  const { t } = useTranslation();
  let [inputs, setInputs] = useState({
    PasswordLoginEnabled: '',
    PasswordRegisterEnabled: '',
    EmailVerificationEnabled: '',
    GitHubOAuthEnabled: '',
    GitHubClientId: '',
    GitHubClientSecret: '',
    Notice: '',
    SMTPServer: '',
    SMTPPort: '',
    SMTPAccount: '',
    SMTPFrom: '',
    SMTPToken: '',
    ServerAddress: '',
    EpayId: '',
    EpayKey: '',
    Price: 7.3,
    MinTopUp: 1,
    TopupGroupRatio: '',
    PayAddress: '',
    CustomCallbackAddress: '',
    Footer: '',
    WeChatAuthEnabled: '',
    WeChatServerAddress: '',
    WeChatServerToken: '',
    WeChatAccountQRCodeImageURL: '',
    TurnstileCheckEnabled: '',
    TurnstileSiteKey: '',
    TurnstileSecretKey: '',
    RegisterEnabled: '',
    EmailDomainRestrictionEnabled: '',
    EmailAliasRestrictionEnabled: '',
    SMTPSSLEnabled: '',
    EmailDomainWhitelist: [],
    TelegramOAuthEnabled: '',
    TelegramBotToken: '',
    TelegramBotName: '',
  });
  const [originInputs, setOriginInputs] = useState({});
  let [loading, setLoading] = useState(false);
  const [EmailDomainWhitelist, setEmailDomainWhitelist] = useState([]);
  const [restrictedDomainInput, setRestrictedDomainInput] = useState('');
  const [showPasswordWarningModal, setShowPasswordWarningModal] =
    useState(false);

  const theme = useTheme();
  const isDark = theme === 'dark';

  const getOptions = async () => {
    const res = await API.get('/api/option/');
    const { success, message, data } = res.data;
    if (success) {
      let newInputs = {};
      data.forEach((item) => {
        if (item.key === 'TopupGroupRatio') {
          item.value = JSON.stringify(JSON.parse(item.value), null, 2);
        }
        newInputs[item.key] = item.value;
      });
      setInputs({
        ...newInputs,
        EmailDomainWhitelist: newInputs.EmailDomainWhitelist.split(','),
      });
      setOriginInputs(newInputs);

      setEmailDomainWhitelist(
        newInputs.EmailDomainWhitelist.split(',').map((item) => {
          return { key: item, text: item, value: item };
        }),
      );
    } else {
      showError(message);
    }
  };

  useEffect(() => {
    getOptions().then();
  }, []);
  useEffect(() => {}, [inputs.EmailDomainWhitelist]);

  const updateOption = async (key, value) => {
    setLoading(true);
    switch (key) {
      case 'PasswordLoginEnabled':
      case 'PasswordRegisterEnabled':
      case 'EmailVerificationEnabled':
      case 'GitHubOAuthEnabled':
      case 'WeChatAuthEnabled':
      case 'TelegramOAuthEnabled':
      case 'TurnstileCheckEnabled':
      case 'EmailDomainRestrictionEnabled':
      case 'EmailAliasRestrictionEnabled':
      case 'SMTPSSLEnabled':
      case 'RegisterEnabled':
        value = inputs[key] === 'true' ? 'false' : 'true';
        break;
      default:
        break;
    }
    const res = await API.put('/api/option/', {
      key,
      value,
    });
    const { success, message } = res.data;
    if (success) {
      if (key === 'EmailDomainWhitelist') {
        value = value.split(',');
      }
      if (key === 'Price') {
        value = parseFloat(value);
      }
      setInputs((inputs) => ({
        ...inputs,
        [key]: value,
      }));
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const handleInputChange = async (e, { name, value }) => {
    if (name === 'PasswordLoginEnabled' && inputs[name] === 'true') {
      setShowPasswordWarningModal(true);
      return;
    }
    if (
      name === 'Notice' ||
      (name.startsWith('SMTP') && name !== 'SMTPSSLEnabled') ||
      name === 'ServerAddress' ||
      name === 'EpayId' ||
      name === 'EpayKey' ||
      name === 'Price' ||
      name === 'PayAddress' ||
      name === 'GitHubClientId' ||
      name === 'GitHubClientSecret' ||
      name === 'WeChatServerAddress' ||
      name === 'WeChatServerToken' ||
      name === 'WeChatAccountQRCodeImageURL' ||
      name === 'TurnstileSiteKey' ||
      name === 'TurnstileSecretKey' ||
      name === 'EmailDomainWhitelist' ||
      name === 'TopupGroupRatio' ||
      name === 'TelegramBotToken' ||
      name === 'TelegramBotName'
    ) {
      setInputs((inputs) => ({ ...inputs, [name]: value }));
    } else {
      await updateOption(name, value);
    }
  };

  const submitServerAddress = async () => {
    let ServerAddress = removeTrailingSlash(inputs.ServerAddress);
    await updateOption('ServerAddress', ServerAddress);
  };

  const submitPayAddress = async () => {
    if (inputs.ServerAddress === '') {
      showError(t('components.SystemSetting.pleaseEnterServerAddress'));
      return;
    }
    if (originInputs['TopupGroupRatio'] !== inputs.TopupGroupRatio) {
      if (!verifyJSON(inputs.TopupGroupRatio)) {
        showError(t('components.SystemSetting.invalidJsonString'));
        return;
      }
      await updateOption('TopupGroupRatio', inputs.TopupGroupRatio);
    }
    let PayAddress = removeTrailingSlash(inputs.PayAddress);
    await updateOption('PayAddress', PayAddress);
    if (inputs.EpayId !== '') {
      await updateOption('EpayId', inputs.EpayId);
    }
    if (inputs.EpayKey !== undefined && inputs.EpayKey !== '') {
      await updateOption('EpayKey', inputs.EpayKey);
    }
    await updateOption('Price', '' + inputs.Price);
  };

  const submitSMTP = async () => {
    if (originInputs['SMTPServer'] !== inputs.SMTPServer) {
      await updateOption('SMTPServer', inputs.SMTPServer);
    }
    if (originInputs['SMTPAccount'] !== inputs.SMTPAccount) {
      await updateOption('SMTPAccount', inputs.SMTPAccount);
    }
    if (originInputs['SMTPFrom'] !== inputs.SMTPFrom) {
      await updateOption('SMTPFrom', inputs.SMTPFrom);
    }
    if (
      originInputs['SMTPPort'] !== inputs.SMTPPort &&
      inputs.SMTPPort !== ''
    ) {
      await updateOption('SMTPPort', inputs.SMTPPort);
    }
    if (
      originInputs['SMTPToken'] !== inputs.SMTPToken &&
      inputs.SMTPToken !== ''
    ) {
      await updateOption('SMTPToken', inputs.SMTPToken);
    }
  };

  const submitEmailDomainWhitelist = async () => {
    if (
      originInputs['EmailDomainWhitelist'] !==
        inputs.EmailDomainWhitelist.join(',') &&
      inputs.SMTPToken !== ''
    ) {
      await updateOption(
        'EmailDomainWhitelist',
        inputs.EmailDomainWhitelist.join(','),
      );
    }
  };

  const submitWeChat = async () => {
    if (originInputs['WeChatServerAddress'] !== inputs.WeChatServerAddress) {
      await updateOption(
        'WeChatServerAddress',
        removeTrailingSlash(inputs.WeChatServerAddress),
      );
    }
    if (
      originInputs['WeChatAccountQRCodeImageURL'] !==
      inputs.WeChatAccountQRCodeImageURL
    ) {
      await updateOption(
        'WeChatAccountQRCodeImageURL',
        inputs.WeChatAccountQRCodeImageURL,
      );
    }
    if (
      originInputs['WeChatServerToken'] !== inputs.WeChatServerToken &&
      inputs.WeChatServerToken !== ''
    ) {
      await updateOption('WeChatServerToken', inputs.WeChatServerToken);
    }
  };

  const submitGitHubOAuth = async () => {
    if (originInputs['GitHubClientId'] !== inputs.GitHubClientId) {
      await updateOption('GitHubClientId', inputs.GitHubClientId);
    }
    if (
      originInputs['GitHubClientSecret'] !== inputs.GitHubClientSecret &&
      inputs.GitHubClientSecret !== ''
    ) {
      await updateOption('GitHubClientSecret', inputs.GitHubClientSecret);
    }
  };

  const submitTelegramSettings = async () => {
    await updateOption('TelegramBotToken', inputs.TelegramBotToken);
    await updateOption('TelegramBotName', inputs.TelegramBotName);
  };

  const submitTurnstile = async () => {
    if (originInputs['TurnstileSiteKey'] !== inputs.TurnstileSiteKey) {
      await updateOption('TurnstileSiteKey', inputs.TurnstileSiteKey);
    }
    if (
      originInputs['TurnstileSecretKey'] !== inputs.TurnstileSecretKey &&
      inputs.TurnstileSecretKey !== ''
    ) {
      await updateOption('TurnstileSecretKey', inputs.TurnstileSecretKey);
    }
  };

  const submitNewRestrictedDomain = () => {
    const localDomainList = inputs.EmailDomainWhitelist;
    if (
      restrictedDomainInput !== '' &&
      !localDomainList.includes(restrictedDomainInput)
    ) {
      setRestrictedDomainInput('');
      setInputs({
        ...inputs,
        EmailDomainWhitelist: [...localDomainList, restrictedDomainInput],
      });
      setEmailDomainWhitelist([
        ...EmailDomainWhitelist,
        {
          key: restrictedDomainInput,
          text: restrictedDomainInput,
          value: restrictedDomainInput,
        },
      ]);
    }
  };

  return (
    <Grid columns={1}>
      <Grid.Column>
        <Form loading={loading} inverted={isDark}>
          <Header as='h3' inverted={isDark}>
            {t('components.SystemSetting.generalSettings')}
          </Header>
          <Form.Group widths='equal'>
            <Form.Input
              label={t('components.SystemSetting.serverAddress')}
              placeholder={t(
                'components.SystemSetting.serverAddressPlaceholder',
              )}
              value={inputs.ServerAddress}
              name='ServerAddress'
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Button onClick={submitServerAddress}>
            {t('components.SystemSetting.updateServerAddress')}
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            {t('components.SystemSetting.paymentSettings')}
          </Header>
          <Form.Group widths='equal'>
            <Form.Input
              label={t('components.SystemSetting.paymentAddress')}
              placeholder={t(
                'components.SystemSetting.paymentAddressPlaceholder',
              )}
              value={inputs.PayAddress}
              name='PayAddress'
              onChange={handleInputChange}
            />
            <Form.Input
              label={t('components.SystemSetting.epayId')}
              placeholder={t('components.SystemSetting.epayIdPlaceholder')}
              value={inputs.EpayId}
              name='EpayId'
              onChange={handleInputChange}
            />
            <Form.Input
              label={t('components.SystemSetting.epayKey')}
              placeholder={t('components.SystemSetting.epayKeyPlaceholder')}
              value={inputs.EpayKey}
              name='EpayKey'
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group widths='equal'>
            <Form.Input
              label={t('components.SystemSetting.callbackAddress')}
              placeholder={t(
                'components.SystemSetting.callbackAddressPlaceholder',
              )}
              value={inputs.CustomCallbackAddress}
              name='CustomCallbackAddress'
              onChange={handleInputChange}
            />
            <Form.Input
              label={t('components.SystemSetting.price')}
              placeholder={t('components.SystemSetting.pricePlaceholder')}
              value={inputs.Price}
              name='Price'
              min={0}
              onChange={handleInputChange}
            />
            <Form.Input
              label={t('components.SystemSetting.minTopUp')}
              placeholder={t('components.SystemSetting.minTopUpPlaceholder')}
              value={inputs.MinTopUp}
              name='MinTopUp'
              min={1}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group widths='equal'>
            <Form.TextArea
              label={t('components.SystemSetting.topUpGroupRatio')}
              name='TopupGroupRatio'
              onChange={handleInputChange}
              style={{ minHeight: 250, fontFamily: 'JetBrains Mono, Consolas' }}
              autoComplete='new-password'
              value={inputs.TopupGroupRatio}
              placeholder={t(
                'components.SystemSetting.topUpGroupRatioPlaceholder',
              )}
            />
          </Form.Group>
          <Form.Button onClick={submitPayAddress}>
            {t('components.SystemSetting.updatePaymentSettings')}
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            {t('components.SystemSetting.loginRegisterSettings')}
          </Header>
          <Form.Group inline>
            <Form.Checkbox
              checked={inputs.PasswordLoginEnabled === 'true'}
              label={t('components.SystemSetting.enablePasswordLogin')}
              name='PasswordLoginEnabled'
              onChange={handleInputChange}
            />
            {showPasswordWarningModal && (
              <Modal
                open={showPasswordWarningModal}
                onClose={() => setShowPasswordWarningModal(false)}
                size={'tiny'}
                style={{ maxWidth: '450px' }}
              >
                <Modal.Header>
                  {t('components.SystemSetting.warning')}
                </Modal.Header>
                <Modal.Content>
                  <p>{t('components.SystemSetting.passwordLoginWarning')}</p>
                </Modal.Content>
                <Modal.Actions>
                  <Button onClick={() => setShowPasswordWarningModal(false)}>
                    {t('components.SystemSetting.cancel')}
                  </Button>
                  <Button
                    color='yellow'
                    onClick={async () => {
                      setShowPasswordWarningModal(false);
                      await updateOption('PasswordLoginEnabled', 'false');
                    }}
                  >
                    {t('components.SystemSetting.confirm')}
                  </Button>
                </Modal.Actions>
              </Modal>
            )}
            <Form.Checkbox
              checked={inputs.PasswordRegisterEnabled === 'true'}
              label={t('components.SystemSetting.enablePasswordRegister')}
              name='PasswordRegisterEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.EmailVerificationEnabled === 'true'}
              label={t('components.SystemSetting.enableEmailVerification')}
              name='EmailVerificationEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.GitHubOAuthEnabled === 'true'}
              label={t('components.SystemSetting.enableGitHubOAuth')}
              name='GitHubOAuthEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.WeChatAuthEnabled === 'true'}
              label={t('components.SystemSetting.enableWeChatAuth')}
              name='WeChatAuthEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.TelegramOAuthEnabled === 'true'}
              label={t('components.SystemSetting.enableTelegramOAuth')}
              name='TelegramOAuthEnabled'
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group inline>
            <Form.Checkbox
              checked={inputs.RegisterEnabled === 'true'}
              label={t('components.SystemSetting.enableRegister')}
              name='RegisterEnabled'
              onChange={handleInputChange}
            />
            <Form.Checkbox
              checked={inputs.TurnstileCheckEnabled === 'true'}
              label={t('components.SystemSetting.enableTurnstile')}
              name='TurnstileCheckEnabled'
              onChange={handleInputChange}
            />
          </Form.Group>
          <Divider />
          <Header as='h3' inverted={isDark}>
            {t('components.SystemSetting.emailDomainWhitelistSettings')}
            <Header.Subheader>
              {t('components.SystemSetting.emailDomainWhitelistSubheader')}
            </Header.Subheader>
          </Header>
          <Form.Group widths={3}>
            <Form.Checkbox
              label={t('components.SystemSetting.enableEmailDomainWhitelist')}
              name='EmailDomainRestrictionEnabled'
              onChange={handleInputChange}
              checked={inputs.EmailDomainRestrictionEnabled === 'true'}
            />
          </Form.Group>
          <Form.Group widths={3}>
            <Form.Checkbox
              label={t('components.SystemSetting.enableEmailAliasRestriction')}
              name='EmailAliasRestrictionEnabled'
              onChange={handleInputChange}
              checked={inputs.EmailAliasRestrictionEnabled === 'true'}
            />
          </Form.Group>
          <Form.Group widths={2}>
            <Form.Dropdown
              label={t('components.SystemSetting.allowedEmailDomains')}
              placeholder={t(
                'components.SystemSetting.allowedEmailDomainsPlaceholder',
              )}
              name='EmailDomainWhitelist'
              required
              fluid
              multiple
              selection
              onChange={handleInputChange}
              value={inputs.EmailDomainWhitelist}
              autoComplete='new-password'
              options={EmailDomainWhitelist}
            />
            <Form.Input
              label={t('components.SystemSetting.addNewAllowedEmailDomain')}
              action={
                <Button
                  type='button'
                  onClick={() => {
                    submitNewRestrictedDomain();
                  }}
                >
                  {t('components.SystemSetting.add')}
                </Button>
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  submitNewRestrictedDomain();
                }
              }}
              autoComplete='new-password'
              placeholder={t(
                'components.SystemSetting.addNewAllowedEmailDomainPlaceholder',
              )}
              value={restrictedDomainInput}
              onChange={(e, { value }) => {
                setRestrictedDomainInput(value);
              }}
            />
          </Form.Group>
          <Form.Button onClick={submitEmailDomainWhitelist}>
            {t('components.SystemSetting.saveEmailDomainWhitelistSettings')}
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            {t('components.SystemSetting.smtpSettings')}
            <Header.Subheader>
              {t('components.SystemSetting.smtpSettingsSubheader')}
            </Header.Subheader>
          </Header>
          <Form.Group widths={3}>
            <Form.Input
              label={t('components.SystemSetting.smtpServer')}
              name='SMTPServer'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.SMTPServer}
              placeholder={t('components.SystemSetting.smtpServerPlaceholder')}
            />
            <Form.Input
              label={t('components.SystemSetting.smtpPort')}
              name='SMTPPort'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.SMTPPort}
              placeholder={t('components.SystemSetting.smtpPortPlaceholder')}
            />
            <Form.Input
              label={t('components.SystemSetting.smtpAccount')}
              name='SMTPAccount'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.SMTPAccount}
              placeholder={t('components.SystemSetting.smtpAccountPlaceholder')}
            />
          </Form.Group>
          <Form.Group widths={3}>
            <Form.Input
              label={t('components.SystemSetting.smtpFrom')}
              name='SMTPFrom'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.SMTPFrom}
              placeholder={t('components.SystemSetting.smtpFromPlaceholder')}
            />
            <Form.Input
              label={t('components.SystemSetting.smtpToken')}
              name='SMTPToken'
              onChange={handleInputChange}
              type='password'
              autoComplete='new-password'
              checked={inputs.RegisterEnabled === 'true'}
              placeholder={t('components.SystemSetting.smtpTokenPlaceholder')}
            />
          </Form.Group>
          <Form.Group widths={3}>
            <Form.Checkbox
              label={t('components.SystemSetting.enableSmtpSsl')}
              name='SMTPSSLEnabled'
              onChange={handleInputChange}
              checked={inputs.SMTPSSLEnabled === 'true'}
            />
          </Form.Group>
          <Form.Button onClick={submitSMTP}>
            {t('components.SystemSetting.saveSmtpSettings')}
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            {t('components.SystemSetting.githubOAuthSettings')}
            <Header.Subheader>
              {t('components.SystemSetting.githubOAuthSettingsSubheader')}
            </Header.Subheader>
          </Header>
          <Message>
            {t('components.SystemSetting.githubOAuthSettingsMessage')}
          </Message>
          <Form.Group widths={3}>
            <Form.Input
              label={t('components.SystemSetting.githubClientId')}
              name='GitHubClientId'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.GitHubClientId}
              placeholder={t(
                'components.SystemSetting.githubClientIdPlaceholder',
              )}
            />
            <Form.Input
              label={t('components.SystemSetting.githubClientSecret')}
              name='GitHubClientSecret'
              onChange={handleInputChange}
              type='password'
              autoComplete='new-password'
              value={inputs.GitHubClientSecret}
              placeholder={t(
                'components.SystemSetting.githubClientSecretPlaceholder',
              )}
            />
          </Form.Group>
          <Form.Button onClick={submitGitHubOAuth}>
            {t('components.SystemSetting.saveGithubOAuthSettings')}
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            {t('components.SystemSetting.weChatServerSettings')}
            <Header.Subheader>
              {t('components.SystemSetting.weChatServerSettingsSubheader')}
            </Header.Subheader>
          </Header>
          <Form.Group widths={3}>
            <Form.Input
              label={t('components.SystemSetting.weChatServerAddress')}
              name='WeChatServerAddress'
              placeholder={t(
                'components.SystemSetting.weChatServerAddressPlaceholder',
              )}
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.WeChatServerAddress}
            />
            <Form.Input
              label={t('components.SystemSetting.weChatServerToken')}
              name='WeChatServerToken'
              type='password'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.WeChatServerToken}
              placeholder={t(
                'components.SystemSetting.weChatServerTokenPlaceholder',
              )}
            />
            <Form.Input
              label={t('components.SystemSetting.weChatAccountQRCodeImageUrl')}
              name='WeChatAccountQRCodeImageURL'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.WeChatAccountQRCodeImageURL}
              placeholder={t(
                'components.SystemSetting.weChatAccountQRCodeImageUrlPlaceholder',
              )}
            />
          </Form.Group>
          <Form.Button onClick={submitWeChat}>
            {t('components.SystemSetting.saveWeChatServerSettings')}
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            {t('components.SystemSetting.telegramLoginSettings')}
          </Header>
          <Form.Group inline>
            <Form.Input
              label={t('components.SystemSetting.telegramBotToken')}
              name='TelegramBotToken'
              onChange={handleInputChange}
              value={inputs.TelegramBotToken}
              placeholder={t(
                'components.SystemSetting.telegramBotTokenPlaceholder',
              )}
            />
            <Form.Input
              label={t('components.SystemSetting.telegramBotName')}
              name='TelegramBotName'
              onChange={handleInputChange}
              value={inputs.TelegramBotName}
              placeholder={t(
                'components.SystemSetting.telegramBotNamePlaceholder',
              )}
            />
          </Form.Group>
          <Form.Button onClick={submitTelegramSettings}>
            {t('components.SystemSetting.saveTelegramLoginSettings')}
          </Form.Button>
          <Divider />
          <Header as='h3' inverted={isDark}>
            {t('components.SystemSetting.turnstileSettings')}
            <Header.Subheader>
              {t('components.SystemSetting.turnstileSettingsSubheader')}
            </Header.Subheader>
          </Header>
          <Form.Group widths={3}>
            <Form.Input
              label={t('components.SystemSetting.turnstileSiteKey')}
              name='TurnstileSiteKey'
              onChange={handleInputChange}
              autoComplete='new-password'
              value={inputs.TurnstileSiteKey}
              placeholder={t(
                'components.SystemSetting.turnstileSiteKeyPlaceholder',
              )}
            />
            <Form.Input
              label={t('components.SystemSetting.turnstileSecretKey')}
              name='TurnstileSecretKey'
              onChange={handleInputChange}
              type='password'
              autoComplete='new-password'
              value={inputs.TurnstileSecretKey}
              placeholder={t(
                'components.SystemSetting.turnstileSecretKeyPlaceholder',
              )}
            />
          </Form.Group>
          <Form.Button onClick={submitTurnstile}>
            {t('components.SystemSetting.saveTurnstileSettings')}
          </Form.Button>
        </Form>
      </Grid.Column>
    </Grid>
  );
};

export default SystemSetting;
