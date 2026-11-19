// Actual Python execution in a dedicated browser worker (Pyodide 0.29.3).
const PYODIDE_URL='https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js';
let ready=null;
async function init(){if(!ready){ready=(async()=>{importScripts(PYODIDE_URL);return await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/'})})()}return ready}
self.onmessage=async(event)=>{const{id,code,stdin=''}=event.data;let stdout=[],stderr=[];
 try{let py=await init();let inputs=stdin.split(/\r?\n/),ptr=0;
   py.setStdout({batched:s=>stdout.push(s)});py.setStderr({batched:s=>stderr.push(s)});
   py.setStdin({stdin:()=>ptr<inputs.length?inputs[ptr++]:''});
   const result=await py.runPythonAsync(code);
   self.postMessage({id,stdout:stdout.join('\n')+(result!==undefined&&result!==null&&String(result)!=='None'?`\n${String(result)}`:''),stderr:stderr.join('\n'),error:null});
 }catch(e){self.postMessage({id,stdout:stdout.join('\n'),stderr:stderr.join('\n'),error:String(e)})}
};
