import React, { useState, useEffect, useRef } from 'react';

interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  className?: string;
  multiline?: boolean;
  isEditable?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({ 
  value, onChange, as: Component = 'span', className = '', multiline = false, isEditable = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      if ('selectionStart' in inputRef.current) {
        inputRef.current.selectionStart = inputRef.current.selectionEnd = inputRef.current.value.length;
      }
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (draft !== value) {
      onChange(draft);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setDraft(value);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current && multiline) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [isEditing, draft, multiline]);

  if (isEditing) {
    const commonProps = {
      ref: inputRef as any,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      className: `bg-transparent outline-none border-b border-primary-500 ring-2 ring-primary-400 rounded-sm w-full ${className}`,
      style: { resize: 'none' as const, overflow: 'hidden' }
    };

    return multiline ? (
      <textarea {...commonProps} rows={1} />
    ) : (
      <input type="text" {...commonProps} />
    );
  }

  if (!isEditable) {
    return <Component className={className}>{value}</Component>;
  }

  return (
    <Component 
      className={`cursor-pointer hover:ring-2 hover:ring-primary-500/50 hover:bg-primary-500/10 rounded transition-all ${multiline ? 'block w-full min-h-[1.5em]' : 'inline-block min-w-[2em]'} ${className}`} 
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {value || (
        <span className="opacity-40 italic font-normal text-sm">
          {multiline ? 'Click to add description...' : 'Empty'}
        </span>
      )}
    </Component>
  );
};
