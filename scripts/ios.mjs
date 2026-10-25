import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
const require=createRequire(import.meta.url);
const run=(command,args,options={})=>execFileSync(command,args,{encoding:'utf8',...options});
const port=process.env.EXPO_PORT || '8081';
if(!/^\d+$/.test(port))throw new Error('EXPO_PORT must be a port number.');
let metro;
async function ready(){try{return (await (await fetch(`http://127.0.0.1:${port}/status`,{signal:AbortSignal.timeout(2000)})).text()).includes('packager-status:running');}catch{return false;}}
try {
  const developer=run('xcode-select',['-p']).trim();
  const ui=[path.resolve(developer,'../Applications/DeviceHub.app'),path.join(developer,'Applications/Simulator.app')].find(existsSync);
  if(!ui)throw new Error('Install full Xcode from the App Store and finish its first-launch setup.');
  const {devices}=JSON.parse(run('xcrun',['simctl','list','devices','available','-j']));
  const candidates=Object.entries(devices).filter(([runtime])=>runtime.includes('.iOS-')).sort(([a],[b])=>b.localeCompare(a,undefined,{numeric:true})).flatMap(([,entries])=>entries).filter(device=>device.isAvailable&&device.name.startsWith('iPhone'));
  const device=candidates.find(device=>device.state==='Booted')||candidates[0];
  if(!device)throw new Error('Install an iOS simulator runtime in Xcode and create an iPhone device.');
  console.log(`Opening ${device.name} with ${path.basename(ui)}…`);
  if(device.state!=='Booted')run('xcrun',['simctl','boot',device.udid]);
  run('open',[ui]);
  if(path.basename(ui)==='DeviceHub.app')run('open',[`devices://device/open?id=${device.udid}`]);
  run('xcrun',['simctl','bootstatus',device.udid,'-b'],{stdio:'inherit'});
  const {downloadExpoGoAsync}=require('../node_modules/@expo/cli/build/src/utils/downloadExpoGoAsync.js');
  const sdkVersion=`${require('expo/package.json').version.split('.')[0]}.0.0`;
  const client=await downloadExpoGoAsync('ios',{sdkVersion});
  run('xcrun',['simctl','install',device.udid,client],{stdio:'inherit'});
  if(!await ready()){
    metro=spawn(process.execPath,[require.resolve('expo/bin/cli'),'start','--port',port],{stdio:'inherit'});
    let attempts=0;
    while(!await ready()){
      if(metro.exitCode!==null||++attempts>90)throw new Error('Metro did not start. Review its output above.');
      await new Promise(resolve=>setTimeout(resolve,1000));
    }
  }
  run('xcrun',['simctl','openurl',device.udid,`exp://127.0.0.1:${port}`],{stdio:'inherit'});
  console.log(`PurchaseEase opened on ${device.name}. Demo login is configured in src/config/appConfig.ts.`);
}catch(error){console.error(error.message);metro?.kill();process.exitCode=1;}
