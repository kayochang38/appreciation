const $ = (sel, root=document)=>root.querySelector(sel);
const $$ = (sel, root=document)=>Array.from(root.querySelectorAll(sel));

/* === 日付初期値 === */
window.addEventListener("DOMContentLoaded",()=>{
  const today = new Date().toISOString().split("T")[0];
  $("#date").value = today;
  loadNotes();
});

/* === 必須項目チェック === */
const required = ["#date","#title","#mainThought","#block-1 .interpret","#question"];
required.forEach(id=>{
  const base = id.split(" ")[0];
  const el = $(base);
  if(el) el.addEventListener("input", checkRequired);
});
function checkRequired(){
  const filled = required.every(sel=>{
    const base = sel.split(" ")[0];
    const el = $(base);
    return el && el.value.trim().length>0;
  });
  $("#saveBtn").disabled = !filled;
}

/* === 保存 === */
$("#saveBtn").addEventListener("click",()=>{
  const note = collectNote();
  if(!note) return;

  const notes = JSON.parse(localStorage.getItem("kansho_notes")||"[]");
  const idx = notes.findIndex(n=>n.title===note.title && n.date===note.date);

  if(idx>=0) notes[idx] = note;
  else notes.push(note);

  localStorage.setItem("kansho_notes",JSON.stringify(notes));
  copyToClipboard(note);
  toast("保存＆コピーしました📋");
  loadNotes();
});

/* === ノート収集 === */
function collectNote(){
  const date=$("#date").value.trim();
  const title=$("#title").value.trim();
  const impression=$("#mainThought").value.trim();
  const question=$("#question").value.trim();
  if(!date||!title||!impression||!question) return null;

  const blocks=$$(".card").map(card=>{
    const tech=$(".tech",card).value;
    const interpret=$(".interpret",card).value.trim();
    const feeling=$(".feeling",card).value.trim();
    return {tech,interpret,feeling};
  }).filter(b=>b.interpret||b.feeling);

  return {date,title,impression,blocks,question,created_at:new Date().toISOString()};
}

/* === コピー === */
function copyToClipboard(note){
  let txt=`【鑑賞ノート】\n日付：${note.date}\nタイトル：${note.title}\n\n感想：\n${note.impression}\n\n`;
  note.blocks.forEach((b,i)=>{
    txt+=`［考察${i+1}：${b.tech}］\n解釈：${b.interpret}\n感想：${b.feeling}\n\n`;
  });
  txt+=`質問：\n${note.question}\n`;
  navigator.clipboard.writeText(txt).catch(console.error);
}

/* === 履歴表示 === */
function loadNotes(){
  const notes = JSON.parse(localStorage.getItem("kansho_notes")||"[]");
  renderNotes(notes);
}

function renderNotes(notes){
  const list=$("#noteList");
  list.innerHTML="";
  notes.sort((a,b)=>b.date.localeCompare(a.date));
  notes.forEach((n,i)=>{
    const li=document.createElement("li");
    li.innerHTML=`
      <strong>${n.date}</strong>：${n.title}
      <button class="download-btn" title="テキストを保存" data-index="${i}">📄</button>
      <button class="delete-btn" title="削除" data-index="${i}">🗑</button>
      <details><summary>開く</summary><pre>${formatNoteText(n)}</pre></details>
    `;
    list.appendChild(li);
  });

  // 削除
  $$(".delete-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const idx=+btn.dataset.index;
      const notes=JSON.parse(localStorage.getItem("kansho_notes")||"[]");
      notes.splice(idx,1);
      localStorage.setItem("kansho_notes",JSON.stringify(notes));
      toast("削除しました🗑");
      loadNotes();
    });
  });

  // ダウンロード
  $$(".download-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const idx=+btn.dataset.index;
      const notes=JSON.parse(localStorage.getItem("kansho_notes")||"[]");
      const note=notes[idx];
      const text=formatNoteText(note);
      const blob=new Blob([text],{type:"text/plain"});
      const a=document.createElement("a");
      a.href=URL.createObjectURL(blob);
      const safeTitle=note.title.replace(/[\\\/:*?"<>|]/g,"_");
      a.download=`${note.date}_${safeTitle}.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast("テキストファイルを保存しました📄");
    });
  });
}

function formatNoteText(n){
  let txt=`日付：${n.date}\nタイトル：${n.title}\n\n感想：\n${n.impression}\n\n`;
  n.blocks.forEach((b,i)=>{
    txt+=`［考察${i+1}：${b.tech}］\n解釈：${b.interpret}\n感想：${b.feeling}\n\n`;
  });
  txt+=`質問：\n${n.question}\n`;
  return txt;
}

/* === 検索機能 === */
$("#searchInput").addEventListener("input",(e)=>{
  const keyword=e.target.value.toLowerCase();
  const notes=JSON.parse(localStorage.getItem("kansho_notes")||"[]");
  const filtered=notes.filter(n=>
    [n.title,n.impression,n.question,...(n.blocks.map(b=>b.interpret+b.feeling))]
      .join(" ").toLowerCase().includes(keyword)
  );
  renderNotes(filtered);
});

/* === 全クリア === */
$("#clearBtn").addEventListener("click",()=>{
  $("#title").value="";
  $("#mainThought").value="";
  $("#question").value="";
  $$(".card").forEach(card=>{
    $(".interpret",card).value="";
    $(".feeling",card).value="";
    $(".tech",card).selectedIndex=0;
  });
  toast("入力内容をクリアしました🧹");
  checkRequired();
});

/* === トースト === */
function toast(msg){
  const el=$("#toast");
  el.textContent=msg;
  el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),1800);
}
