'use strict';
const $=id=>document.getElementById(id), C=window.CATALOG, R=window.ResourceCore;
let state={category:'science',school:'',grades:[],subjects:[],work:'',query:''};
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function chips(id,values,selected,multiple,onChange){
  $(id).textContent='';values.forEach(v=>{const label=el('label',undefined,'chip'),input=el('input');input.type=multiple?'checkbox':'radio';input.name=id;input.value=v.value??v;input.checked=selected.includes(input.value);input.addEventListener('change',()=>onChange(input.value,input.checked));label.append(input,el('span',v.label??v));$(id).append(label);});
}
function subjectOptions(){const grades=state.grades.length?state.grades:C.grades.filter(g=>!state.school||g[0]===state.school);return [...new Set(grades.flatMap(g=>g[0]==='중'?['과학'+g[1]]:C.high))];}
function filters(){
 chips('school',[{value:'',label:'전체'},{value:'중',label:'중학교'},{value:'고',label:'고등학교'}],[state.school],false,v=>{state.school=v;state.grades=state.grades.filter(g=>!v||g[0]===v);state.subjects=state.subjects.filter(s=>subjectOptions().includes(s));filters();render();});
 chips('grades',C.grades.filter(g=>!state.school||g[0]===state.school),state.grades,true,(v,on)=>{state.grades=on?[...state.grades,v]:state.grades.filter(x=>x!==v);state.subjects=state.subjects.filter(s=>subjectOptions().includes(s));filters();render();});
 chips('subjects',subjectOptions(),state.subjects,true,(v,on)=>{state.subjects=on?[...state.subjects,v]:state.subjects.filter(x=>x!==v);render();});
 chips('work',[{value:'',label:'전체'},...C.work],[state.work],false,v=>{state.work=v;render();});
}
function render(){
 const rows=window.SITE_DATA.filter(r=>R.matches(r,state));$('count').textContent=rows.length+'개의 자료';$('cards').textContent='';
 if(!rows.length){$('cards').append(el('p','조건에 맞는 자료가 없습니다. 선택을 초기화하거나 다른 검색어를 입력해 주세요.','empty'));return;}
 rows.forEach(r=>{const card=el('article',undefined,'card'),meta=el('div',undefined,'meta');[r.type,...new Set(r.category==='science'?r.targets.map(t=>t.grade+' · '+t.subject):[r.workCategory])].forEach(t=>meta.append(el('span',t,'tag')));card.append(meta,el('h2',r.title),el('p',r.description,'description'));if(r.author)card.append(el('p','제작 '+r.author,'small muted'));const links=el('div',undefined,'links');[['url','자료 열기','button primary small'],['download','다운로드 / 파일 보기','button small'],['guide','사용 안내','button small']].forEach(([key,label,cls])=>{const url=R.safeURL(r[key]);if(url){const a=el('a',label,cls);a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);}});card.append(links,el('div','자료 ID: '+r.id,'id'));$('cards').append(card);});
}
function route(){const cat=location.hash.slice(1);const active=['science','work'].includes(cat);$('home').hidden=active;$('browse').hidden=!active;if(!active)return;state.category=cat;$('heading').textContent=cat==='science'?'과학수업관련자료':'교사 업무 경감자료';$('scienceFilters').hidden=cat!=='science';$('workFilters').hidden=cat!=='work';filters();render();$('heading').focus();}
document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>location.hash=b.dataset.category);
$('search').oninput=e=>{state.query=e.target.value.trim();render();};$('reset').onclick=()=>{state={category:state.category,school:'',grades:[],subjects:[],work:'',query:''};$('search').value='';filters();render();};
[['submit','submitForm'],['edit','editForm']].forEach(([id,key])=>{const a=$(id),url=R.safeURL(window.SITE_CONFIG[key]);if(/^https:\/\//.test(url)){a.href=url;a.target='_blank';a.rel='noopener noreferrer';}else{a.setAttribute('aria-disabled','true');a.title='설문지 연결 준비 중';a.onclick=()=>alert('설문지 연결 준비 중입니다.');}});
addEventListener('hashchange',route);route();
