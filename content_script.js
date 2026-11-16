(() => {
  'use strict';

  const BUTTON_ID = 'custom-sub-btn';
  const SUBSCRIPTIONS_URL = 'https://www.youtube.com/feed/subscriptions';

  let observer = null;
  let observedTarget = null;
  let isScheduled = false;

  /**
   * 拡張機能のコンテキストが有効か確認する
   * （拡張機能リロード後の古いタブでのエラーを防ぐ）
   */
  function isExtensionContextValid() {
    return Boolean(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id);
  }

  /**
   * 画像が読み込めなかった場合のフォールバック用SVGアイコンを作成する
   */
  function createFallbackSvg() {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute(
      'd',
      'M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z'
    );
    path.setAttribute('fill', 'currentColor');
    svg.appendChild(path);
    return svg;
  }

  /**
   * 登録チャンネルボタンの要素を作成する
   */
  function createSubscriptionButton() {
    const link = document.createElement('a');
    link.id = BUTTON_ID;
    link.href = SUBSCRIPTIONS_URL;
    link.title = '登録チャンネル';
    link.setAttribute('aria-label', '登録チャンネル');

    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('images/user_icon.png');
    icon.alt = '登録チャンネル';

    // 画像が未配置または読み込み失敗時はSVGアイコンへフォールバック
    icon.addEventListener('error', () => {
      if (icon.parentNode === link) {
        link.replaceChild(createFallbackSvg(), icon);
      }
    });

    link.appendChild(icon);
    return link;
  }

  /**
   * ヘッダー内のボタン挿入先を取得する
   */
  function getTargetContainer() {
    return (
      document.querySelector('ytd-masthead #end #buttons') ||
      document.querySelector('ytd-masthead #end')
    );
  }

  /**
   * ボタンが未挿入であればヘッダーに追加する
   */
  function ensureSubscriptionButton() {
    if (!isExtensionContextValid()) {
      if (observer) observer.disconnect();
      return;
    }

    if (document.getElementById(BUTTON_ID)) {
      retargetObserverToMasthead();
      return;
    }

    const container = getTargetContainer();
    if (!container) return;

    const btn = createSubscriptionButton();
    container.prepend(btn);
    retargetObserverToMasthead();
  }

  /**
   * 監視負荷を抑えるため、ytd-masthead が見つかれば監視対象をヘッダーのみに絞る
   */
  function retargetObserverToMasthead() {
    if (!observer) return;
    const masthead = document.querySelector('ytd-masthead');
    if (masthead && observedTarget !== masthead) {
      observer.disconnect();
      observer.observe(masthead, { childList: true, subtree: true });
      observedTarget = masthead;
    }
  }

  /**
   * DOM変化時の再チェックをアニメーションフレーム単位に間引く
   */
  function scheduleCheck() {
    if (isScheduled) return;
    isScheduled = true;
    requestAnimationFrame(() => {
      isScheduled = false;
      ensureSubscriptionButton();
    });
  }

  function init() {
    if (!isExtensionContextValid()) return;

    observer = new MutationObserver(scheduleCheck);

    const masthead = document.querySelector('ytd-masthead');
    const initialTarget = masthead || document.body;
    if (initialTarget) {
      observer.observe(initialTarget, { childList: true, subtree: true });
      observedTarget = initialTarget;
    }

    // YouTubeのSPA画面遷移完了イベントにも対応
    window.addEventListener('yt-navigate-finish', scheduleCheck);

    ensureSubscriptionButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
