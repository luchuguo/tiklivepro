import React, { useCallback } from 'react';
import { TalentType, talentTypeConfig, Question } from '../../types/talent';
import { Upload, X } from 'lucide-react';

interface TalentQuestionFormProps {
  talentType: TalentType;
  formData: any;
  onChange: (data: any) => void;
}

export function TalentQuestionForm({ talentType, formData, onChange }: TalentQuestionFormProps) {
  const config = talentTypeConfig[talentType];

  const handleFileChange = useCallback((question: Question, files: FileList | null) => {
    if (question.type !== 'file' || !files) return;

    const selectedFiles = Array.from(files);
    const validFiles = selectedFiles.filter(file => {
      // Check file type
      if (!file.type.match(/(image|video)\//)) {
        alert('Only image or video files are allowed');
        return false;
      }
      // Check file size
      if (file.size > question.maxSize * 1024 * 1024) {
        alert(`File size cannot exceed ${question.maxSize}MB`);
        return false;
      }
      return true;
    });

    // Check file count
    if (validFiles.length > question.maxFiles) {
      alert(`Maximum ${question.maxFiles} files allowed`);
      return;
    }

    // Update form data
    onChange({
      ...formData,
      [question.key]: validFiles
    });
  }, [formData, onChange]);

  const removeFile = useCallback((question: Question, fileIndex: number) => {
    if (question.type !== 'file') return;

    const files = formData[question.key] || [];
    const newFiles = files.filter((_: any, index: number) => index !== fileIndex);
    onChange({
      ...formData,
      [question.key]: newFiles
    });
  }, [formData, onChange]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {config.label} Related Questions
      </h2>
      
      {config.questions.map((question) => (
        <div key={question.key} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {question.label}
          </label>
          
          {question.type === 'select' && (
            <select
              value={formData[question.key] || ''}
              onChange={(e) => onChange({ ...formData, [question.key]: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">Please select</option>
              {question.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          
          {question.type === 'checkbox' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {question.options.map((option) => (
                <label key={option.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(formData[question.key] || []).includes(option.value)}
                    onChange={(e) => {
                      const values = formData[question.key] || [];
                      const newValues = e.target.checked
                        ? [...values, option.value]
                        : values.filter((v: string) => v !== option.value);
                      onChange({ ...formData, [question.key]: newValues });
                    }}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          )}
          
          {question.type === 'text' && (
            <input
              type="text"
              value={formData[question.key] || ''}
              onChange={(e) => onChange({ ...formData, [question.key]: e.target.value })}
              placeholder={question.placeholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          )}

          {question.type === 'file' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">{question.description}</p>
              
              {/* File upload area */}
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-pink-500 transition-colors">
                <input
                  type="file"
                  accept={question.accept}
                  multiple={question.maxFiles > 1}
                  onChange={(e) => handleFileChange(question, e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Click or drag files here to upload
                  </p>
                </div>
              </div>

              {/* Uploaded files list */}
              {formData[question.key] && formData[question.key].length > 0 && (
                <div className="space-y-2">
                  {formData[question.key].map((file: File, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Preview"
                              className="h-10 w-10 object-cover rounded"
                            />
                          ) : (
                            <video
                              src={URL.createObjectURL(file)}
                              className="h-10 w-10 object-cover rounded"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(question, index)}
                        className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-500"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 