import React, { useState } from 'react';
import { Button, Card, Form, Input, Radio, Checkbox, Space, Typography, message } from 'antd';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Question {
  id: number;
  questionText: string;
  type: 'text' | 'radio' | 'checkbox' | 'textarea';
  isRequired: boolean;
  options?: string[];
  order: number;
}

interface ApplicationFormProps {
  questions: Question[];
  onSubmit: (answers: Record<string, any>) => void;
  onCancel: () => void;
  loading?: boolean;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({
  questions,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [answers, setAnswers] = useState<Record<string, any>>({});

  console.log('ApplicationForm questions:', questions);
  console.log('ApplicationForm questions length:', questions?.length);
  console.log('ApplicationForm questions type:', typeof questions);

  const handleSubmit = async (values: any) => {
    console.log('handleSubmit called with values:', values);
    try {
      // values는 이미 검증된 폼 데이터입니다
      console.log('Form values:', values);
      console.log('Form values type:', typeof values);
      console.log('Form values keys:', Object.keys(values));
      console.log('Form values length:', Object.keys(values).length);
      console.log('Calling onSubmit with values:', values);
      onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
      message.error('폼 제출 중 오류가 발생했습니다.');
    }
  };

  const renderQuestion = (question: Question) => {
    const { id, questionText, type, isRequired, options = [] } = question;

    switch (type) {
      case 'text':
        return (
          <Form.Item
            key={id}
            name={`question_${id}`}
            label={
              <Text strong>
                {questionText}
                {isRequired && <Text type="danger"> *</Text>}
              </Text>
            }
            rules={isRequired ? [{ required: true, message: '이 항목은 필수입니다.' }] : []}
          >
            <Input placeholder="답변을 입력하세요" />
          </Form.Item>
        );

      case 'textarea':
        return (
          <Form.Item
            key={id}
            name={`question_${id}`}
            label={
              <Text strong>
                {questionText}
                {isRequired && <Text type="danger"> *</Text>}
              </Text>
            }
            rules={isRequired ? [{ required: true, message: '이 항목은 필수입니다.' }] : []}
          >
            <TextArea rows={4} placeholder="답변을 입력하세요" />
          </Form.Item>
        );

      case 'radio':
        return (
          <Form.Item
            key={id}
            name={`question_${id}`}
            label={
              <Text strong>
                {questionText}
                {isRequired && <Text type="danger"> *</Text>}
              </Text>
            }
            rules={isRequired ? [{ required: true, message: '이 항목은 필수입니다.' }] : []}
          >
            <Radio.Group>
              <Space direction="vertical">
                {options.map((option, index) => (
                  <Radio key={index} value={option}>
                    {option}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>
        );

      case 'checkbox':
        return (
          <Form.Item
            key={id}
            name={`question_${id}`}
            label={
              <Text strong>
                {questionText}
                {isRequired && <Text type="danger"> *</Text>}
              </Text>
            }
            rules={isRequired ? [{ required: true, message: '이 항목은 필수입니다.' }] : []}
          >
            <Checkbox.Group>
              <Space direction="vertical">
                {options.map((option, index) => (
                  <Checkbox key={index} value={option}>
                    {option}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
        );

      default:
        return null;
    }
  };

  return (
    <Card title="스터디 지원 폼" style={{ maxWidth: 600, margin: '0 auto' }}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* 임시로 questions 완전 차단 - 모든 questions 에러 해결 후 활성화 */}
        {false ? (
          <div className="text-sm text-gray-500 text-center py-4">
            질문이 임시로 비활성화되었습니다.
          </div>
        ) : (
          <div className="text-sm text-gray-500 text-center py-4">
            질문이 없습니다.
          </div>
        )}
        
        <Form.Item style={{ marginTop: 24 }}>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              onClick={() => console.log('Submit button clicked')}
            >
              지원하기
            </Button>
            <Button onClick={onCancel}>
              취소
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ApplicationForm;
