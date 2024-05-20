import React, { useEffect, useState, useRef } from 'react';
import { Button, Col, Form, Row, Spin, DatePicker } from '@douyinfe/semi-ui';
import dayjs from 'dayjs';
import {
  compareObjects,
  API,
  useShowError,
  showSuccess,
  showWarning,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function SettingsLog(props) {
  const showError = useShowError();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [loadingCleanHistoryLog, setLoadingCleanHistoryLog] = useState(false);
  const [inputs, setInputs] = useState({
    LogConsumeEnabled: false,
    historyTimestamp: dayjs().subtract(1, 'month').toDate(),
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow).filter(
      (item) => item.key !== 'historyTimestamp',
    );

    if (!updateArray.length)
      return showWarning(t('pages.Setting.Operation.SettingsLog.noChanges'));
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
              t('pages.Setting.Operation.SettingsLog.partialSaveFailure'),
            );
        }
        showSuccess(t('pages.Setting.Operation.SettingsLog.saveSuccess'));
        props.refresh();
      })
      .catch(() => {
        showError(t('pages.Setting.Operation.SettingsLog.saveFailure'));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  async function onCleanHistoryLog() {
    try {
      setLoadingCleanHistoryLog(true);
      if (!inputs.historyTimestamp)
        throw new Error(t('pages.Setting.Operation.SettingsLog.selectLogTime'));
      const res = await API.delete(
        `/api/log/?target_timestamp=${Date.parse(inputs.historyTimestamp) / 1000}`,
      );
      const { success, message, data } = res.data;
      if (success) {
        showSuccess(
          t('pages.Setting.Operation.SettingsLog.logCleaned', { count: data }),
        );
        return;
      } else {
        throw new Error(
          t('pages.Setting.Operation.SettingsLog.logCleanFailed') + message,
        );
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setLoadingCleanHistoryLog(false);
    }
  }

  useEffect(() => {
    const currentInputs = {};
    for (let key in props.options) {
      if (Object.keys(inputs).includes(key)) {
        currentInputs[key] = props.options[key];
      }
    }
    currentInputs['historyTimestamp'] = inputs.historyTimestamp;
    setInputs(Object.assign(inputs, currentInputs));
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
            text={t('pages.Setting.Operation.SettingsLog.logSettings')}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Switch
                  field={'LogConsumeEnabled'}
                  label={t('pages.Setting.Operation.SettingsLog.enableLog')}
                  size='large'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) => {
                    setInputs({
                      ...inputs,
                      LogConsumeEnabled: value,
                    });
                  }}
                />
              </Col>
              <Col span={8}>
                <Spin spinning={loadingCleanHistoryLog}>
                  <Form.DatePicker
                    label={t('pages.Setting.Operation.SettingsLog.logTime')}
                    field={'historyTimestamp'}
                    type='dateTime'
                    inputReadOnly={true}
                    onChange={(value) => {
                      setInputs({
                        ...inputs,
                        historyTimestamp: value,
                      });
                    }}
                  />
                  <Button size='default' onClick={onCleanHistoryLog}>
                    {t('pages.Setting.Operation.SettingsLog.cleanHistoryLog')}
                  </Button>
                </Spin>
              </Col>
            </Row>

            <Row>
              <Button size='large' onClick={onSubmit}>
                {t('pages.Setting.Operation.SettingsLog.saveLogSettings')}
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>
    </>
  );
}
