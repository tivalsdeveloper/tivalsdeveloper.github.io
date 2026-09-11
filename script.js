import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm';

const supabase=createClient('https://kxuszpixwfecawdeqkrx.supabase.co','sb_publishable__auyhjNpepXiYdGV5HEJ_A_AGsPbBuS');
const form=document.querySelector('#project-form');
const requestDialog=document.querySelector('#request-dialog');
const authDialog=document.querySelector('#auth-dialog');
const formStatus=document.querySelector('#form-status');
const accountButton=document.querySelector('#account-button');
const dashboard=document.querySelector('#dashboard');
let currentUser=null;
let pendingVerificationEmail='';
let resendTimer=null;

document.querySelector('#year').textContent=new Date().getFullYear();
function setStatus(element,message,error=false){element.textContent=message;element.classList.toggle('error',error)}
function friendlyAuthError(error){
  const message=(error?.message||'').toLowerCase();
  if(message.includes('error sending confirmation email'))return 'We could not send the verification code. Please try again in a moment.';
  if(message.includes('invalid login credentials'))return 'The email or password is incorrect.';
  if(message.includes('email not confirmed'))return 'Verify your email before signing in.';
  if(message.includes('rate limit'))return 'Too many attempts. Please wait a minute and try again.';
  if(message.includes('already registered')||message.includes('already exists'))return 'This email already has an account. Sign in or request a new code.';
  return error?.message||'Something went wrong. Please try again.';
}
function emailTypo(email){
  const value=String(email).trim().toLowerCase();
  if(value.endsWith('@gmail.con'))return 'That email ends in gmail.con. Did you mean gmail.com?';
  if(value.endsWith('@gamil.com'))return 'Did you mean gmail.com?';
  return '';
}
function openAuth(tab='signin'){
  document.querySelector('.auth-tabs').hidden=tab==='verify';
  document.querySelectorAll('[data-auth-tab]').forEach(button=>{const active=button.dataset.authTab===tab;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active))});
  document.querySelector('#signin-form').hidden=tab!=='signin';
  document.querySelector('#signup-form').hidden=tab!=='signup';
  document.querySelector('#verify-form').hidden=tab!=='verify';
  if(!authDialog.open)authDialog.showModal();
}
function showVerification(email){
  pendingVerificationEmail=email;
  document.querySelector('#verification-email').textContent=email;
  document.querySelector('#verification-code').value='';
  openAuth('verify');
  setTimeout(()=>document.querySelector('#verification-code').focus(),50);
}
function startResendCooldown(){
  const button=document.querySelector('#resend-code');
  let seconds=60;button.disabled=true;button.textContent=`Send again in ${seconds}s`;
  clearInterval(resendTimer);
  resendTimer=setInterval(()=>{seconds-=1;if(seconds<=0){clearInterval(resendTimer);button.disabled=false;button.textContent='Send a new code'}else button.textContent=`Send again in ${seconds}s`},1000);
}

document.querySelectorAll('[data-auth-tab]').forEach(button=>button.addEventListener('click',()=>openAuth(button.dataset.authTab)));
accountButton.addEventListener('click',()=>currentUser?dashboard.scrollIntoView({behavior:'smooth'}):openAuth('signin'));
document.querySelector('.auth-close').addEventListener('click',()=>authDialog.close());
document.querySelector('#request-dialog .close').addEventListener('click',()=>requestDialog.close());

document.querySelector('#signup-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const data=new FormData(event.currentTarget);
  const status=event.currentTarget.querySelector('.auth-status');
  const email=String(data.get('email')).trim();
  const typo=emailTypo(email);
  if(typo){setStatus(status,typo,true);event.currentTarget.elements.email.focus();return}
  setStatus(status,'Creating your account and sending a code…');
  const submit=event.currentTarget.querySelector('[type="submit"]');submit.disabled=true;
  const {data:result,error}=await supabase.auth.signUp({
    email,password:data.get('password'),
    options:{emailRedirectTo:location.origin,data:{full_name:data.get('fullName'),username:data.get('username')}}
  });
  submit.disabled=false;
  if(error){setStatus(status,friendlyAuthError(error),true);return}
  if(result.session){await ensureProfile(result.user);setStatus(status,'Account created. You are signed in.');setTimeout(()=>authDialog.close(),700)}
  else{showVerification(email);startResendCooldown()}
});

document.querySelector('#verify-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const token=String(new FormData(event.currentTarget).get('token')).replace(/\D/g,'');
  const status=event.currentTarget.querySelector('.auth-status');
  if(token.length!==6){setStatus(status,'Enter the complete 6-digit code.',true);return}
  const submit=event.currentTarget.querySelector('[type="submit"]');submit.disabled=true;setStatus(status,'Verifying your code…');
  const {data,error}=await supabase.auth.verifyOtp({email:pendingVerificationEmail,token,type:'email'});
  submit.disabled=false;
  if(error){setStatus(status,friendlyAuthError(error),true);return}
  await ensureProfile(data.user);setStatus(status,'Email verified. Your account is ready.');
  setTimeout(()=>authDialog.close(),800);
});

document.querySelector('#resend-code').addEventListener('click',async event=>{
  const status=document.querySelector('#verify-form .auth-status');event.currentTarget.disabled=true;setStatus(status,'Sending a new code…');
  const {error}=await supabase.auth.resend({type:'signup',email:pendingVerificationEmail,options:{emailRedirectTo:location.origin}});
  if(error){event.currentTarget.disabled=false;setStatus(status,friendlyAuthError(error),true);return}
  setStatus(status,'A new verification code has been sent.');startResendCooldown();
});
document.querySelector('#change-email').addEventListener('click',()=>openAuth('signup'));
document.querySelector('#verification-code').addEventListener('input',event=>{event.target.value=event.target.value.replace(/\D/g,'').slice(0,6)});

document.querySelector('#signin-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const data=new FormData(event.currentTarget);
  const status=event.currentTarget.querySelector('.auth-status');
  setStatus(status,'Signing you in…');
  const {error}=await supabase.auth.signInWithPassword({email:data.get('email'),password:data.get('password')});
  if(error){setStatus(status,friendlyAuthError(error),true);return}
  setStatus(status,'Signed in successfully.');setTimeout(()=>authDialog.close(),500);
});

document.querySelector('#signout-button').addEventListener('click',async()=>{await supabase.auth.signOut();dashboard.hidden=true;location.hash='top'});

async function ensureProfile(user){
  if(!user)return;
  const metadata=user.user_metadata||{};
  await supabase.from('customer_profiles').upsert({
    user_id:user.id,email:user.email,full_name:metadata.full_name||null,username:metadata.username||null,updated_at:new Date().toISOString()
  },{onConflict:'user_id'});
}

async function loadRequests(){
  if(!currentUser)return;
  const {data,error}=await supabase.from('website_requests').select('id,business_name,website_type,main_goal,budget,status,created_at').order('created_at',{ascending:false});
  const list=document.querySelector('#request-list');
  if(error){list.innerHTML='<p class="empty-state">Your requests are temporarily unavailable. Please try again.</p>';return}
  if(!data.length){list.innerHTML='<p class="empty-state">You have not submitted a website request yet.</p>';return}
  list.replaceChildren(...data.map(item=>{
    const article=document.createElement('article');article.className='request-item';
    const content=document.createElement('div');
    const title=document.createElement('h3');title.textContent=item.business_name;
    const detail=document.createElement('p');detail.textContent=`${item.website_type} · ${item.main_goal} · ${item.budget}`;
    const date=document.createElement('p');date.textContent=new Date(item.created_at).toLocaleDateString();
    const status=document.createElement('span');status.className='status-pill';status.textContent=item.status.replace('_',' ');
    content.append(title,detail,date);article.append(content,status);return article;
  }));
}

async function updateAccount(session){
  currentUser=session?.user||null;accountButton.textContent=currentUser?'My account':'Sign in';dashboard.hidden=!currentUser;
  if(currentUser){
    await ensureProfile(currentUser);
    const metadata=currentUser.user_metadata||{};
    const summary=document.querySelector('#profile-summary');summary.replaceChildren();
    const name=document.createElement('strong');name.textContent=metadata.full_name||metadata.username||'Customer account';
    const email=document.createElement('span');email.textContent=currentUser.email;summary.append(name,email);
    await loadRequests();
  }
}

form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!currentUser){setStatus(formStatus,'Sign in or create an account before saving your request.',true);openAuth('signup');return}
  const data=new FormData(form);
  const request={user_id:currentUser.id,business_name:data.get('business'),website_type:data.get('siteType'),main_goal:data.get('goal'),budget:data.get('budget'),details:data.get('details')||null};
  setStatus(formStatus,'Saving your request…');
  const {error}=await supabase.from('website_requests').insert(request);
  if(error){setStatus(formStatus,'We could not save your request. Please try again.',true);return}
  setStatus(formStatus,'Your request has been saved successfully.');
  const message=`Hello Tivalsdeveloper, I submitted a website request for ${request.business_name}. Please contact me with the next steps.`;
  document.querySelector('#request-preview').textContent=message;
  document.querySelector('#send-whatsapp').href=`https://wa.me/27687345616?text=${encodeURIComponent(message)}`;
  document.querySelector('#send-email').href=`mailto:tivalsdeveloper@gmail.com?subject=${encodeURIComponent('Website request — '+request.business_name)}&body=${encodeURIComponent(message)}`;
  form.reset();await loadRequests();requestDialog.showModal();
});

requestDialog.addEventListener('click',event=>{if(event.target===requestDialog)requestDialog.close()});
authDialog.addEventListener('click',event=>{if(event.target===authDialog)authDialog.close()});
supabase.auth.onAuthStateChange((_event,session)=>setTimeout(()=>updateAccount(session),0));
const {data:{session}}=await supabase.auth.getSession();
await updateAccount(session);
