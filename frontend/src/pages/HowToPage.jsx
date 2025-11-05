import React, { useState, useRef } from 'react';
import '../styles/HowToPage.css';

const HowToPage = () => {
  const [openSection, setOpenSection] = useState(null);
  const sectionRefs = useRef({});

  const toggleSection = (section) => {
    const isOpening = openSection !== section;
    setOpenSection(openSection === section ? null : section);
    
    // セクションを開く場合のみスクロール
    if (isOpening) {
      setTimeout(() => {
        sectionRefs.current[section]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }, 100); // アコーディオンのアニメーション後にスクロール
    }
  };

  const sections = [
    {
      id: 'usage',
      title: '📖 操作説明',
      items: [
        {
          question: '基本的な使い方',
          answer: (
            <>
              <ol>
                <li><strong>テンプレートを選択</strong>：スカウトメッセージ生成画面で、使用したいテンプレートを選びます。</li>
                <li><strong>学生のプロフィール情報を添付</strong>：
                  <ul>
                    <li><strong>優先情報</strong>：自己PR、エピソード、研究内容などを優先的に添付してください。</li>
                    <li><strong>代替情報</strong>：自己PR等がない場合は、資格や適性検査の結果など、他の利用可能な情報を添付してください。</li>
                  </ul>
                </li>
                <li><strong>コメントを生成</strong>：「コメントを生成」ボタンをクリックすると、AIがスカウトメッセージを自動生成します。</li>
                <li><strong>整合性の確認</strong>：生成されたコメントが、選択したスカウトメッセージテンプレートとの整合性があるか必ず確認してください。</li>
                <li><strong>必要に応じて調整</strong>：内容によっては、適宜再生成を行うか、コメントを手動で修正してください。</li>
                <li><strong>ダウンロード</strong>：完成したスカウトメッセージをテキストファイルとしてダウンロードできます。</li>
              </ol>
            </>
          )
        },
        {
          question: '職業適性管理（管理者・責任者のみ）',
          answer: (
            <>
              <p>職業適性管理ページでは、スカウトメッセージで参照する職業適性情報の登録・編集・削除ができます。</p>
              <ul>
                <li><strong>新規登録</strong>：「新規職種を追加」ボタンから職業名と説明を入力します。</li>
                <li><strong>編集</strong>：既存の職業適性情報の「編集」ボタンから内容を変更できます。</li>
                <li><strong>削除</strong>：不要な情報は「削除」ボタンで削除できます（生成履歴に紐づいている場合は削除できません）。</li>
              </ul>
            </>
          )
        },
        {
          question: '出力ルール管理（管理者・責任者のみ）',
          answer: (
            <>
              <p>出力ルール管理ページでは、AIがスカウトメッセージを生成する際のルール（トーン、形式など）を設定できます。</p>
              <ul>
                <li><strong>新規登録</strong>：「新規出力ルールを追加」ボタンからルール名と詳細を入力します。</li>
                <li><strong>編集</strong>：既存のルールの「編集」ボタンから内容を変更できます。</li>
                <li><strong>削除</strong>：不要なルールは「削除」ボタンで削除できます（生成履歴に紐づいている場合は削除できません）。</li>
              </ul>
            </>
          )
        },
        {
          question: 'ユーザー管理（管理者のみ）',
          answer: (
            <>
              <p>ユーザー管理ページでは、システムを利用するユーザーの登録・権限変更・削除ができます。</p>
              <ul>
                <li><strong>新規登録</strong>：「新規ユーザーを追加」ボタンからユーザー情報を入力します。</li>
                <li><strong>権限の種類</strong>：
                  <ul>
                    <li><strong>一般</strong>：募集要項の生成と履歴閲覧のみ</li>
                    <li><strong>責任者</strong>：一般権限 + 職種・出力ルールの管理</li>
                    <li><strong>管理者</strong>：全機能の利用が可能</li>
                  </ul>
                </li>
                <li><strong>編集</strong>：ユーザーの情報や権限を変更できます。</li>
                <li><strong>削除</strong>：不要なユーザーは削除できます（生成履歴は残ります）。</li>
              </ul>
            </>
          )
        },
        {
          question: '生成履歴の確認',
          answer: (
            <>
              <p>マイページでは、過去に生成したスカウトメッセージの履歴を確認できます。</p>
              <ul>
                <li><strong>一覧表示</strong>：生成日時、テンプレート、職業適性、出力ルールが表示されます。</li>
                <li><strong>再ダウンロード</strong>：過去に生成したメッセージを再度ダウンロードできます。</li>
                <li><strong>削除</strong>：不要な履歴は削除ボタンで削除できます。</li>
              </ul>
            </>
          )
        }
      ]
    },
    {
      id: 'faq',
      title: '❓ よくある質問',
      items: [
        {
          question: '生成されたメッセージが期待と違う場合はどうすればいいですか？',
          answer: (
            <>
              <p>以下の方法をお試しください：</p>
              <ul>
                <li><strong>出力ルールを変更</strong>：別の出力ルールを選択して再生成してみてください。</li>
                <li><strong>プロフィール情報を見直し</strong>：添付した学生のプロフィール情報が適切か、必要な情報が含まれているか確認してください。</li>
                <li><strong>職業適性を見直し</strong>：職業適性の説明文が適切か確認してください（管理者・責任者の場合）。</li>
                <li><strong>手動編集</strong>：生成されたメッセージをコピーして、必要な部分を編集してください。</li>
                <li><strong>再生成</strong>：同じ条件で再度生成すると、異なる表現になる場合があります。</li>
                <li><strong>テンプレートとの整合性確認</strong>：生成されたコメントがテンプレートの意図と合っているか確認し、必要に応じて調整してください。</li>
              </ul>
            </>
          )
        },
        {
          question: 'パスワードを忘れた場合はどうすればいいですか？',
          answer: (
            <>
              <p>管理者にご連絡ください。管理者がユーザー管理画面からパスワードをリセットできます。</p>
            </>
          )
        },
        {
          question: 'セッションタイムアウトとは何ですか？',
          answer: (
            <>
              <p>セキュリティのため、一定時間操作がないと自動的にログアウトされます。</p>
              <ul>
                <li><strong>警告表示</strong>：タイムアウトの2分前に警告が表示されます。</li>
                <li><strong>セッション延長</strong>：警告画面で「セッションを延長」ボタンを押すと、ログイン状態を継続できます。</li>
                <li><strong>再ログイン</strong>：タイムアウト後は、再度ログインしてください。</li>
              </ul>
            </>
          )
        },
        {
          question: '生成したメッセージは保存されますか？',
          answer: (
            <>
              <p>はい、生成履歴としてシステムに保存されます。</p>
              <ul>
                <li>マイページからいつでも過去の生成内容を確認・ダウンロードできます。</li>
                <li>履歴は削除するまで保持されます。</li>
                <li>管理者は全ユーザーの生成履歴を確認できます（監査ログ機能）。</li>
              </ul>
            </>
          )
        },
        {
          question: '職業適性や出力ルールを削除するとどうなりますか？',
          answer: (
            <>
              <p>削除された職業適性や出力ルールは、過去の生成履歴では名前のみが表示されます。</p>
              <ul>
                <li>削除しても過去の生成履歴自体は残ります。</li>
                <li>ただし、削除されたデータの詳細情報は参照できなくなります。</li>
                <li>頻繁に使用するものや、履歴参照が必要なものは削除前に十分ご検討ください。</li>
              </ul>
            </>
          )
        },
        {
          question: '複数のユーザーで同時に利用できますか？',
          answer: (
            <>
              <p>はい、複数のユーザーが同時にシステムを利用できます。各ユーザーの操作は独立して処理されます。</p>
            </>
          )
        }
      ]
    },
    {
      id: 'notes',
      title: '⚠️ 利用上の注意点',
      items: [
        {
          question: 'AIが生成したメッセージの取り扱い',
          answer: (
            <>
              <ul>
                <li><strong>必ず内容を確認</strong>：AIが生成したメッセージは必ず人間が確認し、適切性を判断してください。</li>
                <li><strong>テンプレートとの整合性</strong>：生成されたコメントが選択したスカウトメッセージテンプレートと整合性があるか必ず確認してください。</li>
                <li><strong>学生情報の確認</strong>：添付したプロフィール情報が正確に反映されているか確認してください。</li>
                <li><strong>適切な表現</strong>：学生に対する敬意を持った表現になっているか、不適切な表現がないか確認してください。</li>
                <li><strong>再生成・修正</strong>：内容が期待と異なる場合は、適宜再生成やコメントの修正を行ってください。</li>
              </ul>
            </>
          )
        },
        {
          question: 'セキュリティとプライバシー',
          answer: (
            <>
              <ul>
                <li><strong>パスワード管理</strong>：パスワードは他人に教えず、定期的に変更してください。</li>
                <li><strong>ログアウト</strong>：作業終了時は必ずログアウトしてください。</li>
                <li><strong>共有端末</strong>：共有端末では使用後にブラウザのキャッシュをクリアしてください。</li>
                <li><strong>個人情報</strong>：生成された文章に個人情報が含まれる場合は、適切に管理してください。</li>
              </ul>
            </>
          )
        },
        {
          question: 'システムの適切な利用',
          answer: (
            <>
              <ul>
                <li><strong>用途</strong>：このシステムはスカウトメッセージ作成を支援するためのものです。用途外の利用は控えてください。</li>
                <li><strong>負荷</strong>：短時間に大量の生成を行うと、システムに負荷がかかります。計画的に利用してください。</li>
                <li><strong>バックアップ</strong>：重要なメッセージは、生成後すぐにダウンロードして保存してください。</li>
                <li><strong>学生情報の取り扱い</strong>：学生のプロフィール情報は個人情報です。適切に取り扱い、システム外での不必要な共有は避けてください。</li>
                <li><strong>サポート</strong>：システムに問題が発生した場合は、管理者に報告してください。</li>
              </ul>
            </>
          )
        },
        {
          question: 'データの保持と削除',
          answer: (
            <>
              <ul>
                <li><strong>生成履歴</strong>：生成したスカウトメッセージの履歴はシステムに保存されます。</li>
                <li><strong>監査ログ</strong>：管理者は監査のため、すべての操作履歴を確認できます。</li>
                <li><strong>履歴削除</strong>：不要な履歴は各自で削除できますが、監査ログには記録が残ります。</li>
                <li><strong>アカウント削除</strong>：ユーザーアカウントが削除されても、過去の生成履歴はシステムに残ります。</li>
              </ul>
            </>
          )
        }
      ]
    }
  ];

  return (
    <div className="howto-page">
      <div className="howto-container">
        <h1 className="howto-title">使い方ガイド</h1>
        <p className="howto-description">
          Athena Scout スカウトメッセージ生成ツールの使い方、よくある質問、利用上の注意点をご確認いただけます。
        </p>

        <div className="howto-sections">
          {sections.map((section) => (
            <div 
              key={section.id} 
              className="howto-section"
              ref={el => sectionRefs.current[section.id] = el}
            >
              <button
                className={`section-header ${openSection === section.id ? 'active' : ''}`}
                onClick={() => toggleSection(section.id)}
              >
                <span className="section-title">{section.title}</span>
                <span className="section-toggle">
                  {openSection === section.id ? '−' : '+'}
                </span>
              </button>

              {openSection === section.id && (
                <div className="section-content">
                  {section.items.map((item, index) => (
                    <div key={index} className="faq-item">
                      <h3 className="faq-question">{item.question}</h3>
                      <div className="faq-answer">{item.answer}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="howto-footer">
          <p>
            その他ご不明点がございましたら、システム管理者までお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
};

export default HowToPage;