import React, { useEffect, useState, useRef } from 'react';
import { Button, Col, Form, Row, Spin, Tag } from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  useShowError,
  showSuccess,
  showWarning,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function DataDashboard(props) {
  const showError = useShowError();
  const { t } = useTranslation();
  const optionsDataExportDefaultTime = [
    {
      key: 'hour',
      label: t('pages.Setting.Operation.SettingsDataDashboard.hour'),
      value: 'hour',
    },
    {
      key: 'day',
      label: t('pages.Setting.Operation.SettingsDataDashboard.day'),
      value: 'day',
    },
    {
      key: 'week',
      label: t('pages.Setting.Operation.SettingsDataDashboard.week'),
      value: 'week',
    },
  ];
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    DataExportEnabled: false,
    DataExportInterval: '',
    DataExportDefaultTime: '',
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow);
    if (!updateArray.length)
      return showWarning(
        t('pages.Setting.Operation.SettingsDataDashboard.noChanges'),
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
                'pages.Setting.Operation.SettingsDataDashboard.partialSaveFailure',
              ),
            );
        }
        showSuccess(
          t('pages.Setting.Operation.SettingsDataDashboard.saveSuccess'),
        );
        props.refresh();
      })
      .catch(() => {
        showError(
          t('pages.Setting.Operation.SettingsDataDashboard.saveFailure'),
        );
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
    localStorage.setItem(
      'data_export_default_time',
      String(inputs.DataExportDefaultTime),
    );
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
              'pages.Setting.Operation.SettingsDataDashboard.dataDashboardSettings',
            )}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Switch
                  field={'DataExportEnabled'}
                  label={t(
                    'pages.Setting.Operation.SettingsDataDashboard.enableDataDashboard',
                  )}
                  size='large'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) => {
                    setInputs({
                      ...inputs,
                      DataExportEnabled: value,
                    });
                  }}
                />
              </Col>
            </Row>
            <Row>
              <Col span={8}>
                <Form.InputNumber
                  label={t(
                    'pages.Setting.Operation.SettingsDataDashboard.dataDashboardUpdateInterval',
                  )}
                  step={1}
                  min={1}
                  suffix={t(
                    'pages.Setting.Operation.SettingsDataDashboard.minutes',
                  )}
                  extraText={t(
                    'pages.Setting.Operation.SettingsDataDashboard.extraText',
                  )}
                  placeholder={t(
                    'pages.Setting.Operation.SettingsDataDashboard.dataDashboardUpdateIntervalPlaceholder',
                  )}
                  field={'DataExportInterval'}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      DataExportInterval: String(value),
                    })
                  }
                />
              </Col>
              <Col span={8}>
                <Form.Select
                  label={t(
                    'pages.Setting.Operation.SettingsDataDashboard.dataDashboardDefaultTimeGranularity',
                  )}
                  optionList={optionsDataExportDefaultTime}
                  field={'DataExportDefaultTime'}
                  extraText={t(
                    'pages.Setting.Operation.SettingsDataDashboard.granularityExtraText',
                  )}
                  placeholder={t(
                    'pages.Setting.Operation.SettingsDataDashboard.dataDashboardDefaultTimeGranularityPlaceholder',
                  )}
                  style={{ width: 180 }}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      DataExportDefaultTime: String(value),
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Button size='large' onClick={onSubmit}>
                {t(
                  'pages.Setting.Operation.SettingsDataDashboard.saveDataDashboardSettings',
                )}
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>
    </>
  );
}
