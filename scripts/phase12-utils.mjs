import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DOCS = path.join(ROOT, 'docs');
export const SCREENSHOTS = path.join(DOCS, 'screenshots');
export const PHASE11_SOURCE_ARCHIVE = process.env.PHASE11_SOURCE_ARCHIVE || '/mnt/data/ECHOFRAME_phase11_certification_candidate.zip';
export const PHASE11_WEB_ARCHIVE = process.env.PHASE11_WEB_ARCHIVE || '/mnt/data/ECHOFRAME_phase11_certification_candidate_web.zip';
export const EXPECTED_SOURCE_SHA256 = '0471a46aa98e7b23c2f50b2e20bdcc143d78c959c465ab41f83310303ad720ed';
export const EXPECTED_WEB_SHA256 = '9fabe142d2dcf733f02b4c43e14942e9d15b95f472d7cd477783e9060a11572c';
export const EXPECTED_PHASE11_SOURCE_DIGEST = '3be6c352bb402201c24c32067bbd281dc0493008e19f469f1827ceebffd4fa78';
export const EXPECTED_CANONICAL = Object.freeze({
  'GAME_DESIGN.md': '556d99d05d7896c2b02bb653cb28e8a0cb631e223edf67e3e0c1236fd7811f71',
  'TECHNICAL_SPEC.md': '8562235331a2dc229977db11a56fdb10ba0032494d4b0d0706f41bf24c903468',
  'ART_DIRECTION.md': 'aa29931c92ada05c0693ea58730986bc8b9ce8c1b8fcbf78acb4d72be8d1529a',
  'BALANCE_SPEC.md': '5fca70f1c890b1e13a3b8b17ab3c82da725491c0cca6146a7ad0a2b1f55fd107',
  'QA_CHECKLIST.md': 'b120097203b11e7f2fe025ea5767e931395f5edc7059e9821f6ab5ce1c722122',
});
const SOURCE_ROOT_FILES = new Set(['.editorconfig','.gitignore','LICENSE','index.html','package.json','package-lock.json','vite.config.js','eslint.config.js']);
const SOURCE_DIRECTORIES = new Set(['src','tests','scripts','public','.github']);
const CANONICAL_PATHS = new Set(Object.keys(EXPECTED_CANONICAL).map((name)=>`docs/${name}`));
export function sha256Buffer(value){return createHash('sha256').update(value).digest('hex');}
export async function sha256File(filename){return sha256Buffer(await readFile(filename));}
export async function fileExists(filename){try{await access(filename);return true;}catch{return false;}}
export async function writeJson(filename,value){await mkdir(DOCS,{recursive:true});const target=path.isAbsolute(filename)?filename:path.join(DOCS,filename);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,`${JSON.stringify(value,null,2)}\n`);return target;}
export async function readJson(filename,fallback=null){try{return JSON.parse(await readFile(filename,'utf8'));}catch{return fallback;}}
async function walk(directory,base=ROOT){const files=[];for(const entry of await readdir(directory,{withFileTypes:true})){const absolute=path.join(directory,entry.name);const relative=path.relative(base,absolute).replaceAll(path.sep,'/');if(entry.isDirectory()){if(['node_modules','.git','dist','test-results','playwright-report'].includes(entry.name)||entry.name.startsWith('dist-')||entry.name.startsWith('.phase12-'))continue;files.push(...await walk(absolute,base));}else files.push(relative);}return files;}
export async function sourceManifest(){const all=await walk(ROOT);const included=all.filter((relative)=>{if(SOURCE_ROOT_FILES.has(relative)||CANONICAL_PATHS.has(relative))return true;return SOURCE_DIRECTORIES.has(relative.split('/')[0]);}).sort();const entries=[];for(const relative of included){const absolute=path.join(ROOT,relative);const info=await stat(absolute);entries.push({path:relative,bytes:info.size,sha256:await sha256File(absolute)});}return{algorithm:'sha256(path+size+content)',digest:sha256Buffer(entries.map((e)=>`${e.sha256} ${e.bytes} ${e.path}`).join('\n')),fileCount:entries.length,entries};}
export async function canonicalHashes(){const out={};for(const [name,expected] of Object.entries(EXPECTED_CANONICAL)){const actual=await sha256File(path.join(DOCS,name));out[name]={expected,actual,unchanged:actual===expected};}return out;}
export function commandVersion(command,args=['--version'],env=process.env){try{return execFileSync(command,args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],env}).trim();}catch{return null;}}
export function environmentSnapshot(){return{platform:process.platform,arch:process.arch,kernel:os.release(),osType:os.type(),node:process.version,npm:commandVersion('npm'),playwright:commandVersion(process.execPath,[path.join(ROOT,'node_modules/playwright/cli.js'),'--version']),chromium:commandVersion(process.env.CHROMIUM_EXECUTABLE||'/usr/bin/chromium'),firefox:process.env.FIREFOX_EXECUTABLE?commandVersion(process.env.FIREFOX_EXECUTABLE,['--version'],{...process.env,MOZ_HEADLESS:'1'}):null,git:commandVersion('git'),gh:commandVersion('gh')};}
export async function packageMetadata(){return JSON.parse(await readFile(path.join(ROOT,'package.json'),'utf8'));}
export async function packageVersion(){return(await packageMetadata()).version;}
export async function runtimeVersion(){return(await readFile(path.join(ROOT,'src/utils/version.js'),'utf8')).match(/BUILD_VERSION\s*=\s*'([^']+)'/)?.[1]??null;}
export async function productionBundleDigest(directory=path.join(ROOT,'dist')){if(!(await fileExists(directory)))return null;const files=(await walk(directory,directory)).sort();const entries=[];for(const relative of files){const absolute=path.join(directory,relative);const info=await stat(absolute);entries.push({path:relative,bytes:info.size,sha256:await sha256File(absolute)});}return{digest:sha256Buffer(entries.map((e)=>`${e.sha256} ${e.bytes} ${e.path}`).join('\n')),fileCount:entries.length,entries};}
export function baseReport(scope){return{generatedAt:new Date().toISOString(),phase:12,scope,status:'not-run',packageVersion:null,runtimeVersion:null,sourceManifestDigest:null,productionBundleDigest:null,environment:environmentSnapshot(),passed:false};}
