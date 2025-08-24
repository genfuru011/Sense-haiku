import React, { useState } from 'react';

interface ReplyFormProps {
  onSubmit: (line1: string, line2: string, line3: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const InputField: React.FC<{
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    maxLength: number;
    placeholder: string;
}> = ({ value, onChange, maxLength, placeholder }) => (
    <input
        type="text"
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full bg-slate-100 border-2 border-transparent focus:border-teal-400 focus:ring-0 rounded-md py-2 px-3 text-center text-md font-serif text-slate-800"
        required
    />
);

const ReplyForm: React.FC<ReplyFormProps> = ({ onSubmit, onCancel, isSubmitting }) => {
    const [line1, setLine1] = useState('');
    const [line2, setLine2] = useState('');
    const [line3, setLine3] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!line1 || !line2 || !line3) {
            alert('すべての句を入力してください。');
            return;
        }
        onSubmit(line1, line2, line3);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-100 rounded-b-xl -mt-px">
            <div className="space-y-2 mb-3">
                <InputField value={line1} onChange={(e) => setLine1(e.target.value)} maxLength={5} placeholder="五" />
                <InputField value={line2} onChange={(e) => setLine2(e.target.value)} maxLength={7} placeholder="七" />
                <InputField value={line3} onChange={(e) => setLine3(e.target.value)} maxLength={5} placeholder="五" />
            </div>
            <div className="flex justify-end gap-2">
                 <button 
                    type="button" 
                    onClick={onCancel}
                    className="py-1 px-4 text-sm font-semibold text-slate-600 bg-white rounded-full hover:bg-slate-50 border"
                >
                    キャンセル
                </button>
                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="py-1 px-4 text-sm font-semibold text-white bg-teal-500 rounded-full hover:bg-teal-600 disabled:bg-slate-400"
                >
                    返信する
                </button>
            </div>
        </form>
    );
};

export default ReplyForm;