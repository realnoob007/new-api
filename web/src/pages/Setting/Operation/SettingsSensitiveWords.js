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

export default function SettingsSensitiveWords(props) {
  const showError = useShowError();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    CheckSensitiveEnabled: false,
    CheckSensitiveOnPromptEnabled: false,
    SensitiveWords: '',
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow);
    if (!updateArray.length)
      return showWarning(
        t('pages.Setting.Operation.SettingsSensitiveWords.noChanges'),
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
                'pages.Setting.Operation.SettingsSensitiveWords.partialSaveFailure',
              ),
            );
        }
        showSuccess(
          t('pages.Setting.Operation.SettingsSensitiveWords.saveSuccess'),
        );
        props.refresh();
      })
      .catch(() => {
        showError(
          t('pages.Setting.Operation.SettingsSensitiveWords.saveFailure'),
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
              'pages.Setting.Operation.SettingsSensitiveWords.sensitiveWordFilterSettings',
            )}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Switch
                  field={'CheckSensitiveEnabled'}
                  label={t(
                    'pages.Setting.Operation.SettingsSensitiveWords.enableSensitiveWordFilter',
                  )}
                  size='large'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) => {
                    setInputs({
                      ...inputs,
                      CheckSensitiveEnabled: value,
                    });
                  }}
                />
              </Col>
              <Col span={8}>
                <Form.Switch
                  field={'CheckSensitiveOnPromptEnabled'}
                  label={t(
                    'pages.Setting.Operation.SettingsSensitiveWords.enablePromptCheck',
                  )}
                  size='large'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      CheckSensitiveOnPromptEnabled: value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col span={16}>
                <Form.TextArea
                  label={t(
                    'pages.Setting.Operation.SettingsSensitiveWords.sensitiveWordList',
                  )}
                  extraText={t(
                    'pages.Setting.Operation.SettingsSensitiveWords.sensitiveWordListExtra',
                  )}
                  placeholder={t(
                    'pages.Setting.Operation.SettingsSensitiveWords.sensitiveWordListPlaceholder',
                  )}
                  field={'SensitiveWords'}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      SensitiveWords: value,
                    })
                  }
                  style={{ fontFamily: 'JetBrains Mono, Consolas' }}
                  autosize={{ minRows: 6, maxRows: 12 }}
                />
              </Col>
            </Row>
            <Row>
              <Button size='large' onClick={onSubmit}>
                {t(
                  'pages.Setting.Operation.SettingsSensitiveWords.saveSensitiveWordFilterSettings',
                )}
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>
    </>
  );
}
