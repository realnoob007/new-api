import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/User';
import { useSetTheme, useTheme } from '../context/Theme';

import { API, getLogo, getSystemName, showSuccess } from '../helpers';
import '../index.css';

import fireworks from 'react-fireworks';

import { IconHelpCircle, IconKey, IconUser } from '@douyinfe/semi-icons';
import {
  Avatar,
  Dropdown,
  Layout,
  Nav,
  Switch,
  Select,
} from '@douyinfe/semi-ui';
import { stringToColor } from '../helpers/render';
import { useTranslation } from 'react-i18next';

// HeaderBar Buttons
let headerButtons = [
  {
    text: '关于',
    itemKey: 'about',
    to: '/about',
    icon: <IconHelpCircle />,
  },
];

if (localStorage.getItem('chat_link')) {
  headerButtons.splice(1, 0, {
    name: '聊天',
    to: '/chat',
    icon: 'comments',
  });
}

const HeaderBar = () => {
  const { t, i18n } = useTranslation();
  const [userState, userDispatch] = useContext(UserContext);
  let navigate = useNavigate();

  const [showSidebar, setShowSidebar] = useState(false);
  const systemName = getSystemName();
  const logo = getLogo();
  const currentDate = new Date();
  // enable fireworks on new year(1.1 and 2.9-2.24)
  const isNewYear =
    (currentDate.getMonth() === 0 && currentDate.getDate() === 1) ||
    (currentDate.getMonth() === 1 &&
      currentDate.getDate() >= 9 &&
      currentDate.getDate() <= 24);

  async function logout() {
    setShowSidebar(false);
    await API.get('/api/user/logout');
    showSuccess(t('components.HeaderBar.success.logout'));
    userDispatch({ type: 'logout' });
    localStorage.removeItem('user');
    navigate('/login');
  }

  const handleNewYearClick = () => {
    fireworks.init('root', {});
    fireworks.start();
    setTimeout(() => {
      fireworks.stop();
      setTimeout(() => {
        window.location.reload();
      }, 10000);
    }, 3000);
  };

  const theme = useTheme();
  const setTheme = useSetTheme();

  useEffect(() => {
    if (theme === 'dark') {
      document.body.setAttribute('theme-mode', 'dark');
    }

    if (isNewYear) {
      console.log('Happy New Year!');
    }
  }, []);

  return (
    <>
      <Layout>
        <div style={{ width: '100%' }}>
          <Nav
            mode={'horizontal'}
            // bodyStyle={{ height: 100 }}
            renderWrapper={({ itemElement, isSubNav, isInSubNav, props }) => {
              const routerMap = {
                about: '/about',
                login: '/login',
                register: '/register',
              };
              return (
                <Link
                  style={{ textDecoration: 'none' }}
                  to={routerMap[props.itemKey]}
                >
                  {itemElement}
                </Link>
              );
            }}
            selectedKeys={[]}
            onSelect={(key) => {}}
            footer={
              <>
                {isNewYear && (
                  // happy new year
                  <Dropdown
                    position='bottomRight'
                    render={
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={handleNewYearClick}>
                          {t('components.HeaderBar.happyNewYear')}
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    }
                  >
                    <Nav.Item itemKey={'new-year'} text={'🏮'} />
                  </Dropdown>
                )}
                <Select
                  defaultValue={i18n.language}
                  style={{ width: 120 }}
                  onChange={i18n.changeLanguage}
                >
                  <Select.Option value='en'>English</Select.Option>
                  <Select.Option value='zh'>中文</Select.Option>
                </Select>
                <Nav.Item itemKey={'about'} icon={<IconHelpCircle />} />
                <Switch
                  checkedText='🌞'
                  size={'large'}
                  checked={theme === 'dark'}
                  uncheckedText='🌙'
                  onChange={(checked) => {
                    setTheme(checked);
                  }}
                />
                {userState.user ? (
                  <>
                    <Dropdown
                      position='bottomRight'
                      render={
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={logout}>
                            {t('components.HeaderBar.buttons.logout')}
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      }
                    >
                      <Avatar
                        size='small'
                        color={stringToColor(userState.user.username)}
                        style={{ margin: 4 }}
                      >
                        {userState.user.username[0]}
                      </Avatar>
                      <span>{userState.user.username}</span>
                    </Dropdown>
                  </>
                ) : (
                  <>
                    <Nav.Item
                      itemKey={'login'}
                      text={t('components.HeaderBar.buttons.login')}
                      icon={<IconKey />}
                    />
                    <Nav.Item
                      itemKey={'register'}
                      text={t('components.HeaderBar.buttons.register')}
                      icon={<IconUser />}
                    />
                  </>
                )}
              </>
            }
          ></Nav>
        </div>
      </Layout>
    </>
  );
};

export default HeaderBar;
