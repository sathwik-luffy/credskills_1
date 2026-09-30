const examples={Python:"I understand Python basics, but I don't understand inheritance, parent and child classes, super(), and method overriding.",React:"I can build React components but I don't understand state updates, useEffect dependencies and why components rerender.",JavaScript:"I struggle with async/await, promises and why my API calls sometimes return undefined.","UI/UX Design":"I struggle with spacing, hierarchy and creating a consistent design system.","Data Science":"I struggle to choose the right visualization and interpret correlations.","Machine Learning":"I don't understand why my model overfits even though the training accuracy is very high.",Java:"I understand Java syntax but I get confused about inheritance, interfaces and polymorphism."};
const $=s=>document.querySelector(s);
function initials(name){return (name||'Teacher').split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase()}
function renderTeachers(list){
 return (list||[]).map(p=>`<article class="teacher"><span class="match">${p.match||90}% MATCH</span><div class="avatar">${initials(p.name)}</div><h3>${p.name}</h3><div class="specialty">${(p.skills||[]).slice(0,4).join(' • ')}</div><div class="stats"><div><b>★ 4.9</b><small>Rating</small></div><div><b>${p.skillScore||90}%</b><small>Skill score</small></div><div><b>${p.teachingScore||90}%</b><small>Teaching</small></div></div><p class="muted">${p.bio||'AI-ranked for the detected topic, level and learning goal.'}</p><button onclick="startExchange('${p.id||''}')">Start Skill Exchange</button></article>`).join('');
}
function startExchange(id){try{localStorage.setItem('credskill_matched_teacher',id||'arjun')}catch(e){} location.href='session.html?session=python-inheritance-arjun';}
async function runAnalysis(){
 const skill=$("#skill").value, problem=$("#problem").value.trim(); if(!problem){$("#problem").focus();return}
 const btn=$("#analyze"); const old=btn.textContent; btn.disabled=true; btn.textContent='✦ AI is diagnosing your problem…';
 try{
  const d=await CredSkillAI.analyze(skill,problem);
  $("#detected").textContent=d.topic; $("#level").textContent=d.level; $("#score").textContent=(d.score||0)+"%"; $("#bar").style.width=(d.score||0)+"%";
  $("#tags").innerHTML=(d.tags||[]).map(x=>`<span>${x}</span>`).join('');
  $("#path").innerHTML=(d.path||[]).map((x,i)=>(i?`<b>→</b>`:'')+`<span>${x}</span>`).join('');
  $("#result").classList.remove('hidden');
  $("#aiSourceBadge").textContent=d.mode==='gemini'?'✦ Gemini · Live diagnosis':'✦ Local fallback · add Gemini key';
  $("#teachers").innerHTML=renderTeachers(d.matches);
  $("#result").scrollIntoView({behavior:'smooth'});
 }catch(e){alert('AI analysis could not run. '+e.message)}
 finally{btn.disabled=false;btn.textContent=old}
}
if($("#analyze")){
 $("#analyze").onclick=runAnalysis;
 $("#example").onclick=()=>{$("#problem").value=examples[$("#skill").value]||examples.Python};
 document.querySelectorAll('.skills button').forEach(b=>b.onclick=()=>{$("#skill").value=b.textContent;$("#problem").focus()});
}
