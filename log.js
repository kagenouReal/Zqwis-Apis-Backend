


Trial



Zqwis-Apis-Backend
Deployments
Variables
Metrics
Console
Settings
zqwis-backend.up.railway.app
22.22.3node@22.22.3
Southeast Asia
1 Replica




History

Hide Skipped



















Zqwis-Apis-Backend

Failed
Jun 14, 2026, 2:37 PM
Get Help
DetailsBuildDeployHTTPNetwork Flow
Reading file: package.json
00:12
You reached the start of the range
Jun 14, 2026, 2:32 PM
scheduling build on Metal builder "builder-pivopd"
unpacking archive
990 KB
8ms
using build driver railpack-v0.27.0
uploading snapshot
269.6 KB
43ms
 INFO No package manager inferred, using npm default
                   
╭─────────────────╮
│ Railpack 0.27.0 │
╰─────────────────╯
 
  ↳ Detected Node
  ↳ Using npm package manager
            
  Packages  
  ──────────
  node  │  22.22.3  │  railpack default (22)
            
  Steps     
  ──────────
  ▸ install
    $ npm install
         
  ▸ build
    $ npm run build
            
  Deploy    
  ──────────
    $ npm run start
 

load build definition from ./railpack-plan.json
0ms

mkdir -p /app/node_modules/.cache cached
1ms

install mise packages: node cached
0ms

copy package.json
142ms

npm install
10s
npm warn config production Use `--omit=dev` instead.
npm error code ERESOLVE
npm error ERESOLVE could not resolve
npm error
npm error While resolving: @whiskeysockets/baileys@7.0.0-rc13
npm error Found: jimp@1.6.1
npm error node_modules/jimp
npm error   jimp@"^1.6.1" from the root project
npm error
npm error Could not resolve dependency:
npm error peerOptional overridden jimp@"0.16.1" (was "^1.6.1") from @whiskeysockets/baileys@7.0.0-rc13
npm error node_modules/@whiskeysockets/baileys
npm error   @whiskeysockets/baileys@"^7.0.0-rc13" from the root project
npm error
npm error Conflicting peer dependency: jimp@0.16.1
npm error node_modules/jimp
npm error   peerOptional overridden jimp@"0.16.1" (was "^1.6.1") from @whiskeysockets/baileys@7.0.0-rc13
npm error   node_modules/@whiskeysockets/baileys
npm error     @whiskeysockets/baileys@"^7.0.0-rc13" from the root project
npm error
npm error Fix the upstream dependency conflict, or retry
npm error this command with --force or --legacy-peer-deps
npm error to accept an incorrect (and potentially broken) dependency resolution.
npm error
npm error
npm error For a full report see:
npm error /root/.npm/_logs/2026-06-14T06_37_59_062Z-eresolve-report.txt
npm error A complete log of this run can be found in: /root/.npm/_logs/2026-06-14T06_37_59_062Z-debug-0.log
Build Failed: build daemon returned an error < failed to solve: process "npm install" did not complete successfully: exit code: 1 >
