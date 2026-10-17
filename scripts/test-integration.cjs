const fs=require('fs'),path=require('path'),{spawn,spawnSync}=require('child_process'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),work=fs.mkdtempSync(path.join(require('os').tmpdir(),'jobboard-integration-')),bin=process.env.MARIADB_BIN||'C:/Program Files/MariaDB 13.0/bin',data=path.join(work,'db');
const php=spawnSync('where',['php'],{encoding:'utf8',windowsHide:true}).stdout.trim().split(/\r?\n/)[0];const pass=require('crypto').randomBytes(20).toString('hex');let db,server,server2;const results=[];const logs=[];
function start(file,args,env){const p=spawn(file,args,{cwd:root,windowsHide:true,env:env||process.env});p.stdout.on('data',b=>logs.push(b.toString()));p.stderr.on('data',b=>logs.push(b.toString()));return p;}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function sql(query){const r=spawnSync(path.join(bin,'mariadb.exe'),['--no-defaults','-h127.0.0.1','-P33319','-uroot','--batch','--skip-column-names'],{encoding:'utf8',input:query,windowsHide:true,env:{...process.env,MYSQL_PWD:pass}});if(r.status)throw Error(r.stderr);return r.stdout;}
async function req(route,method='GET',body,cookie='',scope='site',expected=200){const headers={'X-Session-Scope':scope};if(cookie)headers.Cookie=cookie;if(body && !(body instanceof FormData)){headers['Content-Type']='application/json';body=JSON.stringify(body);}const res=await fetch('http://127.0.0.1:18119'+route,{method,headers,body});const text=await res.text();let json;try{json=JSON.parse(text);}catch{}const ok=res.status===expected&&json!==undefined;results.push({route,method,expected,status:res.status,ok,...(!ok?{response:text.slice(0,600)}:{})});return {json,status:res.status,cookie:res.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ')};}
(async()=>{try{
const init=spawnSync(path.join(bin,'mariadb-install-db.exe'),['--datadir='+data,'--port=33319','--password='+pass,'--silent'],{windowsHide:true,encoding:'utf8'});if(init.status)throw Error(init.stderr||init.stdout);
db=start(path.join(bin,'mariadbd.exe'),['--defaults-file='+path.join(data,'my.ini'),'--bind-address=127.0.0.1','--console']);for(let i=0;i<35;i++){try{sql('SELECT 1;');break;}catch{await wait(200);}}
sql('CREATE DATABASE job_board CHARACTER SET utf8mb4; USE job_board;\n'+fs.readFileSync(path.join(root,'database/schema.sql'),'utf8')+'\n'+fs.readFileSync(path.join(root,'database/seed.sql'),'utf8'));
server=start(php,['-S','127.0.0.1:18119','-t',root],{...process.env,DB_HOST:'127.0.0.1',DB_PORT:'33319',DB_NAME:'job_board',DB_USER:'root',DB_PASSWORD:pass});await wait(700);
await req('/api/jobs/');await req('/api/jobs/?page=1&limit=2');await req('/api/jobs/?id=1');await req('/api/jobs/?q=PHP');await req('/api/companies/');await req('/api/stats/','GET',undefined,'','site',401);await req('/api/users/','GET',undefined,'','site',401);await req('/api/jobs/','POST',{},'','site',401);
const admin=(await req('/api/auth/','POST',{action:'login',email:'admin@jobboard.local',password:'Admin123!'},'','admin')).cookie;
const candidate=(await req('/api/auth/','POST',{action:'login',email:'candidat@jobboard.local',password:'Candidat123!'})).cookie;
const company=(await req('/api/auth/','POST',{action:'login',email:'entreprise@jobboard.local',password:'Entreprise123!'})).cookie;
const pending=(await req('/api/auth/','POST',{action:'login',email:'nova@jobboard.local',password:'Entreprise123!'})).cookie;
for(const [cookie,scope] of [[admin,'admin'],[candidate,'site'],[company,'site']])await req('/api/auth/','GET',undefined,cookie,scope);
await req('/api/users/','GET',undefined,candidate,'site',403);await req('/api/users/','GET',undefined,admin,'admin');await req('/api/stats/','GET',undefined,admin,'admin');await req('/api/notifications/','GET',undefined,candidate);await req('/api/notifications/','GET',undefined,company);await req('/api/app/?mine=1','GET',undefined,candidate);await req('/api/app/','GET',undefined,company);
const job={company_id:7,title:'Audit vacancy',location:'Nantes',contract_type:'CDI',salary:'30000',short_description:'Audit vacancy',description:'Audit full description',cover_letter_required:false};
await req('/api/jobs/','POST',job,candidate,'site',403);await req('/api/jobs/','POST',job,pending,'site',403);
const created=await req('/api/jobs/','POST',job,company,'site',201);const id=created.json?.id||created.json?.job_id;
await req('/api/jobs/?mine=1','GET',undefined,company);await req('/api/jobs/?id=1','PUT',{...job,id:1},company,'site',404);
await req('/api/auth/','POST',{action:'register',account_type:'company',first_name:'Test',last_name:'Company',email:'audit@example.test',password:'Valid123!',company_name:'Audit Ltd',company_location:'Nantes',siret:'invalid'},'','site',400);
if(id){const form=()=>{const f=new FormData();for(const [k,v] of Object.entries({job_id:id,candidate_name:'Camille Martin',candidate_email:'candidat@jobboard.local',candidate_phone:'0612345678',message:'Audit application',cover_letter:'Audit letter'}))f.append(k,String(v));f.append('cv',new Blob(['%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF'],{type:'application/pdf'}),'cv.pdf');return f;};const application=await req('/api/app/','POST',form(),candidate,'site',201);const app=application.json?.id||application.json?.application_id;if(app){await req('/api/app/','PUT',{id:app,status:'interview'},company);await req('/api/notifications/','GET',undefined,candidate);await req('/api/app/','PUT',{id:app,status:'accepted'},candidate,'site',403);await req('/api/app/','POST',form(),candidate,'site',409);}}
await req('/api/companies/?id=8','PATCH',{status:'approved'},admin,'admin');await req('/api/jobs/','POST',{...job,company_id:8},pending,'site',201);
await req('/api/auth/','POST',{action:'register',first_name:'Test',last_name:'Candidate',email:'newcandidate@example.test',password:'Valid123!',account_type:'candidate'},'','site',201);
await req('/api/auth/','POST',{action:'register',first_name:'Test',last_name:'Candidate',email:'newcandidate@example.test',password:'Valid123!',account_type:'candidate'},'','site',409);
await req('/api/profile-documents/','GET',undefined,candidate);
await req('/api/jobs/','GET',undefined,'','site',200);
const cors=await fetch('http://127.0.0.1:18119/api/auth/',{method:'OPTIONS',headers:{Origin:'http://127.0.0.1:5174','Access-Control-Request-Method':'POST'}});results.push({route:'CORS origin 5174',ok:cors.headers.get('access-control-allow-origin')==='http://127.0.0.1:5174',status:cors.status});
await req('/api/auth/','POST',{action:'profile',first_name:'Camille',last_name:'Martin',email:'candidat@jobboard.local',phone:'0612345678',city:'Nantes',linkedin_url:'https://www.linkedin.com/in/audit',bio:'Audit profile'},candidate);
await req('/api/auth/','POST',{action:'change_email',email:'test@example.test',current_password:'wrong'},candidate,'site',403);
await req('/api/auth/','POST',{action:'change_password',current_password:'wrong',new_password:'Another123!',confirm_password:'Another123!'},candidate,'site',403);
for(const type of ['cv','cover_letter']){const f=new FormData();f.append('type',type);f.append('file',new Blob(['%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF'],{type:'application/pdf'}),'audit.pdf');await req('/api/profile-documents/','POST',f,candidate);}
await req('/api/profile-documents/','GET',undefined,candidate);
await req('/api/profile-documents/?type=cv','DELETE',undefined,candidate);
await req('/api/notifications/','PUT',{all:true},candidate);

const expected=(label,ok)=>results.push({route:label,ok});
const firstUser=(await req('/api/auth/','GET',undefined,candidate)).json.user;
expected('Profile fields persisted',firstUser.city==='Nantes' && firstUser.linkedin_url==='https://www.linkedin.com/in/audit');
const alertPayload={id:'audit-alert',title:'PHP jobs',keyword:'PHP',location:'Nantes',contract:'CDI',enabled:true,createdAt:new Date().toISOString()};
await req('/api/alerts/','PUT',{alerts:[alertPayload]},candidate);
expected('Alerts database persistence',(await req('/api/alerts/','GET',undefined,candidate)).json.alerts[0]?.id==='audit-alert');
const another=(await req('/api/auth/','POST',{action:'register',first_name:'Other',last_name:'Candidate',email:'other@example.test',password:'Valid123!',account_type:'candidate'},'','site',201)).cookie;
expected('Alerts owner isolation',(await req('/api/alerts/','GET',undefined,another)).json.alerts.length===0);
await req('/api/alerts/','PUT',{alerts:[{...alertPayload,enabled:'yes'}]},candidate,'site',400);
await req('/api/alerts/','GET',undefined,company,'site',403);
await req('/api/alerts/','GET',undefined,admin,'admin',403);
await req('/api/alerts/','PUT',{alerts:[{...alertPayload,enabled:false}]},candidate);
expected('Alert deactivation',(await req('/api/alerts/','GET',undefined,candidate)).json.alerts[0].enabled===false);
await req('/api/alerts/','PUT',{alerts:[]},candidate);
expected('Alert deletion',(await req('/api/alerts/','GET',undefined,candidate)).json.alerts.length===0);
const full={...job,skills:'PHP SQL',missions:'API development',profile:'Junior developer',benefits:'Training',working_time:'35h',application_deadline:'2099-12-31'};
const fullId=(await req('/api/jobs/','POST',full,company,'site',201)).json.id;
const restored=(await req('/api/jobs/?id='+fullId)).json;
expected('All extended job fields stored',restored.skills==='PHP SQL'&&restored.missions==='API development'&&restored.working_time==='35h'&&restored.application_deadline==='2099-12-31');
await req('/api/jobs/','PUT',{...job,id:fullId,title:'Updated'},company);
expected('Omitted job fields preserved',(await req('/api/jobs/?id='+fullId)).json.skills==='PHP SQL');
await req('/api/jobs/','POST',{...full,application_deadline:'2026-02-30'},company,'site',400);
await req('/api/jobs/','POST',{...job,contract_type:'Invalid'},company,'site',400);
const expiredId=(await req('/api/jobs/','POST',{...job,application_deadline:'2000-01-01'},company,'site',201)).json.id;
const formFor=id=>{const f=new FormData();for(const [k,v] of Object.entries({job_id:id,candidate_name:'Camille Martin',candidate_email:'candidat@jobboard.local',candidate_phone:'0612345678',message:'Audit application',cover_letter:'Audit letter'}))f.append(k,String(v));f.append('cv',new Blob(['%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF'],{type:'application/pdf'}),'cv.pdf');return f;};
await req('/api/app/','POST',formFor(expiredId),candidate,'site',410);
const appWithFile=(await req('/api/app/','POST',formFor(fullId),candidate,'site',201)).json.application_id;
const ownDownload=await fetch('http://127.0.0.1:18119/api/app/?id='+appWithFile+'&attachment=cv',{headers:{Cookie:candidate}});
expected('Owner PDF download',ownDownload.status===200&&ownDownload.headers.get('content-type')?.includes('application/pdf'));
const otherDownload=await fetch('http://127.0.0.1:18119/api/app/?id='+appWithFile+'&attachment=cv',{headers:{Cookie:another}});
expected('Other candidate PDF denied',[403,404].includes(otherDownload.status));
const badFile=new FormData();badFile.append('type','cv');badFile.append('file',new Blob(['plain text'],{type:'text/plain'}),'wrong.pdf');await req('/api/profile-documents/','POST',badFile,candidate,'site',400);
const resetKnown=(await req('/api/auth/forgot-password.php','POST',{email:'candidat@jobboard.local'})).json;
const resetMissing=(await req('/api/auth/forgot-password.php','POST',{email:'nobody@example.test'})).json;
expected('Reset response does not reveal account or token',JSON.stringify(resetKnown)===JSON.stringify(resetMissing)&&!('token' in resetKnown));
await req('/api/mail/','GET',undefined,candidate,'site',403);
const messages=(await req('/api/mail/','GET',undefined,admin,'admin')).json.messages;
const privateMail=(await req('/api/mail/?id='+messages[0].id,'GET',undefined,admin,'admin')).json.message;
const token=privateMail.body.match(/token=([a-f0-9]{64})/)[1];
await req('/api/auth/reset-password.php','POST',{token,new_password:'Changed123!',confirm_password:'Changed123!'});
await req('/api/auth/reset-password.php','POST',{token,new_password:'Changed123!',confirm_password:'Changed123!'},'','site',400);
const changed=(await req('/api/auth/','POST',{action:'login',email:'candidat@jobboard.local',password:'Changed123!'})).cookie;
await req('/api/auth/','POST',{action:'login',email:'candidat@jobboard.local',password:'Candidat123!'},'','site',401);
const sameUserSecond=(await req('/api/auth/','POST',{action:'login',email:'candidat@jobboard.local',password:'Changed123!'})).cookie;
const env={...process.env,DB_HOST:'127.0.0.1',DB_PORT:'33319',DB_NAME:'job_board',DB_USER:'root',DB_PASSWORD:pass};
server2=start(php,['-S','127.0.0.1:18120','-t',root],env);await wait(300);
const concurrentJob=(await req('/api/jobs/','POST',job,company,'site',201)).json.id;
const race=await Promise.all([fetch('http://127.0.0.1:18119/api/app/',{method:'POST',headers:{Cookie:changed},body:formFor(concurrentJob)}),fetch('http://127.0.0.1:18120/api/app/',{method:'POST',headers:{Cookie:sameUserSecond},body:formFor(concurrentJob)})]);
expected('Concurrent duplicate submissions blocked',race.map(r=>r.status).sort().join(',')==='201,409');
expected('Only one concurrent application stored',Number(sql('USE job_board; SELECT COUNT(*) FROM applications WHERE job_id='+concurrentJob+';').trim())===1);
const beforeMigration=sql('USE job_board; SELECT COUNT(*) FROM applications;').trim();
for(let i=0;i<2;i++){const m=spawnSync(php,['scripts/migrate.php'],{cwd:root,env,encoding:'utf8',windowsHide:true});expected('Additive migration repeat '+i,m.status===0);}
expected('Migration preserves applications',sql('USE job_board; SELECT COUNT(*) FROM applications;').trim()===beforeMigration);
const invalidSiret=await req('/api/auth/','POST',{action:'register',first_name:'Test',last_name:'Company',email:'zero@example.test',password:'Valid123!',account_type:'company',company_name:'Invalid',company_location:'Nantes',company_siret:'00000000000000',siret:'00000000000000'},'','site',400);

await req('/api/auth/','POST',{action:'logout'},candidate);await req('/api/auth/','GET',undefined,candidate,'site',401);
// Session roles must follow database changes, rather than stale cookies.
sql("USE job_board; UPDATE users SET role='candidate' WHERE id=1;");await req('/api/users/','GET',undefined,admin,'admin',403);
const missing=[];for(const file of fs.readdirSync(path.join(root,'dist')).filter(f=>f.endsWith('.html'))){const html=fs.readFileSync(path.join(root,'dist',file),'utf8');for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const target=m[1];if(/^(https?:|data:|mailto:)/.test(target))continue;const clean=target.split(/[?#]/)[0].replace(/^\//,'');if(clean&&!fs.existsSync(path.join(root,'dist',clean)))missing.push({page:file,asset:target});}}
fs.writeFileSync(path.join(work,'results.json'),JSON.stringify({version:'working tree',checks:results,missingBuiltAssets:missing},null,2));console.log(JSON.stringify({passed:results.filter(r=>r.ok).length,failed:results.filter(r=>!r.ok),missingBuiltAssets:missing.slice(0,10),missingCount:missing.length},null,2));
if(results.some(r=>!r.ok)||missing.length)throw Error('Integration checks failed; see results.json in '+work);
}catch(e){console.error(e.stack);process.exitCode=1;}finally{if(server2)server2.kill();if(server)server.kill();if(db)db.kill();fs.writeFileSync(path.join(work,'server.log'),logs.join(''));}})();
