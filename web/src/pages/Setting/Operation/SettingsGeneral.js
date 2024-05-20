import React, { useEffect, useState, useRef } from 'react';
import { Button, Col, Form, Row, Spin } from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  useShowError,
  showSuccess,
  showWarning,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function GeneralSettings(props) {
  const showError = useShowError();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    TopUpLink: '',
    ChatLink: '',
    ChatLink2: '',
    QuotaPerUnit: '',
    RetryTimes: '',
    DisplayInCurrencyEnabled: false,
    DisplayTokenStatEnabled: false,
    DefaultCollapseSidebar: false,
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  function onChange(value, e) {
    const name = e.target.id;
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  }

  function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow);
    if (!updateArray.length)
      return showWarning(
        t('pages.Setting.Operation.SettingsGeneral.noChanges'),
      );
    const requestQueue = updateArray.map((item) => {
      let value = '';
      if (typeof inputs[item.key] === 'boolean') {
        value = String(inputs[item.key]);
      } else {
        value = inputs[item.key];
      }
      return API.put('/api/option/', {
        key: item.key,
        value,
      });
    });
    setLoading(true);
    Promise.all(requestQueue)
      .then((res) => {
        if (requestQueue.length === 1) {
          if (res.includes(undefined)) return;
        } else if (requestQueue.length > 1) {
          if (res.includes(undefined))
            return showError(
              t('pages.Setting.Operation.SettingsGeneral.partialSaveFailure'),
            );
        }
        showSuccess(t('pages.Setting.Operation.SettingsGeneral.saveSuccess'));
        props.refresh();
      })
      .catch(() => {
        showError(t('pages.Setting.Operation.SettingsGeneral.saveFailure'));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    const currentInputs = {};
    for (let key in props.options) {
      if (Object.keys(inputs).includes(key)) {
        currentInputs[key] = props.options[key];
      }
    }
    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    refForm.current.setValues(currentInputs);
  }, [props.options]);
  return (
    <>
      <Spin spinning={loading}>
        <Form
          values={inputs}
          getFormApi={(formAPI) => (refForm.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section
            text={t('pages.Setting.Operation.SettingsGeneral.generalSettings')}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Input
                  field={'TopUpLink'}
                  label={t('pages.Setting.Operation.SettingsGeneral.topUpLink')}
                  initValue={''}
                  placeholder={t(
                    'pages.Setting.Operation.SettingsGeneral.topUpLinkPlaceholder',
                  )}
                  onChange={onChange}
                  showClear
                />
              </Col>
              <Col span={8}>
                <Form.Input
                  field={'ChatLink'}
                  label={t(
                    'pages.Setting.Operation.SettingsGeneral.defaultChatLink',
                  )}
                  initValue={''}
                  placeholder={t(
                    'pages.Setting.Operation.SettingsGeneral.defaultChatLinkPlaceholder',
                  )}
                  onChange={onChange}
                  showClear
                />
              </Col>
              <Col span={8}>
                <Form.Input
                  field={'ChatLink2'}
                  label={t('pages.Setting.Operation.SettingsGeneral.chatLink2')}
                  initValue={''}
                  placeholder={t(
                    'pages.Setting.Operation.SettingsGeneral.chatLink2Placeholder',
                  )}
                  onChange={onChange}
                  showClear
                />
              </Col>
              <Col span={8}>
                <Form.Input
                  field={'QuotaPerUnit'}
                  label={t(
                    'pages.Setting.Operation.SettingsGeneral.quotaPerUnit',
                  )}
                  initValue={''}
                  placeholder={t(
                    'pages.Setting.Operation.SettingsGeneral.quotaPerUnitPlaceholder',
                  )}
                  onChange={onChange}
                  showClear
                />
              </Col>
              <Col span={8}>
                <Form.Input
                  field={'RetryTimes'}
                  label={t(
                    'pages.Setting.Operation.SettingsGeneral.retryTimes',
                  )}
                  initValue={''}
                  placeholder={t(
                    'pages.Setting.Operation.SettingsGeneral.retryTimesPlaceholder',
                  )}
                  onChange={onChange}
                  showClear
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Switch
                  field={'DisplayInCurrencyEnabled'}
                  label={t(
                    'pages.Setting.Operation.SettingsGeneral.displayInCurrency',
                  )}
                  size='large'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) => {
                    setInputs({
                      ...inputs,
                      DisplayInCurrencyEnabled: value,
                    });
                  }}
                />
              </Col>
              <Col span={8}>
                <Form.Switch
                  field={'DisplayTokenStatEnabled'}
                  label={t(
                    'pages.Setting.Operation.SettingsGeneral.displayTokenStat',
                  )}
                  size='large'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      DisplayTokenStatEnabled: value,
                    })
                  }
                />
              </Col>
              <Col span={8}>
                <Form.Switch
                  field={'DefaultCollapseSidebar'}
                  label={t(
                    'pages.Setting.Operation.SettingsGeneral.defaultCollapseSidebar',
                  )}
                  size='large'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      DefaultCollapseSidebar: value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Button size='large' onClick={onSubmit}>
                {t(
                  'pages.Setting.Operation.SettingsGeneral.saveGeneralSettings',
                )}
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>
    </>
  );
}
