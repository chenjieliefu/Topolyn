(() => {
  const root=document.documentElement;
  const applyLanguage=language=>{
    const lang=language==='en'?'en':'zh';
    root.lang=lang==='zh'?'zh-CN':'en';
    document.querySelectorAll('[data-zh][data-en]').forEach(node=>{node.textContent=node.dataset[lang]});
    document.querySelectorAll('[data-zh-html][data-en-html]').forEach(node=>{node.innerHTML=node.dataset[`${lang}Html`]});
    document.querySelectorAll('[data-placeholder-zh][data-placeholder-en]').forEach(node=>{node.placeholder=node.dataset[`placeholder${lang==='zh'?'Zh':'En'}`]});
    document.querySelectorAll('.language-toggle').forEach(button=>{button.textContent=lang==='zh'?'EN':'中';button.setAttribute('aria-label',lang==='zh'?'Switch to English':'切换为中文')});
    localStorage.setItem('topolyn-language',lang);
    window.dispatchEvent(new CustomEvent('topolyn:language',{detail:{language:lang}}));
  };
  document.body.classList.remove('dark');
  localStorage.removeItem('topolyn-theme');
  document.addEventListener('click',event=>{if(event.target.closest('.language-toggle'))applyLanguage(root.lang.startsWith('zh')?'en':'zh')});
  applyLanguage(localStorage.getItem('topolyn-language')||'zh');
  window.TopolynSite={applyLanguage,get language(){return root.lang.startsWith('zh')?'zh':'en'}};
})();
