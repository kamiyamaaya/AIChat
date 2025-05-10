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
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-6 sm:py-12 font-sans">
      <div className="w-full max-w-2xl">
        {/* ヘッダー（タイトル＋言語切替） */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl sm:text-3xl font-bold text-blue-800">AIチャットくん 🤖</h1>
          <button
            className="text-xs sm:text-sm text-gray-600 border px-2 sm:px-3 py-1 rounded hover:bg-gray-100 transition"
            onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
          >
            {lang === 'ja' ? '英語に切り替え' : 'Switch to Japanese'}
          </button>
        </div>

        {/* チャット表示エリア（バブル形式） */}
        <div className="h-[400px] sm:h-[500px] overflow-y-auto border rounded-lg p-4 bg-gray-50 space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-gray-400 text-center">
              ({t('メッセージはまだありません', 'No messages yet')})
            </p>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-xl px-4 py-2 max-w-[80%] text-sm whitespace-pre-wrap shadow ${msg.role === 'user' ? 'bg-blue-100 text-gray-800' : 'bg-gray-200 text-gray-800'} transition-all`}
                >
                  <span className="block font-semibold mb-1">
                    {msg.role === 'user' ? t('ユーザー', 'User') : t('AI', 'AI')}：
                  </span>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {/* ローディング中の表示（スピナー） */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-400 italic">
              <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400"></span>
              {t('考え中...', 'Thinking...')}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 入力エリア＋送信ボタン */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <textarea
            className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => window.scrollTo({ top: 0 })}
            placeholder={t(
              '質問を入力してください（Enter で送信 / Shift+Enter で改行）',
              'Enter your question (Enter to send / Shift+Enter for new line)'
            )}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition disabled:opacity-50"
          >
            {t('送信', 'Send')}
          </button>
        </div>

        {/* 履歴クリアボタン */}
        <div className="mt-3 text-right">
          <button
            className="text-xs sm:text-sm text-gray-600 hover:underline"
            onClick={() => setMessages([])}
          >
            {t('履歴をクリア', 'Clear history')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
