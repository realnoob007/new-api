import React, { useContext, useEffect, useState } from 'react';
import { Card, Col, Row } from '@douyinfe/semi-ui';
import { API, useShowError, showNotice, timestamp2string } from '../../helpers';
import { StatusContext } from '../../context/Status';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const showError = useShowError();
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');

  const displayNotice = async () => {
    const res = await API.get('/api/notice');
    const { success, message, data } = res.data;
    if (success) {
      let oldNotice = localStorage.getItem('notice');
      if (data !== oldNotice && data !== '') {
        const htmlNotice = marked(data);
        showNotice(htmlNotice, true);
        localStorage.setItem('notice', data);
      }
    } else {
      showError(message);
    }
  };

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);
    } else {
      showError(message);
      setHomePageContent(t('pages.Home.index.loadHomePageContentError'));
    }
    setHomePageContentLoaded(true);
  };

  const getStartTimeString = () => {
    const timestamp = statusState?.status?.start_time;
    return statusState.status ? timestamp2string(timestamp) : '';
  };

  useEffect(() => {
    displayNotice().then();
    displayHomePageContent().then();
  }, []);
  return (
    <>
      {homePageContentLoaded && homePageContent === '' ? (
        <>
          <Card
            bordered={false}
            headerLine={false}
            title={t('pages.Home.index.systemStatus')}
            bodyStyle={{ padding: '10px 20px' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Card
                  title={t('pages.Home.index.systemInfo')}
                  headerExtraContent={
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--semi-color-text-1)',
                      }}
                    >
                      {t('pages.Home.index.systemInfoOverview')}
                    </span>
                  }
                >
                  <p>
                    {t('pages.Home.index.name')}
                    {statusState?.status?.system_name}
                  </p>
                  <p>
                    {t('pages.Home.index.version')}
                    {statusState?.status?.version
                      ? statusState?.status?.version
                      : 'unknown'}
                  </p>
                  <p>
                    {t('pages.Home.index.sourceCode')}
                    <a
                      href='https://github.com/songquanpeng/one-api'
                      target='_blank'
                      rel='noreferrer'
                    >
                      https://github.com/songquanpeng/one-api
                    </a>
                  </p>
                  <p>
                    {t('pages.Home.index.startTime')}
                    {getStartTimeString()}
                  </p>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  title={t('pages.Home.index.systemConfig')}
                  headerExtraContent={
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--semi-color-text-1)',
                      }}
                    >
                      {t('pages.Home.index.systemConfigOverview')}
                    </span>
                  }
                >
                  <p>
                    {t('pages.Home.index.emailVerification')}
                    {statusState?.status?.email_verification === true
                      ? t('pages.Home.index.enabled')
                      : t('pages.Home.index.disabled')}
                  </p>
                  <p>
                    {t('pages.Home.index.githubOAuth')}
                    {statusState?.status?.github_oauth === true
                      ? t('pages.Home.index.enabled')
                      : t('pages.Home.index.disabled')}
                  </p>
                  <p>
                    {t('pages.Home.index.wechatLogin')}
                    {statusState?.status?.wechat_login === true
                      ? t('pages.Home.index.enabled')
                      : t('pages.Home.index.disabled')}
                  </p>
                  <p>
                    {t('pages.Home.index.turnstileCheck')}
                    {statusState?.status?.turnstile_check === true
                      ? t('pages.Home.index.enabled')
                      : t('pages.Home.index.disabled')}
                  </p>
                  <p>
                    {t('pages.Home.index.telegramOAuth')}
                    {statusState?.status?.telegram_oauth === true
                      ? t('pages.Home.index.enabled')
                      : t('pages.Home.index.disabled')}
                  </p>
                </Card>
              </Col>
            </Row>
          </Card>
        </>
      ) : (
        <>
          {homePageContent.startsWith('https://') ? (
            <iframe
              src={homePageContent}
              style={{ width: '100%', height: '100vh', border: 'none' }}
            />
          ) : (
            <div
              style={{ fontSize: 'larger' }}
              dangerouslySetInnerHTML={{ __html: homePageContent }}
            ></div>
          )}
        </>
      )}
    </>
  );
};

export default Home;
