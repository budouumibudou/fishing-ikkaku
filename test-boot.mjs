// An unlisted test entry, not authentication. The public entry still uses boot.mjs.
const $=id=>document.getElementById(id);
$('maintenance-reload').onclick=()=>{const url=new URL(location.href);url.searchParams.set('update',Date.now().toString());location.replace(url);};
try{
 await import('./game-test.mjs?v=0.4.1-test1');
 $('maintenance-screen').hidden=true;
 document.documentElement.classList.add('game-ready');
}catch(error){
 console.error('Preview load failed',error);
 $('maintenance-title').textContent='テスト版を読み込めませんでした';
 $('maintenance-message').textContent='追加の3ファイルが同じ場所にあるか確認し、反映後に再読み込みしてください。';
}
