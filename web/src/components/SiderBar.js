import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/User';
import { StatusContext } from '../context/Status';

import {
  API,
  getLogo,
  getSystemName,
  isAdmin,
  isMobile,
  useShowError,
} from '../helpers';
import '../index.css';

import {
  IconCalendarClock,
  IconComment,
  IconCreditCard,
  IconGift,
  IconHistogram,
  IconHome,
  IconImage,
  IconKey,
  IconLayers,
  IconPriceTag,
  IconSetting,
  IconUser,
} from '@douyinfe/semi-icons';
import { Layout, Nav } from '@douyinfe/semi-ui';
import { setStatusData } from '../helpers/data.js';
import { useTranslation } from 'react-i18next';

const SiderBar = () => {
  const showError = useShowError();
  const { t, i18n } = useTranslation();
  const [userState, userDispatch] = useContext(UserContext);
  const [statusState, statusDispatch] = useContext(StatusContext);
  const defaultIsCollapsed =
    isMobile() || localStorage.getItem('default_collapse_sidebar') === 'true';

  let navigate = useNavigate();
  const [selectedKeys, setSelectedKeys] = useState(['home']);
  const systemName = getSystemName();
  const logo = getLogo();
  const [isCollapsed, setIsCollapsed] = useState(defaultIsCollapsed);

  const routerMap = {
    home: '/home',
    channel: '/channel',
    token: '/token',
    redemption: '/redemption',
    topup: '/topup',
    user: '/user',
    log: '/log',
    midjourney: '/midjourney',
    setting: '/setting',
    about: '/about',
    chat: '/chat',
    detail: '/detail',
    pricing: '/pricing',
  };

  const headerButtons = useMemo(
    () => [
      {
        text: t('components.SiderBar.home'),
        itemKey: 'home',
        to: '/home',
        icon: <IconHome />,
      },
      {
        text: t('components.SiderBar.channel'),
        itemKey: 'channel',
        to: '/channel',
        icon: <IconLayers />,
        className: isAdmin() ? 'semi-navigation-item-normal' : 'tableHiddle',
      },
      {
        text: t('components.SiderBar.chat'),
        itemKey: 'chat',
        to: '/chat',
        icon: <IconComment />,
        className: localStorage.getItem('chat_link')
          ? 'semi-navigation-item-normal'
          : 'tableHiddle',
      },
      {
        text: t('components.SiderBar.token'),
        itemKey: 'token',
        to: '/token',
        icon: <IconKey />,
      },
      {
        text: t('components.SiderBar.redemption'),
        itemKey: 'redemption',
        to: '/redemption',
        icon: <IconGift />,
        className: isAdmin() ? 'semi-navigation-item-normal' : 'tableHiddle',
      },
      {
        text: t('components.SiderBar.wallet'),
        itemKey: 'topup',
        to: '/topup',
        icon: <IconCreditCard />,
      },
      {
        text: t('components.SiderBar.pricing'),
        itemKey: 'pricing',
        to: '/pricing',
        icon: <IconPriceTag />,
      },
      {
        text: t('components.SiderBar.userManagement'),
        itemKey: 'user',
        to: '/user',
        icon: <IconUser />,
        className: isAdmin() ? 'semi-navigation-item-normal' : 'tableHiddle',
      },
      {
        text: t('components.SiderBar.log'),
        itemKey: 'log',
        to: '/log',
        icon: <IconHistogram />,
      },
      {
        text: t('components.SiderBar.dashboard'),
        itemKey: 'detail',
        to: '/detail',
        icon: <IconCalendarClock />,
        className:
          localStorage.getItem('enable_data_export') === 'true'
            ? 'semi-navigation-item-normal'
            : 'tableHiddle',
      },
      {
        text: t('components.SiderBar.drawing'),
        itemKey: 'midjourney',
        to: '/midjourney',
        icon: <IconImage />,
        className:
          localStorage.getItem('enable_drawing') === 'true'
            ? 'semi-navigation-item-normal'
            : 'tableHiddle',
      },
      {
        text: t('components.SiderBar.settings'),
        itemKey: 'setting',
        to: '/setting',
        icon: <IconSetting />,
      },
    ],
    [
      i18n.language,
      localStorage.getItem('enable_data_export'),
      localStorage.getItem('enable_drawing'),
      localStorage.getItem('chat_link'),
      isAdmin(),
    ],
  );

  const loadStatus = async () => {
    const res = await API.get('/api/status');
    if (res === undefined) {
      return;
    }
    const { success, data } = res.data;
    if (success) {
      statusDispatch({ type: 'set', payload: data });
      setStatusData(data);
    } else {
      showError(t('components.SiderBar.serverError'));
    }
  };

  useEffect(() => {
    loadStatus().then(() => {
      setIsCollapsed(
        isMobile() ||
          localStorage.getItem('default_collapse_sidebar') === 'true',
      );
    });
    let localKey = window.location.pathname.split('/')[1];
    if (localKey === '') {
      localKey = 'home';
    }
    setSelectedKeys([localKey]);
  }, []);

  return (
    <>
      <Layout>
        <div style={{ height: '100%' }}>
          <Nav
            style={{ maxWidth: 200 }}
            defaultIsCollapsed={
              isMobile() ||
              localStorage.getItem('default_collapse_sidebar') === 'true'
            }
            isCollapsed={isCollapsed}
            onCollapseChange={(collapsed) => {
              setIsCollapsed(collapsed);
            }}
            selectedKeys={selectedKeys}
            renderWrapper={({ itemElement, isSubNav, isInSubNav, props }) => {
              return (
                <Link
                  style={{ textDecoration: 'none' }}
                  to={routerMap[props.itemKey]}
                >
                  {itemElement}
                </Link>
              );
            }}
            items={headerButtons}
            onSelect={(key) => {
              setSelectedKeys([key.itemKey]);
            }}
            header={{
              logo: (
                <img src={logo} alt='logo' style={{ marginRight: '0.75em' }} />
              ),
              text: systemName,
            }}
          >
            <Nav.Footer
              collapseButton={true}
              collapseText={(val) =>
                val
                  ? t('components.SiderBar.collapse')
                  : t('components.SiderBar.collapsed')
              }
            ></Nav.Footer>
          </Nav>
        </div>
      </Layout>
    </>
  );
};

export default SiderBar;
