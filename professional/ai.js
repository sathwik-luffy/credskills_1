/* CredSkill local AI demo: deterministic, offline, no API key. */
window.CredSkillAI={
 analyze(skill,problem){
  const p=problem.toLowerCase();
  const maps={
   Python:{topic:p.includes('inherit')||p.includes('super')?'Python OOP → Inheritance & super()':'Python fundamentals',level:p.includes('inherit')||p.includes('super')?'Intermediate':'Beginner',score:p.includes('inherit')||p.includes('super')?72:58,tags:p.includes('inherit')?['OOP','Inheritance','Classes','super()']:['Syntax','Functions','Data types'],path:p.includes('inherit')?['Classes & objects','Inheritance','Method overriding','super()','Practice project']:['Syntax & data types','Functions','Modules','Error handling','Practice project']},
   React:{topic:p.includes('effect')||p.includes('rerender')?'React → Hooks & rendering':'React fundamentals',level:'Intermediate',score:68,tags:['Components','State','Hooks','Rendering'],path:['JSX & components','Props & state','useEffect','Rendering model','Practice project']},
   JavaScript:{topic:p.includes('async')||p.includes('promise')?'JavaScript → Async programming':'JavaScript fundamentals',level:'Intermediate',score:65,tags:['Promises','async/await','APIs','Event loop'],path:['Promises','async/await','Error handling','Fetch APIs','Practice project']},
   'UI/UX Design':{topic:'UI/UX → Visual hierarchy & spacing',level:'Intermediate',score:70,tags:['Hierarchy','Spacing','Design systems','Consistency'],path:['Design principles','Spacing systems','Visual hierarchy','Design tokens','Prototype & test']},
   'Data Science':{topic:'Data Science → Visualization & correlation',level:'Beginner',score:61,tags:['Pandas','EDA','Visualization','Correlation'],path:['Data cleaning','EDA','Chart selection','Correlation','Mini analysis']},
   'Machine Learning':{topic:'Machine Learning → Overfitting & generalization',level:'Intermediate',score:66,tags:['Overfitting','Validation','Regularization','Metrics'],path:['Train/validation split','Bias & variance','Regularization','Cross-validation','Model tuning']},
   Java:{topic:'Java → OOP, inheritance & polymorphism',level:'Intermediate',score:69,tags:['OOP','Inheritance','Interfaces','Polymorphism'],path:['Classes','Inheritance','Interfaces','Polymorphism','Practice project']}
  };
  const d=maps[skill]||maps.Python;
  const teachers=[
   {id:'demo-arjun',name:'Arjun Kumar',skills:['Python','OOP','Inheritance','Backend'],skillScore:96,teachingScore:94,bio:'Demo teacher profile — created for the offline showcase.',match:98},
   {id:'demo-sneha',name:'Sneha Patel',skills:['Python','Backend','OOP','APIs'],skillScore:93,teachingScore:97,bio:'Demo teacher profile — created for the offline showcase.',match:94},
   {id:'demo-meera',name:'Meera Shah',skills:['React','JavaScript','Frontend','UI/UX'],skillScore:95,teachingScore:96,bio:'Demo teacher profile — created for the offline showcase.',match:91}
  ];
  const relevant=skill==='Python'?teachers.slice(0,2):skill==='React'||skill==='JavaScript'?[teachers[2],teachers[1]]:teachers.slice(0,2);
  return Promise.resolve({mode:'local-demo',topic:d.topic,level:d.level,score:d.score,tags:d.tags,path:d.path,matches:relevant});
 },
 roadmap(skill){return Promise.resolve(null)}
};
