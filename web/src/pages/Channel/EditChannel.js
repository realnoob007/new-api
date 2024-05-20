import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  API,
  isMobile,
  useShowError,
  showInfo,
  showSuccess,
  verifyJSON,
} from '../../helpers';
import { CHANNEL_OPTIONS } from '../../constants';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import {
  SideSheet,
  Space,
  Spin,
  Button,
  Input,
  Typography,
  Select,
  TextArea,
  Checkbox,
  Banner,
} from '@douyinfe/semi-ui';
import { Divider } from 'semantic-ui-react';
import { getChannelModels, loadChannelModels } from '../../components/utils.js';
import { useTranslation } from 'react-i18next';

const MODEL_MAPPING_EXAMPLE = {
  'gpt-3.5-turbo-0301': 'gpt-3.5-turbo',
  'gpt-4-0314': 'gpt-4',
  'gpt-4-32k-0314': 'gpt-4-32k',
};

const STATUS_CODE_MAPPING_EXAMPLE = {
  400: '500',
};

function type2secretPrompt(type, t) {
  switch (type) {
    case 15:
      return t('pages.Channel.EditChannel.promptType15');
    case 18:
      return t('pages.Channel.EditChannel.promptType18');
    case 22:
      return t('pages.Channel.EditChannel.promptType22');
    case 23:
      return t('pages.Channel.EditChannel.promptType23');
    case 33:
      return t('pages.Channel.EditChannel.promptType33');
    default:
      return t('pages.Channel.EditChannel.promptDefault');
  }
}

const EditChannel = (props) => {
  const showError = useShowError();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const channelId = props.editingChannel.id;
  const isEdit = channelId !== undefined;
  const [loading, setLoading] = useState(isEdit);
  const handleCancel = () => {
    props.handleClose();
  };
  const originInputs = {
    name: '',
    type: 1,
    key: '',
    openai_organization: '',
    max_input_tokens: 0,
    base_url: '',
    other: '',
    model_mapping: '',
    status_code_mapping: '',
    models: [],
    auto_ban: 1,
    test_model: '',
    groups: ['default'],
  };
  const [batch, setBatch] = useState(false);
  const [autoBan, setAutoBan] = useState(true);
  const [inputs, setInputs] = useState(originInputs);
  const [originModelOptions, setOriginModelOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [basicModels, setBasicModels] = useState([]);
  const [fullModels, setFullModels] = useState([]);
  const [customModel, setCustomModel] = useState('');
  const handleInputChange = (name, value) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
    if (name === 'type') {
      let localModels = [];
      switch (value) {
        case 2:
          localModels = [
            'mj_imagine',
            'mj_variation',
            'mj_reroll',
            'mj_blend',
            'mj_upscale',
            'mj_describe',
            'mj_uploads',
          ];
          break;
        case 5:
          localModels = [
            'swap_face',
            'mj_imagine',
            'mj_variation',
            'mj_reroll',
            'mj_blend',
            'mj_upscale',
            'mj_describe',
            'mj_zoom',
            'mj_shorten',
            'mj_modal',
            'mj_inpaint',
            'mj_custom_zoom',
            'mj_high_variation',
            'mj_low_variation',
            'mj_pan',
            'mj_uploads',
          ];
          break;
        default:
          localModels = getChannelModels(value);
          break;
      }
      if (inputs.models.length === 0) {
        setInputs((inputs) => ({ ...inputs, models: localModels }));
      }
      setBasicModels(localModels);
    }
  };

  const loadChannel = async () => {
    setLoading(true);
    let res = await API.get(`/api/channel/${channelId}`);
    if (res === undefined) {
      return;
    }
    const { success, message, data } = res.data;
    if (success) {
      if (data.models === '') {
        data.models = [];
      } else {
        data.models = data.models.split(',');
      }
      if (data.group === '') {
        data.groups = [];
      } else {
        data.groups = data.group.split(',');
      }
      if (data.model_mapping !== '') {
        data.model_mapping = JSON.stringify(
          JSON.parse(data.model_mapping),
          null,
          2,
        );
      }
      setInputs(data);
      if (data.auto_ban === 0) {
        setAutoBan(false);
      } else {
        setAutoBan(true);
      }
      setBasicModels(getChannelModels(data.type));
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const fetchModels = async () => {
    try {
      let res = await API.get(`/api/channel/models`);
      if (res === undefined) {
        return;
      }
      let localModelOptions = res.data.data.map((model) => ({
        label: model.id,
        value: model.id,
      }));
      setOriginModelOptions(localModelOptions);
      setFullModels(res.data.data.map((model) => model.id));
      setBasicModels(
        res.data.data
          .filter((model) => {
            return model.id.startsWith('gpt-3') || model.id.startsWith('text-');
          })
          .map((model) => model.id),
      );
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchGroups = async () => {
    try {
      let res = await API.get(`/api/group/`);
      if (res === undefined) {
        return;
      }
      setGroupOptions(
        res.data.data.map((group) => ({
          label: group,
          value: group,
        })),
      );
    } catch (error) {
      showError(error.message);
    }
  };

  useEffect(() => {
    let localModelOptions = [...originModelOptions];
    inputs.models.forEach((model) => {
      if (!localModelOptions.find((option) => option.key === model)) {
        localModelOptions.push({
          label: model,
          value: model,
        });
      }
    });
    setModelOptions(localModelOptions);
  }, [originModelOptions, inputs.models]);

  useEffect(() => {
    fetchModels().then();
    fetchGroups().then();
    if (isEdit) {
      loadChannel().then(() => {});
    } else {
      setInputs(originInputs);
      let localModels = getChannelModels(inputs.type);
      setBasicModels(localModels);
      setInputs((inputs) => ({ ...inputs, models: localModels }));
    }
  }, [props.editingChannel.id]);

  const submit = async () => {
    if (!isEdit && (inputs.name === '' || inputs.key === '')) {
      showInfo(t('pages.Channel.EditChannel.fillNameAndKey'));
      return;
    }
    if (inputs.models.length === 0) {
      showInfo(t('pages.Channel.EditChannel.selectModel'));
      return;
    }
    if (inputs.model_mapping !== '' && !verifyJSON(inputs.model_mapping)) {
      showInfo(t('pages.Channel.EditChannel.modelMappingInvalid'));
      return;
    }
    let localInputs = { ...inputs };
    if (localInputs.base_url && localInputs.base_url.endsWith('/')) {
      localInputs.base_url = localInputs.base_url.slice(
        0,
        localInputs.base_url.length - 1,
      );
    }
    if (localInputs.type === 3 && localInputs.other === '') {
      localInputs.other = '2023-06-01-preview';
    }
    if (localInputs.type === 18 && localInputs.other === '') {
      localInputs.other = 'v2.1';
    }
    let res;
    if (!Array.isArray(localInputs.models)) {
      showError(t('pages.Channel.EditChannel.submitFailed'));
      handleCancel();
      return;
    }
    localInputs.auto_ban = autoBan ? 1 : 0;
    localInputs.models = localInputs.models.join(',');
    localInputs.group = localInputs.groups.join(',');
    if (isEdit) {
      res = await API.put(`/api/channel/`, {
        ...localInputs,
        id: parseInt(channelId),
      });
    } else {
      res = await API.post(`/api/channel/`, localInputs);
    }
    const { success, message } = res.data;
    if (success) {
      if (isEdit) {
        showSuccess(t('pages.Channel.EditChannel.updateSuccess'));
      } else {
        showSuccess(t('pages.Channel.EditChannel.createSuccess'));
        setInputs(originInputs);
      }
      props.refresh();
      props.handleClose();
    } else {
      showError(message);
    }
  };

  const addCustomModels = () => {
    if (customModel.trim() === '') return;
    const modelArray = customModel.split(',').map((model) => model.trim());

    let localModels = [...inputs.models];
    let localModelOptions = [...modelOptions];
    let hasError = false;

    modelArray.forEach((model) => {
      if (model && !localModels.includes(model)) {
        localModels.push(model);
        localModelOptions.push({
          key: model,
          text: model,
          value: model,
        });
      } else if (model) {
        showError(t('pages.Channel.EditChannel.modelExists'));
        hasError = true;
      }
    });

    if (hasError) return;

    setModelOptions(localModelOptions);
    setCustomModel('');
    handleInputChange('models', localModels);
  };

  return (
    <>
      <SideSheet
        maskClosable={false}
        placement={isEdit ? 'right' : 'left'}
        title={
          <Title level={3}>
            {isEdit
              ? t('pages.Channel.EditChannel.updateChannel')
              : t('pages.Channel.EditChannel.createChannel')}
          </Title>
        }
        headerStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
        bodyStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
        visible={props.visible}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button theme='solid' size={'large'} onClick={submit}>
                {t('pages.Channel.EditChannel.submit')}
              </Button>
              <Button
                theme='solid'
                size={'large'}
                type={'tertiary'}
                onClick={handleCancel}
              >
                {t('pages.Channel.EditChannel.cancel')}
              </Button>
            </Space>
          </div>
        }
        closeIcon={null}
        onCancel={() => handleCancel()}
        width={isMobile() ? '100%' : 600}
      >
        <Spin spinning={loading}>
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>
              {t('pages.Channel.EditChannel.type')}
            </Typography.Text>
          </div>
          <Select
            name='type'
            required
            optionList={CHANNEL_OPTIONS}
            value={inputs.type}
            onChange={(value) => handleInputChange('type', value)}
            style={{ width: '50%' }}
          />
          {inputs.type === 3 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Banner
                  type={'warning'}
                  description={
                    <>
                      {t('pages.Channel.EditChannel.azureWarning')}{' '}
                      <a
                        target='_blank'
                        href='https://github.com/songquanpeng/one-api/issues/133?notification_referrer_id=NT_kwDOAmJSYrM2NjIwMzI3NDgyOjM5OTk4MDUw#issuecomment-1571602271'
                      >
                        {t('pages.Channel.EditChannel.imageDemo')}
                      </a>
                      。
                    </>
                  }
                ></Banner>
              </div>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>
                  {t('pages.Channel.EditChannel.azureEndpoint')}
                </Typography.Text>
              </div>
              <Input
                label={t('pages.Channel.EditChannel.azureEndpoint')}
                name='azure_base_url'
                placeholder={t(
                  'pages.Channel.EditChannel.azureEndpointPlaceholder',
                )}
                onChange={(value) => {
                  handleInputChange('base_url', value);
                }}
                value={inputs.base_url}
                autoComplete='new-password'
              />
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>
                  {t('pages.Channel.EditChannel.defaultAPIVersion')}
                </Typography.Text>
              </div>
              <Input
                label={t('pages.Channel.EditChannel.defaultAPIVersion')}
                name='azure_other'
                placeholder={t(
                  'pages.Channel.EditChannel.defaultAPIVersionPlaceholder',
                )}
                onChange={(value) => {
                  handleInputChange('other', value);
                }}
                value={inputs.other}
                autoComplete='new-password'
              />
            </>
          )}
          {inputs.type === 8 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>
                  {t('pages.Channel.EditChannel.baseURL')}
                </Typography.Text>
              </div>
              <Input
                name='base_url'
                placeholder={t('pages.Channel.EditChannel.baseURLPlaceholder')}
                onChange={(value) => {
                  handleInputChange('base_url', value);
                }}
                value={inputs.base_url}
                autoComplete='new-password'
              />
            </>
          )}
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>
              {t('pages.Channel.EditChannel.name')}
            </Typography.Text>
          </div>
          <Input
            required
            name='name'
            placeholder={t('pages.Channel.EditChannel.namePlaceholder')}
            onChange={(value) => {
              handleInputChange('name', value);
            }}
            value={inputs.name}
            autoComplete='new-password'
          />
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>
              {t('pages.Channel.EditChannel.groups')}
            </Typography.Text>
          </div>
          <Select
            placeholder={t('pages.Channel.EditChannel.groupsPlaceholder')}
            name='groups'
            required
            multiple
            selection
            allowAdditions
            additionLabel={t('pages.Channel.EditChannel.addGroupLabel')}
            onChange={(value) => {
              handleInputChange('groups', value);
            }}
            value={inputs.groups}
            autoComplete='new-password'
            optionList={groupOptions}
          />
          {inputs.type === 18 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>
                  {t('pages.Channel.EditChannel.modelVersion')}
                </Typography.Text>
              </div>
              <Input
                name='other'
                placeholder={t(
                  'pages.Channel.EditChannel.modelVersionPlaceholder',
                )}
                onChange={(value) => {
                  handleInputChange('other', value);
                }}
                value={inputs.other}
                autoComplete='new-password'
              />
            </>
          )}
          {inputs.type === 21 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>
                  {t('pages.Channel.EditChannel.knowledgeBaseId')}
                </Typography.Text>
              </div>
              <Input
                label={t('pages.Channel.EditChannel.knowledgeBaseId')}
                name='other'
                placeholder={t(
                  'pages.Channel.EditChannel.knowledgeBaseIdPlaceholder',
                )}
                onChange={(value) => {
                  handleInputChange('other', value);
                }}
                value={inputs.other}
                autoComplete='new-password'
              />
            </>
          )}
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>
              {t('pages.Channel.EditChannel.models')}
            </Typography.Text>
          </div>
          <Select
            placeholder={t('pages.Channel.EditChannel.modelsPlaceholder')}
            name='models'
            required
            multiple
            selection
            onChange={(value) => {
              handleInputChange('models', value);
            }}
            value={inputs.models}
            autoComplete='new-password'
            optionList={modelOptions}
          />
          <div style={{ lineHeight: '40px', marginBottom: '12px' }}>
            <Space>
              <Button
                type='primary'
                onClick={() => {
                  handleInputChange('models', basicModels);
                }}
              >
                {t('pages.Channel.EditChannel.fillRelevantModels')}
              </Button>
              <Button
                type='secondary'
                onClick={() => {
                  handleInputChange('models', fullModels);
                }}
              >
                {t('pages.Channel.EditChannel.fillAllModels')}
              </Button>
              <Button
                type='warning'
                onClick={() => {
                  handleInputChange('models', []);
                }}
              >
                {t('pages.Channel.EditChannel.clearAllModels')}
              </Button>
            </Space>
            <Input
              addonAfter={
                <Button type='primary' onClick={addCustomModels}>
                  {t('pages.Channel.EditChannel.fill')}
                </Button>
              }
              placeholder={t(
                'pages.Channel.EditChannel.customModelPlaceholder',
              )}
              value={customModel}
              onChange={(value) => {
                setCustomModel(value.trim());
              }}
            />
          </div>
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>
              {t('pages.Channel.EditChannel.modelRedirect')}
            </Typography.Text>
          </div>
          <TextArea
            placeholder={`${t('pages.Channel.EditChannel.modelRedirectPlaceholder')}\n${JSON.stringify(MODEL_MAPPING_EXAMPLE, null, 2)}`}
            name='model_mapping'
            onChange={(value) => {
              handleInputChange('model_mapping', value);
            }}
            autosize
            value={inputs.model_mapping}
            autoComplete='new-password'
          />
          <Typography.Text
            style={{
              color: 'rgba(var(--semi-blue-5), 1)',
              userSelect: 'none',
              cursor: 'pointer',
            }}
            onClick={() => {
              handleInputChange(
                'model_mapping',
                JSON.stringify(MODEL_MAPPING_EXAMPLE, null, 2),
              );
            }}
          >
            {t('pages.Channel.EditChannel.fillTemplate')}
          </Typography.Text>
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>
              {t('pages.Channel.EditChannel.secret')}
            </Typography.Text>
          </div>
          {batch ? (
            <TextArea
              label={t('pages.Channel.EditChannel.secret')}
              name='key'
              required
              placeholder={t(
                'pages.Channel.EditChannel.secretPlaceholderBatch',
              )}
              onChange={(value) => {
                handleInputChange('key', value);
              }}
              value={inputs.key}
              style={{ minHeight: 150, fontFamily: 'JetBrains Mono, Consolas' }}
              autoComplete='new-password'
            />
          ) : (
            <Input
              label={t('pages.Channel.EditChannel.secret')}
              name='key'
              required
              placeholder={type2secretPrompt(inputs.type, t)}
              onChange={(value) => {
                handleInputChange('key', value);
              }}
              value={inputs.key}
              autoComplete='new-password'
            />
          )}
          {inputs.type === 1 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>
                  {t('pages.Channel.EditChannel.organization')}
                </Typography.Text>
              </div>
              <Input
                label={t('pages.Channel.EditChannel.organizationOptional')}
                name='openai_organization'
                placeholder={t(
                  'pages.Channel.EditChannel.organizationPlaceholder',
                )}
                onChange={(value) => {
                  handleInputChange('openai_organization', value);
                }}
                value={inputs.openai_organization}
              />
            </>
          )}
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>
              {t('pages.Channel.EditChannel.defaultTestModel')}
            </Typography.Text>
          </div>
          <Input
            name='test_model'
            placeholder={t(
              'pages.Channel.EditChannel.defaultTestModelPlaceholder',
            )}
            onChange={(value) => {
              handleInputChange('test_model', value);
            }}
            value={inputs.test_model}
          />
          <div style={{ marginTop: 10, display: 'flex' }}>
            <Space>
              <Checkbox
                name='auto_ban'
                checked={autoBan}
                onChange={() => {
                  setAutoBan(!autoBan);
                }}
              />
              <Typography.Text strong>
                {t('pages.Channel.EditChannel.autoBan')}
              </Typography.Text>
            </Space>
          </div>

          {!isEdit && (
            <div style={{ marginTop: 10, display: 'flex' }}>
              <Space>
                <Checkbox
                  checked={batch}
                  label={t('pages.Channel.EditChannel.batchCreate')}
                  name='batch'
                  onChange={() => setBatch(!batch)}
                />
                <Typography.Text strong>
                  {t('pages.Channel.EditChannel.batchCreate')}
                </Typography.Text>
              </Space>
            </div>
          )}
          {inputs.type !== 3 && inputs.type !== 8 && inputs.type !== 22 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>
                  {t('pages.Channel.EditChannel.proxy')}
                </Typography.Text>
              </div>
              <Input
                label={t('pages.Channel.EditChannel.proxy')}
                name='base_url'
                placeholder={t('pages.Channel.EditChannel.proxyPlaceholder')}
                onChange={(value) => {
                  handleInputChange('base_url', value);
                }}
                value={inputs.base_url}
                autoComplete='new-password'
              />
            </>
          )}
          {inputs.type === 22 && (
            <>
              <div style={{ marginTop: 10 }}>
                <Typography.Text strong>
                  {t('pages.Channel.EditChannel.privateDeploymentAddress')}
                </Typography.Text>
              </div>
              <Input
                name='base_url'
                placeholder={t(
                  'pages.Channel.EditChannel.privateDeploymentAddressPlaceholder',
                )}
                onChange={(value) => {
                  handleInputChange('base_url', value);
                }}
                value={inputs.base_url}
                autoComplete='new-password'
              />
            </>
          )}
          <div style={{ marginTop: 10 }}>
            <Typography.Text strong>
              {t('pages.Channel.EditChannel.statusCodeRewrite')}
            </Typography.Text>
          </div>
          <TextArea
            placeholder={`${t('pages.Channel.EditChannel.statusCodeRewritePlaceholder')}\n${JSON.stringify(STATUS_CODE_MAPPING_EXAMPLE, null, 2)}`}
            name='status_code_mapping'
            onChange={(value) => {
              handleInputChange('status_code_mapping', value);
            }}
            autosize
            value={inputs.status_code_mapping}
            autoComplete='new-password'
          />
          <Typography.Text
            style={{
              color: 'rgba(var(--semi-blue-5), 1)',
              userSelect: 'none',
              cursor: 'pointer',
            }}
            onClick={() => {
              handleInputChange(
                'status_code_mapping',
                JSON.stringify(STATUS_CODE_MAPPING_EXAMPLE, null, 2),
              );
            }}
          >
            {t('pages.Channel.EditChannel.fillTemplate')}
          </Typography.Text>
        </Spin>
      </SideSheet>
    </>
  );
};

export default EditChannel;
