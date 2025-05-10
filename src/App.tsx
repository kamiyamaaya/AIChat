import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './index.css';

// システムの初期プロンプト（AIの役割を指定）
const systemRole = "あなたは親切で丁寧なAIアシスタントです。";

function App() {
  // 入力されたテキスト
  const [input, setInput] = useState('');
  // チャット履歴
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  // ローディング状態
  const [loading, setLoading] = useState(false);
  // 言語設定（日本語 or 英語）
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  // 自動スクロール用の参照
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 翻訳関数
  const t = (jp: string, en: string) => (lang === 'ja' ? jp : en);

  // メッセージ送信処理
  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemRole },
            ...newMessages,
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const reply = res.data.choices[0].message.content;
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      setMessages([...newMessages, { role: 'assistant', content: 'エラーが発生しました。もう一度試してください。' }]);
    } finally {
      setLoading(false);
    }
  };

  // Enterキー送信対応
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10 sm:py-20 font-sans">
      <div className="w-full max-w-2xl text-[90%]">
        {/* タイトルと切替ボタン */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">
            AIチャットくん 🤖
          </h1>
          <button
            className="text-xs sm:text-sm text-gray-600 border px-2 sm:px-3 py-1 rounded hover:bg-gray-100"
            onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
          >
            {lang === 'ja' ? '英語に切り替え' : 'Switch to Japanese'}
          </button>
        </div>

        {/* チャット表示エリア */}
        <div className="border rounded p-3 sm:p-4 min-h-[200px] bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-sm text-gray-400">
              ({t('メッセージはまだありません', 'No messages yet')})
            </p>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`mb-3 ${msg.role === 'assistant' ? 'border-b pb-2' : ''}`}>
                <p
                  className={`text-sm mt-1 ${msg.role === 'user' ? 'text-right text-gray-700' : 'text-left text-gray-800'}`}
                >
                  <span className="font-semibold">{msg.role === 'user' ? t('ユーザー', 'User') : t('AI', 'AI')}：</span>
                  {msg.content}
                </p>
              </div>
            ))
          )}
          {/* 読み込み中表示 */}
          {loading && <p className="text-sm text-gray-400 italic">{t('考え中...', 'Thinking...')}</p>}
          <div ref={bottomRef} />
        </div>

        {/* 入力と送信ボタン */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('質問を入力してください（Enter で送信 / Shift+Enter で改行）', 'Enter your question (Enter to send / Shift+Enter for new line)')}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="border px-4 py-2 rounded text-sm hover:bg-gray-100"
          >
            {t('送信', 'Send')}
          </button>
        </div>

        {/* 履歴クリアボタン */}
        <button
          className="mt-2 text-sm text-gray-600 hover:underline"
          onClick={() => setMessages([])}
        >
          {t('履歴をクリア', 'Clear history')}
        </button>
      </div>
    </div>
  );
}

export default App;