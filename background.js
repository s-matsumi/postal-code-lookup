// 拡張機能をインストール時に実行
chrome.runtime.onInstalled.addListener(function () {
  // 右クリックメニューの項目を作成
  chrome.contextMenus.create({
    id: "lookup_postal_code",
    title: "郵便番号を逆引き",
    contexts: ["selection"],
  });
});

// 右クリックメニュー選択時に実行
chrome.contextMenus.onClicked.addListener((info, tab) => {
  // どの項目が選択されたのか判定
  if (info.menuItemId === "lookup_postal_code") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        (async () => {
          // 選択範囲の座標を取得
          const selection = document.getSelection();
          const range = selection.getRangeAt(0);
          const clientRect = range.getBoundingClientRect();

          // すでに吹き出しが存在する場合、吹き出しを削除
          const oldballoon = document.getElementById(
            "postal-code-lookup-balloon"
          );
          oldballoon?.remove();

          // 吹き出しを作成
          const balloon = document.createElement("div");
          // あらかじめ挿入してあるスタイルのIDを指定
          balloon.id = "postal-code-lookup-balloon";
          // 吹き出しの座標を選択範囲の直下に設定
          balloon.style.left = `${window.scrollX + clientRect.x}px`;
          balloon.style.top = `${
            window.scrollY + clientRect.y + clientRect.height
          }px`;

          // 吹き出しの閉じるボタンを作成
          const button = document.createElement("button");
          button.className = "postal-code-lookup-balloon-button";
          button.textContent = "x";
          // あらかじめ挿入してある関数を指定
          button.onclick = postalCodeLookupCloseBalloon;
          balloon.appendChild(button);

          // 結果表示用のdivを作成
          const content = document.createElement("div");
          content.className = "postal-code-lookup-balloon-content";
          balloon.appendChild(content);

          // ZIPCODA APIを実行
          // https://zipcoda.net/doc
          const address = selection.toString();
          const params = new URLSearchParams({ address });
          const res = await fetch(`https://zipcoda.net/api?${params}`, {
            method: "GET",
          });
          if (res.ok) {
            // 結果を吹き出しに追加
            const data = await res.json();
            for (const item of data.items) {
              const zip1 = item.zipcode.substring(0, 3);
              const zip2 = item.zipcode.substring(3);
              const address = item.address;
              const p = document.createElement("p");
              p.className = "postal-code-lookup-balloon-p";
              p.textContent = `${zip1}-${zip2}: ${address}`;
              content.appendChild(p);
            }
          } else {
            // エラーメッセージを吹き出しに追加
            const data = await res.json();
            console.error("postal-code-lookupエラー", data);
            const p = document.createElement("p");
            p.className = "postal-code-lookup-balloon-p";
            p.textContent = data.message;
            content.appendChild(p);
          }

          // 吹き出しをdomに追加
          document.body.appendChild(balloon);
        })();
      },
    });
  }
});
