import base64, json
t=open('template.html').read()
rd=lambda p: open(p).read().replace('</script>','<\\/script>')
b64=lambda p: base64.b64encode(open(p,'rb').read()).decode()
three=rd('node_modules/three/build/three.min.js')
gltf=rd('node_modules/three/examples/js/loaders/GLTFLoader.js'); skel=rd('node_modules/three/examples/js/utils/SkeletonUtils.js')
files={'ferrari_hi':'ferrari_hi','ferrari_lo':'ferrari_lo','ferrari_wheel':'ferrari_wheel','concept_hi':'concept_hi','concept_lo':'concept_lo','concept_wheel':'concept_wheel','soldier':'soldier','cesium':'cesiumman'}
assets='const ASSETS={'+','.join('%s:"%s"'%(k,b64('../models/opt/%s.glb'%v)) for k,v in files.items())+'};\n'
assets+='const CAR_META='+open('../models/opt/meta.json').read()+';\n'
assets+='const TEX_B64={brick:"%s",grass:"%s"};\n'%(b64('../models/opt/brick.jpg'),b64('../models/opt/grass.jpg'))
game=assets+''.join(open(f).read()+'\n' for f in ['p1_core.js','p2_world.js','p3_entities.js','p6_assets.js','p7_interiors.js','p8_iran.js','p9_extras.js','p4_logic.js','p5_main.js'])
game=game.replace('</script>','<\\/script>')
out=t.replace('/*__THREE__*/',three).replace('/*__GLTF__*/',gltf).replace('/*__SKEL__*/',skel).replace('/*__GAME__*/',game)
open('banana_city.html','w').write(out)
open('game_all.js','w').write("(function(){'use strict';\n"+game+"\n})();")
print(len(out)//1024,'KB')
