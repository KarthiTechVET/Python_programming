// Optional secure Firebase integration. Never place SMTP/provider secrets in this file.
export async function makeBridge(config,onChange){
 const [fa,authmod,dbmod,fnmod]=await Promise.all([
   import('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'),
   import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'),
   import('https://www.gstatic.com/firebasejs/11.6.0/firebase-functions.js')
 ]);
 const app=fa.initializeApp(config),auth=authmod.getAuth(app),db=dbmod.getFirestore(app),functions=fnmod.getFunctions(app,'asia-south1');
 const bridge={ready:true,user:null,db,auth,async register(email,password){const credential=await authmod.createUserWithEmailAndPassword(auth,email,password);await dbmod.setDoc(dbmod.doc(db,'users',credential.user.uid),{email:credential.user.email,createdAt:dbmod.serverTimestamp(),displayName:email.split('@')[0]});await authmod.sendEmailVerification(credential.user);return credential.user},
 async login(email,password){let res=await authmod.signInWithEmailAndPassword(auth,email,password);return res.user},
 async signOut(){await authmod.signOut(auth)},async verifyEmail(){if(!auth.currentUser)throw Error('Sign in first');await authmod.sendEmailVerification(auth.currentUser)},
 async refreshUser(){if(auth.currentUser){await authmod.reload(auth.currentUser);bridge.user=auth.currentUser;onChange?.()}},
 async call(action,data){let f=fnmod.httpsCallable(functions,action);let result=await f(data);return result.data},
 async addThread(t){if(!auth.currentUser?.emailVerified)throw Error('Verify your email before posting');await dbmod.addDoc(dbmod.collection(db,'threads'),{unit:t.unit,title:t.title,body:t.body,author:auth.currentUser.email,uid:auth.currentUser.uid,createdAt:dbmod.serverTimestamp()})},
 listenThreads(callback){let q=dbmod.query(dbmod.collection(db,'threads'),dbmod.orderBy('createdAt','desc'),dbmod.limit(100));return dbmod.onSnapshot(q,s=>callback(s.docs.map(d=>({id:d.id,...d.data()}))),err=>{console.error('Forum error',err);callback([])})},
 async loadReplies(threadId){let q=dbmod.query(dbmod.collection(db,'threads',threadId,'replies'),dbmod.orderBy('createdAt','asc'));let r=await dbmod.getDocs(q);return r.docs.map(d=>({id:d.id,...d.data()}))},
 async addReply(threadId,t){if(!auth.currentUser?.emailVerified)throw Error('Verify your email before posting');await dbmod.addDoc(dbmod.collection(db,'threads',threadId,'replies'),{author:auth.currentUser.email,uid:auth.currentUser.uid,body:t.body,createdAt:dbmod.serverTimestamp()})}
 };
 authmod.onAuthStateChanged(auth,user=>{bridge.user=user;onChange?.()});return bridge;
}
