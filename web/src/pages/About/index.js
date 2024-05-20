import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API, useShowError } from '../../helpers';
import { marked } from 'marked';
import { Layout } from '@douyinfe/semi-ui';

const About = () => {
  const showError = useShowError();
  const { t } = useTranslation();
  const [about, setAbout] = useState('');
  const [aboutLoaded, setAboutLoaded] = useState(false);

  const displayAbout = async () => {
    setAbout(localStorage.getItem('about') || '');
    const res = await API.get('/api/about');
    const { success, message, data } = res.data;
    if (success) {
      let aboutContent = data;
      if (!data.startsWith('https://')) {
        aboutContent = marked.parse(data);
      }
      setAbout(aboutContent);
      localStorage.setItem('about', aboutContent);
    } else {
      showError(message);
      setAbout(t('pages.About.loadError'));
    }
    setAboutLoaded(true);
  };

  useEffect(() => {
    displayAbout().then();
  }, []);

  return (
    <>
      {aboutLoaded && about === '' ? (
        <>
          <Layout>
            <Layout.Header>
              <h3>{t('pages.About.title')}</h3>
            </Layout.Header>
            <Layout.Content>
              <p>{t('pages.About.description')}</p>
              {t('pages.About.repository')}：
              <a href='https://github.com/Calcium-Ion/new-api'>
                https://github.com/Calcium-Ion/new-api
              </a>
              <p>{t('pages.About.footer')}</p>
            </Layout.Content>
          </Layout>
        </>
      ) : (
        <>
          {about.startsWith('https://') ? (
            <iframe
              src={about}
              style={{ width: '100%', height: '100vh', border: 'none' }}
            />
          ) : (
            <div
              style={{ fontSize: 'larger' }}
              dangerouslySetInnerHTML={{ __html: about }}
            ></div>
          )}
        </>
      )}
    </>
  );
};

export default About;
