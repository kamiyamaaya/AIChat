import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './index.css';

// システムプロンプト：AIの基本的な振る舞いを指定
const systemRole = "あなたは親切で丁寧なAIアシスタントです。";

function App() {
  // 入力欄の状態
  const [input, setInput] = useState('');
  // メッセージ履歴（ユーザーとAI両方）
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  // ローディング中フラグ
  const [loading, setLoading] = useState(false);
  // 言語設定（日本語 or 英語）
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  // メッセージ最下部へのスクロール参照
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 多言語対応：日本語と英語を切り替える
  const t = (jp: string, en: string) => (lang === 'ja' ? jp : en);

  // メッセージ送信処理
  const handleSend = async () => {
    if (!input.trim()) return;

    // ユーザーの新しい入力を履歴に追加
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // OpenAI APIへリクエスト
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

      // 応答を履歴に追加
      const reply = res.data.choices[0].message.content;
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      // エラー時の応答
      setMessages([...newMessages, { role: 'assistant', content: 'エラーが発生しました。もう一度試してください。' }]);
    } finally {
      setLoading(false);
    }
  };

  // Enterで送信 / Shift+Enterで改行
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // メッセージ更新時に最下部にスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 pt-20 pb-32 font-sans">
      {/* 中央コンテンツエリア（拡大倍率1.5） */}
      <div className="w-full max-w-2xl scale-[1.5] origin-top text-[90%]">
        {/* ヘッダーと言語切り替え */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-800">
            AIチャットくん 🤖
          </h1>
          <button
            className="text-sm text-gray-600 border px-3 py-1 rounded hover:bg-gray-100"
            onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
          >
            {lang === 'ja' ? '英語に切り替え' : 'Switch to Japanese'}
          </button>
        </div>

        {/* チャット表示エリア */}
        <div className="border rounded p-4 min-h-[200px] bg-gray-50">
          {messages.length === 0 ? (
            // 初期メッセージ
            <p className="text-sm text-gray-400">
              ({t('メッセージはまだありません', 'No messages yet')})
            </p>
          ) : (
            // メッセージ一覧を表示
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
          {/* ローディング中表示 */}
          {loading && <p className="text-sm text-gray-400 italic">{t('考え中...', 'Thinking...')}</p>}
          <div ref={bottomRef} />
        </div>

        {/* 入力フォーム */}
        <div className="mt-4 flex gap-2">
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t(
              '質問を入力してください（Enter で送信 / Shift+Enter で改行）',
              'Enter your question (Enter to send / Shift+Enter for new line)'
            )}
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