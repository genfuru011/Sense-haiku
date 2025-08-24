import React, { useState, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HaikuPost, Visibility } from '../types';
import { generateHaikuFromText } from '../services/geminiService';
import QuotedHaikuCard from '../components/QuotedHaikuCard';

interface NewPostPageProps {
  posts: HaikuPost[];
  addPost: (post: Omit<HaikuPost, 'id' | 'timestamp' | 'author' | 'authorAvatar' | 'reactions'>) => void;
}

const InputField: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maxLength: number;
  placeholder: string;
}> = ({ value, onChange, maxLength, placeholder }) => (
  <div className="relative">
    <input
      type="text"
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      placeholder={placeholder}
      className="w-full bg-slate-100 border-2 border-transparent focus:border-teal-400 focus:ring-0 rounded-lg py-3 px-4 text-center text-lg font-serif text-slate-800"
    />
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
      {value.length}/{maxLength}
    </span>
  </div>
);

const NewPostPage: React.FC<NewPostPageProps> = ({ posts, addPost }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quotedPostId = searchParams.get('quote');
  
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [line3, setLine3] = useState('');
  const [visibility, setVisibility] = useState<Visibility>(Visibility.Public);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  const quotedPost = useMemo(() => {
    if (!quotedPostId) return null;
    return posts.find(p => p.id === quotedPostId) || null;
  }, [posts, quotedPostId]);


  const handleGenerateHaiku = async () => {
    if (!aiPrompt.trim()) return;
    setIsLoadingAi(true);
    setAiError('');
    try {
      const result = await generateHaikuFromText(aiPrompt);
      setLine1(result.line1);
      setLine2(result.line2);
      setLine3(result.line3);
      setIsAiGenerated(true);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : '不明なエラーが発生しました。');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!line1 || !line2 || !line3) {
      alert('すべての句を入力してください。');
      return;
    }
    addPost({
      line1,
      line2,
      line3,
      visibility,
      isAiGenerated,
      image: imagePreview || undefined,
      quotedPostId: quotedPost?.id,
    });
    navigate('/');
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-800 text-center mb-8">
        {quotedPost ? '引用して詠む' : '新しい句を詠む'}
      </h1>

      {/* AI Helper Section */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 mb-8">
        <h2 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            AIで俳句を生成
        </h2>
        <p className="text-sm text-slate-500 mb-4">文章やキーワードからAIが五七五を生成します。</p>
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="例: 静かな夏の夜、縁側で涼む"
          className="w-full bg-slate-100 border-2 border-transparent focus:border-teal-400 focus:ring-0 rounded-lg p-3 text-sm mb-3 text-slate-800"
          rows={3}
        />
        <button
          onClick={handleGenerateHaiku}
          disabled={isLoadingAi}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center disabled:bg-slate-300"
        >
          {isLoadingAi ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : '生成する'}
        </button>
        {aiError && <p className="text-red-500 text-sm mt-2">{aiError}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
        {quotedPost && <QuotedHaikuCard post={quotedPost} />}

        <div className="space-y-4">
          <InputField value={line1} onChange={(e) => setLine1(e.target.value)} maxLength={5} placeholder="五" />
          <InputField value={line2} onChange={(e) => setLine2(e.target.value)} maxLength={7} placeholder="七" />
          <InputField value={line3} onChange={(e) => setLine3(e.target.value)} maxLength={5} placeholder="五" />
        </div>
        
        {/* Image Upload Section */}
        <div className="border-t border-slate-200 pt-6">
            <h3 className="text-md font-bold text-slate-700 mb-4">画像を添付する (任意)</h3>
            {imagePreview ? (
                <div className="relative group">
                    <img src={imagePreview} alt="プレビュー" className="w-full max-h-80 object-contain rounded-lg bg-slate-100 shadow-inner" />
                    <button 
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-white transition-opacity"
                        aria-label="画像を削除"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            ) : (
                <div>
                    <label htmlFor="image-upload" className="cursor-pointer w-full bg-white border-2 border-dashed border-slate-300 hover:border-teal-400 text-slate-500 hover:text-teal-600 font-semibold py-8 px-4 rounded-lg hover:shadow-sm transition-all flex flex-col items-center justify-center text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span>クリックして画像を選択</span>
                    </label>
                    <input
                        id="image-upload"
                        type="file"
                        accept="image/png, image/jpeg, image/gif"
                        onChange={handleImageChange}
                        className="hidden"
                        ref={fileInputRef}
                    />
                </div>
            )}
        </div>
        
        {isAiGenerated && (
            <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-lg p-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                この俳句はAIによって生成されました。
            </div>
        )}

        <button
          type="submit"
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          投稿する
        </button>
      </form>
    </div>
  );
};

export default NewPostPage;