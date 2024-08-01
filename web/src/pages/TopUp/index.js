import React, { useEffect, useState } from 'react';
import {
  API,
  isMobile,
  useShowError,
  showInfo,
  showSuccess,
} from '../../helpers';
import {
  renderNumber,
  renderQuota,
  renderQuotaWithAmount,
} from '../../helpers/render';
import {
  Col,
  Layout,
  Row,
  Typography,
  Card,
  Button,
  Form,
  Divider,
  Space,
  Modal,
  Toast,
} from '@douyinfe/semi-ui';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import Text from '@douyinfe/semi-ui/lib/es/typography/text';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const TopUp = () => {
  const showError = useShowError();
  const { t } = useTranslation();
  const [redemptionCode, setRedemptionCode] = useState('');
  const [topUpCode, setTopUpCode] = useState('');
  const [topUpCount, setTopUpCount] = useState(0);
  const [minTopupCount, setMinTopUpCount] = useState(1);
  const [amount, setAmount] = useState(0.0);
  const [minTopUp, setMinTopUp] = useState(1);
  const [topUpLink, setTopUpLink] = useState('');
  const [enableOnlineTopUp, setEnableOnlineTopUp] = useState(false);
  const [userQuota, setUserQuota] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [payWay, setPayWay] = useState('');

  const topUp = async () => {
    if (redemptionCode === '') {
      showInfo(t('pages.TopUp.index.enterRedemptionCode'));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await API.post('/api/user/topup', {
        key: redemptionCode,
      });
      const { success, message, data } = res.data;
      if (success) {
        showSuccess(t('pages.TopUp.index.redemptionSuccess'));
        Modal.success({
          title: t('pages.TopUp.index.redemptionSuccess'),
          content: t('pages.TopUp.index.successQuota', {
            quota: renderQuota(data),
          }),
          centered: true,
        });
        setUserQuota((quota) => {
          return quota + data;
        });
        setRedemptionCode('');
      } else {
        showError(message);
      }
    } catch (err) {
      showError(t('pages.TopUp.index.requestFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTopUpLink = () => {
    if (!topUpLink) {
      showError(t('pages.TopUp.index.noTopUpLink'));
      return;
    }
    window.open(topUpLink, '_blank');
  };

  const preTopUp = async (payment) => {
    if (!enableOnlineTopUp) {
      showError(t('pages.TopUp.index.onlineTopUpDisabled'));
      return;
    }
    await getAmount();
    if (topUpCount < minTopUp) {
      showError(t('pages.TopUp.index.minTopUpError', { minTopUp }));
      return;
    }
    setPayWay(payment);
    setOpen(true);
  };

  const onlineTopUp = async () => {
    if (amount === 0) {
      await getAmount();
    }
    if (topUpCount < minTopUp) {
      showError(t('pages.TopUp.index.minTopUpError', { minTopUp }));
      return;
    }
    setOpen(false);
    try {
      const res = await API.post('/api/user/pay', {
        amount: parseInt(topUpCount),
        top_up_code: topUpCode,
        payment_method: payWay,
      });
      if (res !== undefined) {
        const { message, data } = res.data;
        if (message === 'success') {
          let params = data;
          let url = res.data.url;
          let form = document.createElement('form');
          form.action = url;
          form.method = 'POST';
          let isSafari =
            navigator.userAgent.indexOf('Safari') > -1 &&
            navigator.userAgent.indexOf('Chrome') < 1;
          if (!isSafari) {
            form.target = '_blank';
          }
          for (let key in params) {
            let input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = params[key];
            form.appendChild(input);
          }
          document.body.appendChild(form);
          form.submit();
          document.body.removeChild(form);
        } else {
          showError(data);
        }
      } else {
        showError(res);
      }
    } catch (err) {
      console.log(err);
    } finally {
    }
  };

  const getUserQuota = async () => {
    let res = await API.get(`/api/user/self`);
    const { success, message, data } = res.data;
    if (success) {
      setUserQuota(data.quota);
    } else {
      showError(message);
    }
  };

  useEffect(() => {
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      if (status.top_up_link) {
        setTopUpLink(status.top_up_link);
      }
      if (status.min_topup) {
        setMinTopUp(status.min_topup);
      }
      if (status.enable_online_topup) {
        setEnableOnlineTopUp(status.enable_online_topup);
      }
    }
    getUserQuota().then();
  }, []);

  const renderAmount = () => {
    return amount + t(' dollars');
  };

  const getAmount = async (value) => {
    if (value === undefined) {
      value = topUpCount;
    }
    try {
      const res = await API.post('/api/user/amount', {
        amount: parseFloat(value),
        top_up_code: topUpCode,
      });
      if (res !== undefined) {
        const { message, data } = res.data;
        if (message === 'success') {
          setAmount(parseFloat(data));
        } else {
          setAmount(0);
          Toast.error({
            content: t('pages.TopUp.index.error', { data }),
            id: 'getAmount',
          });
        }
      } else {
        showError(res);
      }
    } catch (err) {
      console.log(err);
    } finally {
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <div>
      <Layout>
        <Layout.Header>
          <h3>{t('pages.TopUp.index.myWallet')}</h3>
        </Layout.Header>
        <Layout.Content>
          <Modal
            title={t('pages.TopUp.index.confirmTopUp')}
            visible={open}
            onOk={onlineTopUp}
            onCancel={handleCancel}
            maskClosable={false}
            size={'small'}
            centered={true}
          >
            <p>{t('pages.TopUp.index.topUpCount', { topUpCount })}</p>
            <p>
              {t('pages.TopUp.index.actualPayment', {
                renderAmount: renderAmount(),
              })}
            </p>
            <p>{t('pages.TopUp.index.confirmTopUpQuestion')}</p>
          </Modal>
          <div
            style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}
          >
            <Card style={{ width: '500px', padding: '20px' }}>
              <Title level={3} style={{ textAlign: 'center' }}>
                {t('pages.TopUp.index.balance')} {renderQuota(userQuota)}
              </Title>
              <div style={{ marginTop: 20 }}>
                <Divider>{t('pages.TopUp.index.redeemBalance')}</Divider>
                <Form>
                  <Form.Input
                    field={'redemptionCode'}
                    label={t('pages.TopUp.index.redemptionCode')}
                    placeholder={t('pages.TopUp.index.redemptionCode')}
                    name='redemptionCode'
                    value={redemptionCode}
                    onChange={(value) => {
                      setRedemptionCode(value);
                    }}
                  />
                  <Space>
                    {topUpLink ? (
                      <Button
                        type={'primary'}
                        theme={'solid'}
                        onClick={openTopUpLink}
                      >
                        {t('pages.TopUp.index.getRedemptionCode')}
                      </Button>
                    ) : null}
                    <Button
                      type={'warning'}
                      theme={'solid'}
                      onClick={topUp}
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? t('pages.TopUp.index.redeeming')
                        : t('pages.TopUp.index.redeem')}
                    </Button>
                  </Space>
                </Form>
              </div>
              <div style={{ marginTop: 20 }}>
                <Divider>{t('pages.TopUp.index.onlineTopUp')}</Divider>
                <Form>
                  <Form.Input
                    disabled={!enableOnlineTopUp}
                    field={'redemptionCount'}
                    label={t('pages.TopUp.index.actualPayment', {
                      renderAmount: renderAmount(),
                    })}
                    placeholder={t('pages.TopUp.index.topUpCountPlaceholder', {
                      minTopUp: renderQuotaWithAmount(minTopUp),
                    })}
                    name='redemptionCount'
                    type={'number'}
                    value={topUpCount}
                    onChange={async (value) => {
                      if (value < 1) {
                        value = 1;
                      }
                      setTopUpCount(value);
                      await getAmount(value);
                    }}
                  />
                  <Space>
                    <Button
                      style={{
                        backgroundColor: 'rgba(var(--semi-purple-5), 1)',
                      }}
                      type={'primary'}
                      theme={'solid'}
                      onClick={async () => {
                        preTopUp('stripe');
                      }}
                    >
                      {t('pages.TopUp.index.alipay')}
                    </Button>
                    <Button
                      style={{
                        backgroundColor: 'rgba(var(--semi-yellow-5), 1)',
                      }}
                      type={'primary'}
                      theme={'solid'}
                      onClick={async () => {
                        preTopUp('paypal');
                      }}
                    >
                      {t('pages.TopUp.index.alipay')}
                    </Button>
                    <Button
                      type={'primary'}
                      theme={'solid'}
                      onClick={async () => {
                        preTopUp('zfb');
                      }}
                    >
                      {t('pages.TopUp.index.alipay')}
                    </Button>
                    <Button
                      style={{
                        backgroundColor: 'rgba(var(--semi-green-5), 1)',
                      }}
                      type={'primary'}
                      theme={'solid'}
                      onClick={async () => {
                        preTopUp('wx');
                      }}
                    >
                      {t('pages.TopUp.index.wechat')}
                    </Button>
                  </Space>
                </Form>
              </div>
            </Card>
          </div>
        </Layout.Content>
      </Layout>
    </div>
  );
};

export default TopUp;
