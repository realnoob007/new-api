import React, { useEffect, useState, useRef } from 'react';
import { Button, Col, Form, Row, Spin } from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  useShowError,
  showSuccess,
  showWarning,
  verifyJSON,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function SettingsMagnification(props) {
  const showError = useShowError();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    ModelPrice: '',
    ModelRatio: '',
    CompletionRatio: '',
    GroupRatio: '',
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  async function onSubmit() {
    try {
      await refForm.current.validate();
      const updateArray = compareObjects(inputs, inputsRow);
      if (!updateArray.length)
        return showWarning(
          t('pages.Setting.Operation.SettingsMagnification.noChanges'),
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
                  'pages.Setting.Operation.SettingsMagnification.partialSaveFailure',
                ),
              );
          }
          showSuccess(
            t('pages.Setting.Operation.SettingsMagnification.saveSuccess'),
          );
          props.refresh();
        })
        .catch(() => {
          showError(
            t('pages.Setting.Operation.SettingsMagnification.saveFailure'),
          );
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (error) {
      showError(t('pages.Setting.Operation.SettingsMagnification.checkInput'));
      console.error(error);
    } finally {
    }
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
              'pages.Setting.Operation.SettingsMagnification.magnificationSettings',
            )}
          >
            <Row gutter={16}>
              <Col span={16}>
                <Form.TextArea
                  label={t(
                    'pages.Setting.Operation.SettingsMagnification.modelPrice',
                  )}
                  extraText={t(
                    'pages.Setting.Operation.SettingsMagnification.modelPriceExtra',
                  )}
                  placeholder={t(
                    'pages.Setting.Operation.SettingsMagnification.modelPricePlaceholder',
                  )}
                  field={'ModelPrice'}
                  autosize={{ minRows: 6, maxRows: 12 }}
                  trigger='blur'
                  rules={[
                    {
                      validator: (rule, value) => verifyJSON(value),
                      message: t(
                        'pages.Setting.Operation.SettingsMagnification.invalidJSON',
                      ),
                    },
                  ]}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      ModelPrice: value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={16}>
                <Form.TextArea
                  label={t(
                    'pages.Setting.Operation.SettingsMagnification.modelRatio',
                  )}
                  extraText={''}
                  placeholder={t(
                    'pages.Setting.Operation.SettingsMagnification.modelRatioPlaceholder',
                  )}
                  field={'ModelRatio'}
                  autosize={{ minRows: 6, maxRows: 12 }}
                  trigger='blur'
                  rules={[
                    {
                      validator: (rule, value) => verifyJSON(value),
                      message: t(
                        'pages.Setting.Operation.SettingsMagnification.invalidJSON',
                      ),
                    },
                  ]}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      ModelRatio: value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={16}>
                <Form.TextArea
                  label={t(
                    'pages.Setting.Operation.SettingsMagnification.completionRatio',
                  )}
                  extraText={t(
                    'pages.Setting.Operation.SettingsMagnification.completionRatioExtra',
                  )}
                  placeholder={t(
                    'pages.Setting.Operation.SettingsMagnification.completionRatioPlaceholder',
                  )}
                  field={'CompletionRatio'}
                  autosize={{ minRows: 6, maxRows: 12 }}
                  trigger='blur'
                  rules={[
                    {
                      validator: (rule, value) => verifyJSON(value),
                      message: t(
                        'pages.Setting.Operation.SettingsMagnification.invalidJSON',
                      ),
                    },
                  ]}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      CompletionRatio: value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={16}>
                <Form.TextArea
                  label={t(
                    'pages.Setting.Operation.SettingsMagnification.groupRatio',
                  )}
                  extraText={''}
                  placeholder={t(
                    'pages.Setting.Operation.SettingsMagnification.groupRatioPlaceholder',
                  )}
                  field={'GroupRatio'}
                  autosize={{ minRows: 6, maxRows: 12 }}
                  trigger='blur'
                  rules={[
                    {
                      validator: (rule, value) => verifyJSON(value),
                      message: t(
                        'pages.Setting.Operation.SettingsMagnification.invalidJSON',
                      ),
                    },
                  ]}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      GroupRatio: value,
                    })
                  }
                />
              </Col>
            </Row>

            <Row>
              <Button size='large' onClick={onSubmit}>
                {t(
                  'pages.Setting.Operation.SettingsMagnification.saveMagnificationSettings',
                )}
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>
    </>
  );
}
