(function (root) {
  'use strict';
  const C = root.CATALOG;
  function safeURL(value) {
    const s = String(value || '').trim();
    if (!s || /[\u0000-\u001f\u007f\\]/.test(s) || s.startsWith('//') || s.startsWith('#')) return '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return /^https?:\/\//i.test(s) ? s : '';
    if (s.startsWith('/') || s.split('/').includes('..')) return '';
    return s;
  }
  function split(s) { return String(s || '').split(/\s*[,;\n]\s*/).map(x=>x.trim()).filter(Boolean); }
  function targets(grades, subjects) {
    return grades.flatMap(grade => subjects.filter(subject => grade[0] === '중' ? subject === '과학'+grade[1] : C.high.includes(subject)).map(subject=>({grade,subject})));
  }
  function matches(item, filter) {
    if (item.category !== filter.category) return false;
    if (filter.query && ![item.title,item.description,item.author,...item.targets.map(t=>t.subject)].join(' ').toLowerCase().includes(filter.query.toLowerCase())) return false;
    if (item.category === 'work') return !filter.work || item.workCategory === filter.work;
    return item.targets.some(t=>(!filter.school || t.grade[0]===filter.school) && (!filter.grades.length || filter.grades.includes(t.grade)) && (!filter.subjects.length || filter.subjects.includes(t.subject)));
  }
  function validate(r) {
    const errors=[];
    if (!/^[a-zA-Z0-9_-]+$/.test(r.id||'')) errors.push('자료 ID는 영문·숫자·-·_만 사용하세요.');
    if (!['science','work'].includes(r.category)) errors.push('대분류를 선택하세요.');
    if (!String(r.title||'').trim()) errors.push('제목이 필요합니다.');
    if (!String(r.description||'').trim()) errors.push('설명이 필요합니다.');
    if (!C.types.includes(r.type)) errors.push('자료 유형을 선택하세요.');
    if (!r.url && !r.download) errors.push('실행 또는 다운로드 링크가 하나 이상 필요합니다.');
    ['url','download','guide'].forEach(k=>{if(r[k]&&!safeURL(r[k])) errors.push(k+' 링크를 확인하세요.');});
    if (r.category==='science' && (!r.targets.length || r.targets.some(t=>!C.grades.includes(t.grade) || !(t.grade[0]==='중' ? t.subject==='과학'+t.grade[1] : C.high.includes(t.subject))))) errors.push('유효한 학년·과목 조합이 필요합니다.');
    if (r.category==='work' && !C.work.includes(r.workCategory)) errors.push('업무 분류를 선택하세요.');
    return errors;
  }
  function publicItem(r) {
    // 허용한 항목만 복사하여 연락처·원본 전달 링크·내부 메모가 공개되지 않도록 합니다.
    return {id:r.id,category:r.category,title:r.title.trim(),description:r.description.trim(),targets:r.category==='science'?r.targets.map(t=>({grade:t.grade,subject:t.subject})):[],workCategory:r.category==='work'?r.workCategory:'',type:r.type,author:r.author||'',url:safeURL(r.url),download:safeURL(r.download),guide:safeURL(r.guide)};
  }
  function serialize(rows) {
    const ids=new Set();
    rows.forEach(r=>{ const errors=validate(r); if(ids.has(r.id)) errors.push('중복 ID'); ids.add(r.id); if(errors.length) throw Error(r.title+': '+errors.join(' ')); });
    return 'window.SITE_DATA = '+JSON.stringify(rows.map(publicItem),null,2).replace(/</g,'\\u003c')+';\n';
  }
  function parseData(text) {
    const s=text.trim().replace(/^window\.SITE_DATA\s*=\s*/,'').replace(/;\s*$/,'');
    const rows=JSON.parse(s);
    if (!Array.isArray(rows)) throw Error('자료 목록 배열이 아닙니다.');
    rows.forEach(r=>{ if(!Array.isArray(r.targets)) throw Error('학년·과목 정보가 없습니다.'); });
    return rows;
  }
  function csv(text) {
    text=text.replace(/^\uFEFF/,'');
    const rows=[]; let row=[],cell='',quoted=false;
    for(let i=0;i<text.length;i++) {
      const c=text[i];
      if(c==='"') { if(quoted&&text[i+1]==='"'){cell+='"';i++;} else quoted=!quoted; }
      else if(!quoted&&(c===','||c==='\n'||c==='\r')) {
        row.push(cell);cell='';
        if(c!==','){if(row.some(x=>x.length))rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}
      } else cell+=c;
    }
    if(quoted) throw Error('CSV 따옴표가 닫히지 않았습니다. 원본 CSV를 다시 다운로드하세요.');
    row.push(cell);if(row.some(x=>x.length))rows.push(row);
    if(!rows.length) throw Error('빈 CSV입니다.');
    const headers=rows.shift().map(s=>s.trim());
    if(new Set(headers).size!==headers.length) throw Error('CSV 질문 제목이 중복되었습니다.');
    return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])));
  }
  root.ResourceCore={safeURL,split,targets,matches,validate,publicItem,serialize,parseData,csv};
})(window);
