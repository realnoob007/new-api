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

export default function SettingsCreditLimit(props) {
  const showError = useShowError();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    QuotaForNewUser: '',
    PreConsumedQuota: '',
    QuotaForInviter: '',
    QuotaForInvitee: '',
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow);
    if (!updateArray.length)
      return showWarning(
        t('pages.Setting.Operation.SettingsCreditLimit.noChanges'),
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
                'pages.Setting.Operation.SettingsCreditLimit.partialSaveFailure',
              ),
            );
        }
        showSuccess(
          t('pages.Setting.Operation.SettingsCreditLimit.saveSuccess'),
        );
        props.refresh();
      })
      .catch(() => {
        showError(t('pages.Setting.Operation.SettingsCreditLimit.saveFailure'));
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
              'pages.Setting.Operation.SettingsCreditLimit.creditLimitSettings',
            )}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Form.InputNumber
                  label={t(
                    'pages.Setting.Operation.SettingsCreditLimit.newUserInitialQuota',
                  )}
                  field={'QuotaForNewUser'}
                  step={1}
                  min={0}
                  suffix={'Token'}
                  placeholder={''}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      QuotaForNewUser: String(value),
                    })
                  }
                />
              </Col>
              <Col span={6}>
                <Form.InputNumber
                  label={t(
                    'pages.Setting.Operation.SettingsCreditLimit.requestPreConsumedQuota',
                  )}
                  field={'PreConsumedQuota'}
                  step={1}
                  min={0}
                  suffix={'Token'}
                  extraText={t(
                    'pages.Setting.Operation.SettingsCreditLimit.extraText',
                  )}
                  placeholder={''}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      PreConsumedQuota: String(value),
                    })
                  }
                />
              </Col>
              <Col span={6}>
                <Form.InputNumber
                  label={t(
                    'pages.Setting.Operation.SettingsCreditLimit.inviterRewardQuota',
                  )}
                  field={'QuotaForInviter'}
                  step={1}
                  min={0}
                  suffix={'Token'}
                  extraText={''}
                  placeholder={t(
                    'pages.Setting.Operation.SettingsCreditLimit.example2000',
                  )}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      QuotaForInviter: String(value),
                    })
                  }
                />
              </Col>
              <Col span={6}>
                <Form.InputNumber
                  label={t(
                    'pages.Setting.Operation.SettingsCreditLimit.inviteeRewardQuota',
                  )}
                  field={'QuotaForInvitee'}
                  step={1}
                  min={0}
                  suffix={'Token'}
                  extraText={''}
                  placeholder={t(
                    'pages.Setting.Operation.SettingsCreditLimit.example1000',
                  )}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      QuotaForInvitee: String(value),
                    })
                  }
                />
              </Col>
            </Row>

            <Row>
              <Button size='large' onClick={onSubmit}>
                {t(
                  'pages.Setting.Operation.SettingsCreditLimit.saveCreditLimitSettings',
                )}
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>
    </>
  );
}
