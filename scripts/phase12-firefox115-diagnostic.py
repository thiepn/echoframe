#!/usr/bin/env python3
import base64, hashlib, http.server, json, os, pathlib, shutil, socket, socketserver, subprocess, tempfile, threading, time
ROOT=pathlib.Path(__file__).resolve().parents[1]
DOCS=ROOT/'docs'; SHOTS=DOCS/'screenshots'; SHOTS.mkdir(parents=True,exist_ok=True)
DIST=ROOT/'dist-phase12-firefox115-diagnostic'
FF=pathlib.Path('/mnt/data/firefox115-image/opt/firefox-115.0.3/firefox')
LIB='/mnt/data/firefox115-image/usr/lib/x86_64-linux-gnu:/mnt/data/firefox115-image/opt/firefox-115.0.3'

def sha(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
class Marionette:
    def __init__(self,host='127.0.0.1',port=2828):
        self.s=socket.create_connection((host,port),15); self.s.settimeout(45); self.i=0; self._recv()
    def _recv(self):
        d=b''
        while b':' not in d: d+=self.s.recv(1)
        n,r=d.split(b':',1); n=int(n)
        while len(r)<n: r+=self.s.recv(n-len(r))
        return json.loads(r[:n])
    def cmd(self,name,params=None):
        self.i+=1; obj=[0,self.i,name,params or {}]; b=json.dumps(obj,separators=(',',':')).encode(); self.s.sendall(str(len(b)).encode()+b':'+b)
        r=self._recv()
        if r[2] is not None: raise RuntimeError(f'{name}: {r[2]}')
        return r[3].get('value') if isinstance(r[3],dict) and 'value' in r[3] else r[3]
    def script(self,code): return self.cmd('WebDriver:ExecuteScript',{'script':code,'args':[],'newSandbox':False,'sandbox':'default','line':0,'filename':'phase12-firefox115-diagnostic'})
    def wait(self,code,timeout=30):
        end=time.time()+timeout
        while time.time()<end:
            try:
                if self.script(f'return Boolean({code});'): return True
            except Exception: pass
            time.sleep(.1)
        raise TimeoutError(code)
    def click(self,x=680,y=380,button=0):
        return self.cmd('WebDriver:PerformActions',{'actions':[{'type':'pointer','id':'mouse','parameters':{'pointerType':'mouse'},'actions':[{'type':'pointerMove','duration':0,'x':x,'y':y,'origin':'viewport'},{'type':'pointerDown','button':button},{'type':'pointerUp','button':button}]}]})
    def screenshot(self,path): pathlib.Path(path).write_bytes(base64.b64decode(self.cmd('WebDriver:TakeScreenshot',{'full':True,'hash':False,'scroll':False})))
    def quit(self):
        try:self.cmd('Marionette:Quit',{'flags':['eForceQuit']})
        except Exception:pass

def main():
    report={'generatedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'phase':12,'scope':'Obsolete Firefox 115 real-Gecko diagnostic; not release certification','acceptedAsCertification':False,'browser':{},'gameCodeExecuted':False,'checks':{},'errors':[],'passedDiagnostic':False}
    if not FF.exists(): report['errors'].append('Firefox 115 diagnostic binary missing'); (DOCS/'PHASE12_FIREFOX115_DIAGNOSTIC.json').write_text(json.dumps(report,indent=2)+'\n'); return 1
    subprocess.run(['npm','run','build','--','--mode','validation','--outDir',DIST.name],cwd=ROOT,check=True)
    os.chdir(DIST)
    server=socketserver.TCPServer(('127.0.0.1',0),Quiet); threading.Thread(target=server.serve_forever,daemon=True).start(); url=f'http://127.0.0.1:{server.server_address[1]}/?debug=1'
    profile=pathlib.Path('/tmp/echoframe-ff115-marionette-profile'); runtime=pathlib.Path('/tmp/echoframe-ff115-runtime')
    shutil.rmtree(profile,ignore_errors=True); shutil.rmtree(runtime,ignore_errors=True); profile.mkdir(); runtime.mkdir()
    for p in (profile,runtime): os.chown(p,1000,1000)
    (profile/'user.js').write_text('user_pref("toolkit.telemetry.enabled", false);\nuser_pref("datareporting.healthreport.uploadEnabled", false);\nuser_pref("app.update.enabled", false);\n')
    os.chown(profile/'user.js',1000,1000)
    env=os.environ.copy(); env.update({'LD_LIBRARY_PATH':LIB,'HOME':'/home/oai','XDG_RUNTIME_DIR':str(runtime),'MOZ_HEADLESS':'1'})
    out=open('/tmp/echoframe-ff115-diagnostic.log','w')
    proc=subprocess.Popen(['runuser','-u','oai','--','env',*[f'{k}={v}' for k,v in env.items() if k in ('LD_LIBRARY_PATH','HOME','XDG_RUNTIME_DIR','MOZ_HEADLESS')],str(FF),'--headless','--no-remote','--profile',str(profile),'--marionette','about:blank'],stdout=out,stderr=subprocess.STDOUT)
    try:
        for _ in range(100):
            try: m=Marionette(); break
            except Exception: time.sleep(.1)
        else: raise RuntimeError('Marionette did not open')
        print('new session',flush=True); caps=m.cmd('WebDriver:NewSession',{'capabilities':{'alwaysMatch':{'acceptInsecureCerts':True,'pageLoadStrategy':'eager'}}}); report['browser']=caps['capabilities']
        print('set rect',flush=True); m.cmd('WebDriver:SetWindowRect',{'x':0,'y':0,'width':1366,'height':768})
        print('navigate',url,flush=True); m.cmd('WebDriver:Navigate',{'url':url}); print('wait game',flush=True); m.wait('globalThis.__ECHOFRAME__?.game',45); m.wait("__ECHOFRAME__.game.scene.getScenes(true).some(s=>s.scene.key==='MainMenuScene')",30)
        report['gameCodeExecuted']=True; report['checks']['bootAndMenu']=True
        print('click',flush=True); m.click(); time.sleep(.2)
        report['checks']['audioContextBounded']=m.script("const s=__ECHOFRAME__.game.scene.getScenes(true)[0].services; return s.audioManager.getDiagnostics().contextCount<=1;")
        print('start tutorial',flush=True); m.script("__ECHOFRAME__.game.scene.getScene('MainMenuScene').buttons[0].activate(); return true;"); m.wait("__ECHOFRAME__.game.scene.getScenes(true).some(s=>s.scene.key==='TutorialScene')",30); m.wait('globalThis.__ECHOFRAME_PHASE10_TUTORIAL__',30)
        report['checks']['freshTutorial']=True
        print('complete tutorial',flush=True); m.script("const h=__ECHOFRAME_PHASE10_TUTORIAL__; h.advanceTo('AIM_AND_FIRE');h.advanceTo('DASH_GATE');h.advanceTo('RECORD_PATH');h.advanceTo('DEPLOY_ECHO');h.forceEchoSuccess();h.complete();return true;")
        m.wait("__ECHOFRAME__.game.scene.getScenes(true).some(s=>s.scene.key==='RunScene')",30)
        snap=m.script("const s=__ECHOFRAME__.game.scene.getScenes(true)[0].services; const v=s.saveManager.getSnapshot(); return {tutorial:v.meta.tutorialCompleted,runs:v.statistics.aggregateCounters.runsStarted,totalScore:v.statistics.aggregateCounters.totalScore,scenes:__ECHOFRAME__.game.scene.getScenes(true).map(x=>x.scene.key)};")
        report['observations']=snap; report['checks']['tutorialPersisted']=snap['tutorial'] is True; report['checks']['combatOneStarted']='RunScene' in snap['scenes']; report['checks']['tutorialScoreExcluded']=snap['totalScore']==0
        m.script("const g=__ECHOFRAME__.game;const active=g.scene.getScenes(true);const s=active[0].services;s.sceneFlow.currentTransition=null;s.inputManager.setLocked(false);for(const x of active)if(x.scene.key!=='BootScene')g.scene.stop(x.scene.key);s.gameState.disposeRun();g.scene.start('MainMenuScene');return true;")
        m.wait("__ECHOFRAME__.game.scene.getScenes(true).some(s=>s.scene.key==='MainMenuScene')",20)
        m.script("__ECHOFRAME__.game.scene.getScene('MainMenuScene').buttons[6].activate();return true;"); m.wait("__ECHOFRAME__.game.scene.getScenes(true).some(s=>s.scene.key==='CreditsScene')",20); report['checks']['credits']=True
        shot=SHOTS/'ECHOFRAME_phase12_firefox115_diagnostic.png'; print('screenshot',flush=True); m.screenshot(shot); report['screenshot']={'path':str(shot.relative_to(ROOT)),'sha256':sha(shot)}
        report['passedDiagnostic']=all(report['checks'].values()) and report['gameCodeExecuted']
        m.quit()
    except Exception as e: report['errors'].append(f'{type(e).__name__}: {e}')
    finally:
        server.shutdown(); server.server_close(); proc.terminate();
        try: proc.wait(5)
        except subprocess.TimeoutExpired: proc.kill()
        out.close(); report['processLog']=pathlib.Path('/tmp/echoframe-ff115-diagnostic.log').read_text(errors='replace')[-6000:]
        (DOCS/'PHASE12_FIREFOX115_DIAGNOSTIC.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'passedDiagnostic':report['passedDiagnostic'],'gameCodeExecuted':report['gameCodeExecuted'],'checks':report['checks'],'errors':report['errors']},indent=2))
    return 0 if report['passedDiagnostic'] else 1
if __name__=='__main__': raise SystemExit(main())
