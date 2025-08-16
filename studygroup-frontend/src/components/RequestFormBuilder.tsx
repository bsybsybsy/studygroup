import React, { useState } from 'react';
import { PlusIcon, TrashIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { RequestForm } from '../types';

export enum QuestionType {
  SHORT_ANSWER = 'short_answer',
  LONG_ANSWER = 'long_answer',
  MULTIPLE_CHOICE = 'multiple_choice',
  CHECKBOX = 'checkbox'
}

export interface Question {
  id: string;
  questionText: string;
  type: QuestionType;
  isRequired: boolean;
  order: number;
  options?: string[];
}

interface RequestFormBuilderProps {
  onSave: (formData: RequestForm) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: RequestForm;
}

const RequestFormBuilder: React.FC<RequestFormBuilderProps> = ({
  onSave,
  onCancel,
  loading = false,
  initialData
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [questions, setQuestions] = useState<Question[]>(
    initialData?.questions || []
  );

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      questionText: '',
      type: QuestionType.SHORT_ANSWER,
      isRequired: false,
      order: questions.length + 1,
      options: []
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    // Reorder remaining questions
    setQuestions(prev => prev
      .filter(q => q.id !== id)
      .map((q, index) => ({ ...q, order: index + 1 }))
    );
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    const currentIndex = questions.findIndex(q => q.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    [newQuestions[currentIndex], newQuestions[targetIndex]] = 
    [newQuestions[targetIndex], newQuestions[currentIndex]];
    
    // Update order numbers
    newQuestions.forEach((q, index) => {
      q.order = index + 1;
    });
    
    setQuestions(newQuestions);
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: [...(q.options || []), ''] }
        : q
    ));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: q.options?.filter((_, index) => index !== optionIndex) }
        : q
    ));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options?.map((opt, index) => 
              index === optionIndex ? value : opt
            )
          }
        : q
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('양식 제목을 입력해주세요.');
      return;
    }
    if (questions.length === 0) {
      alert('최소 하나의 질문을 추가해주세요.');
      return;
    }
    if (questions.some(q => !q.questionText.trim())) {
      alert('모든 질문에 텍스트를 입력해주세요.');
      return;
    }
    if (questions.some(q => 
      (q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.CHECKBOX) && 
      (!q.options || q.options.length < 2)
    )) {
      alert('객관식과 체크박스 질문은 최소 2개의 옵션이 필요합니다.');
      return;
    }

    onSave({ title, questions } as RequestForm);
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case QuestionType.SHORT_ANSWER: return '단답형';
      case QuestionType.LONG_ANSWER: return '서술형';
      case QuestionType.MULTIPLE_CHOICE: return '객관식';
      case QuestionType.CHECKBOX: return '체크박스';
      default: return type;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">지원 양식 만들기</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            양식 제목 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="예: 스터디 지원 양식"
            required
          />
        </div>

        {/* Questions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">질문 목록</h3>
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              질문 추가
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              질문을 추가해주세요
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      질문 {question.order}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => moveQuestion(question.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <ArrowsUpDownIcon className="h-4 w-4 transform rotate-90" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(question.id, 'down')}
                        disabled={index === questions.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <ArrowsUpDownIcon className="h-4 w-4 transform -rotate-90" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="mb-3">
                    <input
                      type="text"
                      value={question.questionText}
                      onChange={(e) => updateQuestion(question.id, { questionText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="질문을 입력하세요"
                      required
                    />
                  </div>

                  {/* Question Type */}
                  <div className="mb-3">
                    <select
                      value={question.type}
                      onChange={(e) => updateQuestion(question.id, { type: e.target.value as QuestionType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={QuestionType.SHORT_ANSWER}>단답형</option>
                      <option value={QuestionType.LONG_ANSWER}>서술형</option>
                      <option value={QuestionType.MULTIPLE_CHOICE}>객관식</option>
                      <option value={QuestionType.CHECKBOX}>체크박스</option>
                    </select>
                  </div>

                  {/* Required Checkbox */}
                  <div className="mb-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={question.isRequired}
                        onChange={(e) => updateQuestion(question.id, { isRequired: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">필수 질문</span>
                    </label>
                  </div>

                  {/* Options for Multiple Choice and Checkbox */}
                  {(question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.CHECKBOX) && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        옵션들 *
                      </label>
                      <div className="space-y-2">
                        {(question.options || []).map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`옵션 ${optionIndex + 1}`}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(question.id, optionIndex)}
                              className="p-2 text-red-400 hover:text-red-600"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOption(question.id)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          옵션 추가
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  <div className="mt-3 p-3 bg-white border border-gray-200 rounded-md">
                    <p className="text-sm text-gray-600 mb-2">미리보기:</p>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {question.questionText || '질문 텍스트'}
                        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      
                      {question.type === QuestionType.SHORT_ANSWER && (
                        <input
                          type="text"
                          disabled
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-500 bg-gray-100"
                          placeholder="단답형 답변"
                        />
                      )}
                      
                      {question.type === QuestionType.LONG_ANSWER && (
                        <textarea
                          disabled
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-500 bg-gray-100"
                          placeholder="서술형 답변"
                          rows={3}
                        />
                      )}
                      
                      {question.type === QuestionType.MULTIPLE_CHOICE && (
                        <div className="space-y-1">
                          {(question.options || []).map((option, optionIndex) => (
                            <label key={optionIndex} className="flex items-center">
                              <input
                                type="radio"
                                disabled
                                className="h-3 w-3 text-blue-600 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-600">{option || `옵션 ${optionIndex + 1}`}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {question.type === QuestionType.CHECKBOX && (
                        <div className="space-y-1">
                          {(question.options || []).map((option, optionIndex) => (
                            <label key={optionIndex} className="flex items-center">
                              <input
                                type="checkbox"
                                disabled
                                className="h-3 w-3 text-blue-600 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-600">{option || `옵션 ${optionIndex + 1}`}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '저장 중...' : '양식 저장'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestFormBuilder;

