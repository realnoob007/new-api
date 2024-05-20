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

export default function SettingsDrawing(props) {
  const showError = useShowError();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    DrawingEnabled: false,
    MjNotifyEnabled: false,
    MjAccountFilterEnabled: false,
    MjForwardUrlEnabled: false,
    MjModeClearEnabled: false,
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow);
    if (!updateArray.length)
      return showWarning(
        t('pages.Setting.Operation.SettingsDrawing.noChanges'),
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
              t('pages.Setting.Operation.SettingsDrawing.partialSaveFailure'),
            );
        }
        showSuccess(t('pages.Setting.Operation.SettingsDrawing.saveSuccess'));
        props.refresh();
      })
      .catch(() => {
        showError(t('pages.Setting.Operation.SettingsDrawing.saveFailure'));
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
    localStorage.setItem('mj_notify_enabled', String(inputs.MjNotifyEnabled));
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
            text={t('pages.Setting.Operation.SettingsDrawing.drawingSettings')}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Switch
                  field={'DrawingEnabled'}
                  label={t(
                    'pages.Setting.Operation.SettingsDrawing.enableDrawingFeature',
                  )}
                  size='large'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) => {
                    setInputs({
                      ...inputs,
                      DrawingEnabled: value,
                    });
                  }}
                />
              </Col>
              <Col span={8}>
                <Form.Switch
                  field={'MjNotifyEnabled'}
                  label={t(
                    'pages.Setting.Operation.SettingsDrawing.allowCallback',
                  )}
                  size='large'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      MjNotifyEnabled: value,
                    })
                  }
                />
              </Col>
              <Col span={8}>
                <Form.Switch
                  field={'MjAccountFilterEnabled'}
                  label={t(
                    'pages.Setting.Operation.SettingsDrawing.allowAccountFilter',
                  )}
                  size='large'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      MjAccountFilterEnabled: value,
                    })
                  }
                />
              </Col>
              <Col span={8}>
                <Form.Switch
                  field={'MjForwardUrlEnabled'}
                  label={t(
                    'pages.Setting.Operation.SettingsDrawing.enableForwardUrl',
                  )}
                  size='large'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      MjForwardUrlEnabled: value,
                    })
                  }
                />
              </Col>
              <Col span={8}>
                <Form.Switch
                  field={'MjModeClearEnabled'}
                  label={
                    <>
                      {t(
                        'pages.Setting.Operation.SettingsDrawing.enableModeClear',
                      )}
                      <Tag>--fast</Tag>、<Tag>--relax</Tag>、<Tag>--turbo</Tag>
                      {t('pages.Setting.Operation.SettingsDrawing.parameters')}
                    </>
                  }
                  size='large'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      MjModeClearEnabled: value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Button size='large' onClick={onSubmit}>
                {t(
                  'pages.Setting.Operation.SettingsDrawing.saveDrawingSettings',
                )}
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>
    </>
  );
}
