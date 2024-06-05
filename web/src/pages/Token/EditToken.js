import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  API,
  isMobile,
  useShowError,
  showSuccess,
  timestamp2string,
} from '../../helpers';
import { renderQuotaWithPrompt } from '../../helpers/render';
import {
  AutoComplete,
  Banner,
  Button,
  Checkbox,
  DatePicker,
  Input,
  Select,
  SideSheet,
  Space,
  Spin,
  Typography,
} from '@douyinfe/semi-ui';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import { Divider } from 'semantic-ui-react';
import { useTranslation } from 'react-i18next';

const EditToken = (props) => {
  const showError = useShowError();
  const { t } = useTranslation();
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const originInputs = {
    name: '',
    remain_quota: isEdit ? 0 : 500000,
    expired_time: -1,
    unlimited_quota: false,
    model_limits_enabled: false,
    model_limits: [],
  };
  const [inputs, setInputs] = useState(originInputs);
  const {
    name,
    remain_quota,
    expired_time,
    unlimited_quota,
    model_limits_enabled,
    model_limits,
  } = inputs;
  const [models, setModels] = useState({});
  const navigate = useNavigate();

  const handleInputChange = (name, value) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  const handleCancel = () => {
    props.handleClose();
  };

  const setExpiredTime = (month, day, hour, minute) => {
    let now = new Date();
    let timestamp = now.getTime() / 1000;
    let seconds = month * 30 * 24 * 60 * 60;
    seconds += day * 24 * 60 * 60;
    seconds += hour * 60 * 60;
    seconds += minute * 60;
    if (seconds !== 0) {
      timestamp += seconds;
      setInputs({ ...inputs, expired_time: timestamp2string(timestamp) });
    } else {
      setInputs({ ...inputs, expired_time: -1 });
    }
  };

  const setUnlimitedQuota = () => {
    setInputs({ ...inputs, unlimited_quota: !unlimited_quota });
  };

  const loadModels = async () => {
    let res = await API.get(`/api/user/models`);
    const { success, message, data } = res.data;
    if (success) {
      let localModelOptions = data.map((model) => ({
        label: model,
        value: model,
      }));
      setModels(localModelOptions);
    } else {
      showError(message);
    }
  };

  const loadToken = async () => {
    setLoading(true);
    let res = await API.get(`/api/token/${props.editingToken.id}`);
    const { success, message, data } = res.data;
    if (success) {
      if (data.expired_time !== -1) {
        data.expired_time = timestamp2string(data.expired_time);
      }
      if (data.model_limits !== '') {
        data.model_limits = data.model_limits.split(',');
      } else {
        data.model_limits = [];
      }
      setInputs(data);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    setIsEdit(props.editingToken.id !== undefined);
  }, [props.editingToken.id]);

  useEffect(() => {
    if (!isEdit) {
      setInputs(originInputs);
    } else {
      loadToken().then(() => {
        // console.log(inputs);
      });
    }
    loadModels();
  }, [isEdit]);

  // 新增 state 变量 tokenCount 来记录用户想要创建的令牌数量，默认为 1
  const [tokenCount, setTokenCount] = useState(1);

  // 新增处理 tokenCount 变化的函数
  const handleTokenCountChange = (value) => {
    // 确保用户输入的是正整数
    const count = parseInt(value, 10);
    if (!isNaN(count) && count > 0) {
      setTokenCount(count);
    }
  };

  // 生成一个随机的四位字母数字字符串
  const generateRandomSuffix = () => {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  };

  const submit = async () => {
    setLoading(true);
    if (isEdit) {
      // 编辑令牌的逻辑保持不变
      let localInputs = { ...inputs };
      localInputs.remain_quota = parseInt(localInputs.remain_quota);
      if (localInputs.expired_time !== -1) {
        let time = Date.parse(localInputs.expired_time);
        if (isNaN(time)) {
          showError(t('pages.Token.EditToken.invalidExpiryTime'));
          setLoading(false);
          return;
        }
        localInputs.expired_time = Math.ceil(time / 1000);
      }
      localInputs.model_limits = localInputs.model_limits.join(',');
      let res = await API.put(`/api/token/`, {
        ...localInputs,
        id: parseInt(props.editingToken.id),
      });
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('pages.Token.EditToken.tokenUpdateSuccess'));
        props.refresh();
        props.handleClose();
      } else {
        showError(message);
      }
    } else {
      // 处理新增多个令牌的情况
      let successCount = 0; // 记录成功创建的令牌数量
      for (let i = 0; i < tokenCount; i++) {
        let localInputs = { ...inputs };
        if (i !== 0) {
          // 如果用户想要创建多个令牌，则给每个令牌一个序号后缀
          localInputs.name = `${inputs.name}-${generateRandomSuffix()}`;
        }
        localInputs.remain_quota = parseInt(localInputs.remain_quota);

        if (localInputs.expired_time !== -1) {
          let time = Date.parse(localInputs.expired_time);
          if (isNaN(time)) {
            showError(t('pages.Token.EditToken.invalidExpiryTime'));
            setLoading(false);
            break;
          }
          localInputs.expired_time = Math.ceil(time / 1000);
        }
        localInputs.model_limits = localInputs.model_limits.join(',');
        let res = await API.post(`/api/token/`, localInputs);
        const { success, message } = res.data;

        if (success) {
          successCount++;
        } else {
          showError(message);
          break; // 如果创建失败，终止循环
        }
      }

      if (successCount > 0) {
        showSuccess(
          t('pages.Token.EditToken.tokenCreationSuccess', {
            count: successCount,
          }),
        );
        props.refresh();
        props.handleClose();
      }
    }
    setLoading(false);
    setInputs(originInputs); // 重置表单
    setTokenCount(1); // 重置数量为默认值
  };

  const rwp = renderQuotaWithPrompt(remain_quota);

  return (
    <>
      <SideSheet
        placement={isEdit ? 'right' : 'left'}
        title={
          <Title level={3}>
            {isEdit
              ? t('pages.Token.EditToken.updateTokenInfo')
              : t('pages.Token.EditToken.createToken')}
          </Title>
        }
        headerStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
        bodyStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
        visible={props.visiable}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button theme='solid' size={'large'} onClick={submit}>
                {t('pages.Token.EditToken.submit')}
              </Button>
              <Button
                theme='solid'
                size={'large'}
                type={'tertiary'}
                onClick={handleCancel}
              >
                {t('pages.Token.EditToken.cancel')}
              </Button>
            </Space>
          </div>
        }
        closeIcon={null}
        onCancel={() => handleCancel()}
        width={isMobile() ? '100%' : 600}
      >
        <Spin spinning={loading}>
          <Input
            style={{ marginTop: 20 }}
            label={t('pages.Token.EditToken.name')}
            name='name'
            placeholder={t('pages.Token.EditToken.namePlaceholder')}
            onChange={(value) => handleInputChange('name', value)}
            value={name}
            autoComplete='new-password'
            required={!isEdit}
          />
          <Divider />
          <DatePicker
            label={t('pages.Token.EditToken.expiryTime')}
            name='expired_time'
            placeholder={t('pages.Token.EditToken.expiryTimePlaceholder')}
            onChange={(value) => handleInputChange('expired_time', value)}
            value={expired_time}
            autoComplete='new-password'
            type='dateTime'
          />
          <div style={{ marginTop: 20 }}>
            <Space>
              <Button
                type={'tertiary'}
                onClick={() => {
                  setExpiredTime(0, 0, 0, 0);
                }}
              >
                {t('pages.Token.EditToken.neverExpire')}
              </Button>
              <Button
                type={'tertiary'}
                onClick={() => {
                  setExpiredTime(0, 0, 1, 0);
                }}
              >
                {t('pages.Token.EditToken.oneHour')}
              </Button>
              <Button
                type={'tertiary'}
                onClick={() => {
                  setExpiredTime(1, 0, 0, 0);
                }}
              >
                {t('pages.Token.EditToken.oneMonth')}
              </Button>
              <Button
                type={'tertiary'}
                onClick={() => {
                  setExpiredTime(0, 1, 0, 0);
                }}
              >
                {t('pages.Token.EditToken.oneDay')}
              </Button>
            </Space>
          </div>

          <Divider />
          <Banner
            type={'warning'}
            description={t('pages.Token.EditToken.quotaWarning')}
          ></Banner>
          <div style={{ marginTop: 20 }}>
            <Typography.Text>{`${t('pages.Token.EditToken.quota')}${rwp}`}</Typography.Text>
          </div>
          <AutoComplete
            style={{ marginTop: 8 }}
            name='remain_quota'
            placeholder={t('pages.Token.EditToken.quotaPlaceholder')}
            onChange={(value) => handleInputChange('remain_quota', value)}
            value={remain_quota}
            autoComplete='new-password'
            type='number'
            data={[
              { value: 500000, label: '1$' },
              { value: 5000000, label: '10$' },
              { value: 25000000, label: '50$' },
              { value: 50000000, label: '100$' },
              { value: 250000000, label: '500$' },
              { value: 500000000, label: '1000$' },
            ]}
            disabled={unlimited_quota}
          />

          {!isEdit && (
            <>
              <div style={{ marginTop: 20 }}>
                <Typography.Text>
                  {t('pages.Token.EditToken.tokenCount')}
                </Typography.Text>
              </div>
              <AutoComplete
                style={{ marginTop: 8 }}
                label={t('pages.Token.EditToken.count')}
                placeholder={t('pages.Token.EditToken.tokenCountPlaceholder')}
                onChange={(value) => handleTokenCountChange(value)}
                onSelect={(value) => handleTokenCountChange(value)}
                value={tokenCount.toString()}
                autoComplete='off'
                type='number'
                data={[
                  { value: 10, label: t('pages.Token.EditToken.tenTokens') },
                  { value: 20, label: t('pages.Token.EditToken.twentyTokens') },
                  { value: 30, label: t('pages.Token.EditToken.thirtyTokens') },
                  {
                    value: 100,
                    label: t('pages.Token.EditToken.hundredTokens'),
                  },
                ]}
                disabled={unlimited_quota}
              />
            </>
          )}

          <div>
            <Button
              style={{ marginTop: 8 }}
              type={'warning'}
              onClick={() => {
                setUnlimitedQuota();
              }}
            >
              {unlimited_quota
                ? t('pages.Token.EditToken.cancelUnlimitedQuota')
                : t('pages.Token.EditToken.setUnlimitedQuota')}
            </Button>
          </div>
          <Divider />
          <div style={{ marginTop: 10, display: 'flex' }}>
            <Space>
              <Checkbox
                name='model_limits_enabled'
                checked={model_limits_enabled}
                onChange={(e) =>
                  handleInputChange('model_limits_enabled', e.target.checked)
                }
              ></Checkbox>
              <Typography.Text>
                {t('pages.Token.EditToken.enableModelLimits')}
              </Typography.Text>
            </Space>
          </div>

          <Select
            style={{ marginTop: 8 }}
            placeholder={t('pages.Token.EditToken.selectModels')}
            name='models'
            required
            multiple
            selection
            onChange={(value) => {
              handleInputChange('model_limits', value);
            }}
            value={inputs.model_limits}
            autoComplete='new-password'
            optionList={models}
            disabled={!model_limits_enabled}
          />
        </Spin>
      </SideSheet>
    </>
  );
};

export default EditToken;
