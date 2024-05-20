import React, { useEffect, useRef, useState } from 'react';
import { Banner, Button, Col, Form, Row } from '@douyinfe/semi-ui';
import { API, useShowError, showSuccess } from '../helpers';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';

const OtherSetting = () => {
  const showError = useShowError();
  const { t } = useTranslation();
  let [inputs, setInputs] = useState({
    Notice: '',
    SystemName: '',
    Logo: '',
    Footer: '',
    About: '',
    HomePageContent: '',
  });
  let [loading, setLoading] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    tag_name: '',
    content: '',
  });

  const updateOption = async (key, value) => {
    setLoading(true);
    const res = await API.put('/api/option/', {
      key,
      value,
    });
    const { success, message } = res.data;
    if (success) {
      setInputs((inputs) => ({ ...inputs, [key]: value }));
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const [loadingInput, setLoadingInput] = useState({
    Notice: false,
    SystemName: false,
    Logo: false,
    HomePageContent: false,
    About: false,
    Footer: false,
  });
  const handleInputChange = async (value, e) => {
    const name = e.target.id;
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  // 通用设置
  const formAPISettingGeneral = useRef();
  // 通用设置 - Notice
  const submitNotice = async () => {
    try {
      setLoadingInput((loadingInput) => ({ ...loadingInput, Notice: true }));
      await updateOption('Notice', inputs.Notice);
      showSuccess(t('components.OtherSetting.noticeUpdated'));
    } catch (error) {
      console.error(t('components.OtherSetting.noticeUpdateFailed'), error);
      showError(t('components.OtherSetting.noticeUpdateFailed'));
    } finally {
      setLoadingInput((loadingInput) => ({ ...loadingInput, Notice: false }));
    }
  };
  // 个性化设置
  const formAPIPersonalization = useRef();
  //  个性化设置 - SystemName
  const submitSystemName = async () => {
    try {
      setLoadingInput((loadingInput) => ({
        ...loadingInput,
        SystemName: true,
      }));
      await updateOption('SystemName', inputs.SystemName);
      showSuccess(t('components.OtherSetting.systemNameUpdated'));
    } catch (error) {
      console.error(t('components.OtherSetting.systemNameUpdateFailed'), error);
      showError(t('components.OtherSetting.systemNameUpdateFailed'));
    } finally {
      setLoadingInput((loadingInput) => ({
        ...loadingInput,
        SystemName: false,
      }));
    }
  };

  // 个性化设置 - Logo
  const submitLogo = async () => {
    try {
      setLoadingInput((loadingInput) => ({ ...loadingInput, Logo: true }));
      await updateOption('Logo', inputs.Logo);
      showSuccess(t('components.OtherSetting.logoUpdated'));
    } catch (error) {
      console.error(t('components.OtherSetting.logoUpdateFailed'), error);
      showError(t('components.OtherSetting.logoUpdateFailed'));
    } finally {
      setLoadingInput((loadingInput) => ({ ...loadingInput, Logo: false }));
    }
  };
  // 个性化设置 - 首页内容
  const submitOption = async (key) => {
    try {
      setLoadingInput((loadingInput) => ({
        ...loadingInput,
        HomePageContent: true,
      }));
      await updateOption(key, inputs[key]);
      showSuccess(t('components.OtherSetting.homePageContentUpdated'));
    } catch (error) {
      console.error(
        t('components.OtherSetting.homePageContentUpdateFailed'),
        error,
      );
      showError(t('components.OtherSetting.homePageContentUpdateFailed'));
    } finally {
      setLoadingInput((loadingInput) => ({
        ...loadingInput,
        HomePageContent: false,
      }));
    }
  };
  // 个性化设置 - 关于
  const submitAbout = async () => {
    try {
      setLoadingInput((loadingInput) => ({ ...loadingInput, About: true }));
      await updateOption('About', inputs.About);
      showSuccess(t('components.OtherSetting.aboutUpdated'));
    } catch (error) {
      console.error(t('components.OtherSetting.aboutUpdateFailed'), error);
      showError(t('components.OtherSetting.aboutUpdateFailed'));
    } finally {
      setLoadingInput((loadingInput) => ({ ...loadingInput, About: false }));
    }
  };
  // 个性化设置 - 页脚
  const submitFooter = async () => {
    try {
      setLoadingInput((loadingInput) => ({ ...loadingInput, Footer: true }));
      await updateOption('Footer', inputs.Footer);
      showSuccess(t('components.OtherSetting.footerUpdated'));
    } catch (error) {
      console.error(t('components.OtherSetting.footerUpdateFailed'), error);
      showError(t('components.OtherSetting.footerUpdateFailed'));
    } finally {
      setLoadingInput((loadingInput) => ({ ...loadingInput, Footer: false }));
    }
  };

  const openGitHubRelease = () => {
    window.location = 'https://github.com/songquanpeng/one-api/releases/latest';
  };

  const checkUpdate = async () => {
    const res = await API.get(
      'https://api.github.com/repos/songquanpeng/one-api/releases/latest',
    );
    const { tag_name, body } = res.data;
    if (tag_name === process.env.REACT_APP_VERSION) {
      showSuccess(t('components.OtherSetting.latestVersion', { tag_name }));
    } else {
      setUpdateData({
        tag_name: tag_name,
        content: marked.parse(body),
      });
      setShowUpdateModal(true);
    }
  };
  const getOptions = async () => {
    const res = await API.get('/api/option/');
    const { success, message, data } = res.data;
    if (success) {
      let newInputs = {};
      data.forEach((item) => {
        if (item.key in inputs) {
          newInputs[item.key] = item.value;
        }
      });
      setInputs(newInputs);
      formAPISettingGeneral.current.setValues(newInputs);
      formAPIPersonalization.current.setValues(newInputs);
    } else {
      showError(message);
    }
  };

  useEffect(() => {
    getOptions();
  }, []);

  return (
    <Row>
      <Col span={24}>
        {/* 通用设置 */}
        <Form
          values={inputs}
          getFormApi={(formAPI) => (formAPISettingGeneral.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={t('components.OtherSetting.generalSettings')}>
            <Form.TextArea
              label={t('components.OtherSetting.notice')}
              placeholder={t('components.OtherSetting.noticePlaceholder')}
              field={'Notice'}
              onChange={handleInputChange}
              style={{ fontFamily: 'JetBrains Mono, Consolas' }}
              autosize={{ minRows: 6, maxRows: 12 }}
            />
            <Button onClick={submitNotice} loading={loadingInput['Notice']}>
              {t('components.OtherSetting.setNotice')}
            </Button>
          </Form.Section>
        </Form>
        {/* 个性化设置 */}
        <Form
          values={inputs}
          getFormApi={(formAPI) => (formAPIPersonalization.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section
            text={t('components.OtherSetting.personalizationSettings')}
          >
            <Form.Input
              label={t('components.OtherSetting.systemName')}
              placeholder={t('components.OtherSetting.systemNamePlaceholder')}
              field={'SystemName'}
              onChange={handleInputChange}
            />
            <Button
              onClick={submitSystemName}
              loading={loadingInput['SystemName']}
            >
              {t('components.OtherSetting.setSystemName')}
            </Button>
            <Form.Input
              label={t('components.OtherSetting.logo')}
              placeholder={t('components.OtherSetting.logoPlaceholder')}
              field={'Logo'}
              onChange={handleInputChange}
            />
            <Button onClick={submitLogo} loading={loadingInput['Logo']}>
              {t('components.OtherSetting.setLogo')}
            </Button>
            <Form.TextArea
              label={t('components.OtherSetting.homePageContent')}
              placeholder={t(
                'components.OtherSetting.homePageContentPlaceholder',
              )}
              field={'HomePageContent'}
              onChange={handleInputChange}
              style={{ fontFamily: 'JetBrains Mono, Consolas' }}
              autosize={{ minRows: 6, maxRows: 12 }}
            />
            <Button
              onClick={() => submitOption('HomePageContent')}
              loading={loadingInput['HomePageContent']}
            >
              {t('components.OtherSetting.setHomePageContent')}
            </Button>
            <Form.TextArea
              label={t('components.OtherSetting.about')}
              placeholder={t('components.OtherSetting.aboutPlaceholder')}
              field={'About'}
              onChange={handleInputChange}
              style={{ fontFamily: 'JetBrains Mono, Consolas' }}
              autosize={{ minRows: 6, maxRows: 12 }}
            />
            <Button onClick={submitAbout} loading={loadingInput['About']}>
              {t('components.OtherSetting.setAbout')}
            </Button>
            {/*  */}
            <Banner
              fullMode={false}
              type='info'
              description={t('components.OtherSetting.bannerDescription')}
              closeIcon={null}
              style={{ marginTop: 15 }}
            />
            <Form.Input
              label={t('components.OtherSetting.footer')}
              placeholder={t('components.OtherSetting.footerPlaceholder')}
              field={'Footer'}
              onChange={handleInputChange}
            />
            <Button onClick={submitFooter} loading={loadingInput['Footer']}>
              {t('components.OtherSetting.setFooter')}
            </Button>
          </Form.Section>
        </Form>
      </Col>
      {/*<Modal*/}
      {/*  onClose={() => setShowUpdateModal(false)}*/}
      {/*  onOpen={() => setShowUpdateModal(true)}*/}
      {/*  open={showUpdateModal}*/}
      {/*>*/}
      {/*  <Modal.Header>{t('components.OtherSetting.newVersion', { tag_name: updateData.tag_name })}</Modal.Header>*/}
      {/*  <Modal.Content>*/}
      {/*    <Modal.Description>*/}
      {/*      <div dangerouslySetInnerHTML={{ __html: updateData.content }}></div>*/}
      {/*    </Modal.Description>*/}
      {/*  </Modal.Content>*/}
      {/*  <Modal.Actions>*/}
      {/*    <Button onClick={() => setShowUpdateModal(false)}>{t('components.OtherSetting.close')}</Button>*/}
      {/*    <Button*/}
      {/*      content={t('components.OtherSetting.details')}*/}
      {/*      onClick={() => {*/}
      {/*        setShowUpdateModal(false);*/}
      {/*        openGitHubRelease();*/}
      {/*      }}*/}
      {/*    />*/}
      {/*  </Modal.Actions>*/}
      {/*</Modal>*/}
    </Row>
  );
};

export default OtherSetting;
