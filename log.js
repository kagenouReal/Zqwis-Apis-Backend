

production


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
Jun 14, 2026, 4:38 PM
Get Help
DetailsBuildDeployHTTPNetwork Flow
Diagnosis › Try running a diagnosis to understand why this deployment failed.

Diagnose
You reached the start of the range
Jun 14, 2026, 4:33 PM
scheduling build on Metal builder "builder-pivopd"
unpacking archive
1000 KB
8ms
uploading snapshot
270.9 KB
using build driver railpack-v0.27.0
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
1ms

install mise packages: node cached
0ms

mkdir -p /app/node_modules/.cache cached
0ms

copy package.json
78ms

npm install
24s
Run `npm audit` for details.

copy / /app
490ms

npm run build
12s
npm warn config production Use `--omit=dev` instead.
> Zqwis - Apis@X build
> next build
▲ Next.js 16.2.4 (Turbopack)
- Experiments (use with caution):
  · serverActions
  Creating an optimized production build ...
✓ Compiled successfully in 7.2s
  Running TypeScript ...
Failed to type check.
./src/system/lib/premium.ts:210:64
Type error: Parameter 'id' implicitly has an 'any' type.

  208 | ...'s a new day, clear daily missions from completed list
  209 | ...Date !== nowDate) {
> 210 | ...ions.completed = missions.completed.filter(id => !id.startsWith("daily_"));
      |                                               ^
  211 | ...ions.lastClaimedDaily = Date.now();
  212 | ...
  213 | ...sDaily) {
Next.js build worker exited with code: 1 and signal: null
Build Failed: build daemon returned an error < failed to solve: process "npm run build" did not complete successfully: exit code: 1 >
You reached the end of the range
Jun 14, 2026, 4:44 PM