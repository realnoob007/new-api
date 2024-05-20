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

export default function SettingsMonitoring(props) {
  const showError = useShowError();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    ChannelDisableThreshold: '',
    QuotaRemindThreshold: '',
    AutomaticDisableChannelEnabled: false,
    AutomaticEnableChannelEnabled: false,
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow);
    if (!updateArray.length)
      return showWarning(
        t('pages.Setting.Operation.SettingsMonitoring.noChanges'),
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
              t(
                'pages.Setting.Operation.SettingsMonitoring.partialSaveFailure',
              ),
            );
        }
        showSuccess(
          t('pages.Setting.Operation.SettingsMonitoring.saveSuccess'),
        );
        props.refresh();
      })
      .catch(() => {
        showError(t('pages.Setting.Operation.SettingsMonitoring.saveFailure'));
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
            text={t(
              'pages.Setting.Operation.SettingsMonitoring.monitoringSettings',
            )}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.InputNumber
                  label={t(
                    'pages.Setting.Operation.SettingsMonitoring.channelDisableThreshold',
                  )}
                  step={1}
                  min={0}
                  suffix={t(
                    'pages.Setting.Operation.SettingsMonitoring.seconds',
                  )}
                  extraText={t(
                    'pages.Setting.Operation.SettingsMonitoring.channelDisableThresholdExtra',
                  )}
                  placeholder={''}
                  field={'ChannelDisableThreshold'}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      ChannelDisableThreshold: String(value),
                    })
                  }
                />
              </Col>
              <Col span={8}>
                <Form.InputNumber
                  label={t(
                    'pages.Setting.Operation.SettingsMonitoring.quotaRemindThreshold',
                  )}
                  step={1}
                  min={0}
                  suffix={'Token'}
                  extraText={t(
                    'pages.Setting.Operation.SettingsMonitoring.quotaRemindThresholdExtra',
                  )}
                  placeholder={''}
                  field={'QuotaRemindThreshold'}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      QuotaRemindThreshold: String(value),
                    })
                  }
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Switch
                  field={'AutomaticDisableChannelEnabled'}
                  label={t(
                    'pages.Setting.Operation.SettingsMonitoring.automaticDisableChannel',
                  )}
                  size='large'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) => {
                    setInputs({
                      ...inputs,
                      AutomaticDisableChannelEnabled: value,
                    });
                  }}
                />
              </Col>
              <Col span={8}>
                <Form.Switch
                  field={'AutomaticEnableChannelEnabled'}
                  label={t(
                    'pages.Setting.Operation.SettingsMonitoring.automaticEnableChannel',
                  )}
                  size='large'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      AutomaticEnableChannelEnabled: value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Button size='large' onClick={onSubmit}>
                {t(
                  'pages.Setting.Operation.SettingsMonitoring.saveMonitoringSettings',
                )}
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>
    </>
  );
}
