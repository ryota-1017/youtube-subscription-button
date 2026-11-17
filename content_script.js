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
   * ヘッダー内のボタン挿入先コンテナを取得する
   */
  function getTargetContainer() {
    return (
      document.querySelector('ytd-masthead #end #buttons') ||
      document.querySelector('ytd-masthead #end')
    );
  }

  /**
   * コンテナ直下にある「マイアカウント」要素を取得する
   */
  function getAccountElement(container) {
    const avatarBtn = container.querySelector('#avatar-btn');
    if (!avatarBtn) return null;

    // container の直下の子要素まで親を辿る
    let el = avatarBtn;
    while (el && el.parentElement !== container) {
      el = el.parentElement;
    }
    return el;
  }

  /**
   * ボタンを「マイアカウント」の視覚的なすぐ左側に配置する
   */
  function placeButtonBeforeAccount(container, btn, accountEl) {
    const isRowReverse = getComputedStyle(container).flexDirection === 'row-reverse';
    const isAdjacent =
      accountEl.previousElementSibling === btn || accountEl.nextElementSibling === btn;

    // すでに隣接しており、視覚的にもマイアカウントの左側にある場合は何もしない
    if (isAdjacent) {
      const btnRect = btn.getBoundingClientRect();
      const accRect = accountEl.getBoundingClientRect();
      if (btnRect.width > 0 && accRect.width > 0 && btnRect.left < accRect.left) {
        return;
      }
    }

    const expectedPosition = isRowReverse ? 'afterend' : 'beforebegin';
    accountEl.insertAdjacentElement(expectedPosition, btn);

    // CSSのorder等で左右が逆転している場合の最終補正
    const btnRect = btn.getBoundingClientRect();
    const accRect = accountEl.getBoundingClientRect();
    if (btnRect.width > 0 && accRect.width > 0 && btnRect.left > accRect.left) {
      accountEl.insertAdjacentElement(isRowReverse ? 'beforebegin' : 'afterend', btn);
    }
  }

  /**
   * ボタンが未挿入、または位置がずれていればヘッダーのマイアカウント左側に配置する
   */
  function ensureSubscriptionButton() {
    if (!isExtensionContextValid()) {
      if (observer) observer.disconnect();
      return;
    }

    const container = getTargetContainer();
    if (!container) return;

    const accountEl = getAccountElement(container);
    let btn = document.getElementById(BUTTON_ID);

    if (!btn) {
      btn = createSubscriptionButton();
      if (accountEl) {
        placeButtonBeforeAccount(container, btn, accountEl);
      } else {
        container.prepend(btn);
      }
    } else if (accountEl) {
      // アカウントボタンが後から描画された場合でも正しい位置へ移動する
      placeButtonBeforeAccount(container, btn, accountEl);
    }

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
