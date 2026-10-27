# Study 48: writes options.json, the hover options per member, verbatim from ~/dev/ewc (sales kit,
# brand guide via personas.json, HANDOFF) and the founders' Tuesday answers (46/words.json).
#   python3 -I studies/iterations/48/extract.py
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import re,html,json,sys
kit=open(os.path.expanduser('~/dev/ewc/')+'src/sales-kit.html').read()
kit=re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>','',kit)
t=re.sub(r'</(p|div|li|h\d|dt|dd|section|tr)>','\n',kit); t=re.sub(r'<[^>]+>',' ',t); t=html.unescape(t)
t='\n'.join(re.sub(r'\s+',' ',l).strip() for l in t.split('\n') if l.strip())
P=json.load(open('personas.json'))['personas']
W=json.load(open('../46/words.json'))['words']
plays=re.split(r'\nPlay (?:one|two|three|four|five|six)\n',t)[1:7]
def after(block,label):
    m=re.search(r'\n'+label+r'\n(.+)',block); return m.group(1).strip()
codes=['QC','CCG','SRO','NSF','EN','MCHE']
FOUND={'QC':'f.a1','CCG':'f.a3','NSF':'f.a4','EN':'f.a2'}
PLACE=re.compile(r'coffeeshop|\bbar\b|\bhome\b|house')
out=[]
for i,(c,p,b) in enumerate(zip(codes,P,plays)):
    lines=b.split('\n')
    oneliner=lines[2] if lines[1].startswith('(') or 'secondary' in lines[1] else lines[1]
    spot=after(b,'Spot them'); openw=after(b,'Open with'); hes=after(b,'The hesitation')
    openhead=re.match(r'(.+?\.)(\s|$)',openw).group(1)
    hes1=re.match(r'(.+?\.)(\s|$)',hes).group(1)
    w=next((x for x in p['wants'] if PLACE.search(x['today'])),p['wants'][0])
    o=[
     dict(kind='who they are',text=p['profile'],flag='sourced',src='ewc/src/brand-guide.html, "Audience" (personas.json)'),
     dict(kind='spot them',text=spot,flag='sourced',src='ewc/src/sales-kit.html, '+p['name']+', "Spot them"'),
     dict(kind='open with',text=openhead,flag='sourced',src='ewc/src/sales-kit.html, '+p['name']+', "Open with"'),
     dict(kind='the hesitation',text=hes1,flag='sourced',src='ewc/src/sales-kit.html, '+p['name']+', "The hesitation"'),
     dict(kind='the want that hits',text=w['want']+' Today: '+w['today']+'.',flag='sourced',src='ewc/src/brand-guide.html, "what we replace" (personas.json): want + today, joined'),
    ]
    if c in FOUND:
        f=W[FOUND[c]]; o.append(dict(kind='the founders’ Tuesday (our pairing)',text=f['text'],flag='sourced',src=f['src']+'; the pairing with this member is ours'))
    if c=='SRO':
        o.append(dict(kind='their part in the room',text='named roles: league captains, dinner hosts',flag='sourced',src='ewc/docs/HANDOFF.md, programming per persona (Semi-Retired Operator)'))
    if c=='QC':
        o.append(dict(kind='their part in the room (our pairing)',text='Anchors (walkable, Tuesday-because-Tuesday regulars)',flag='sourced',src='ewc/docs/HANDOFF.md, "casting the founding 25"; the pairing with this member is ours'))
    for k,x in enumerate(o): x['code']=f'{c}-{"abcdefg"[k]}'
    out.append(dict(code=c,i=i,name=p['name'],options=o))
T=[dict(code='T-a',name='card',text='A card floats over the column.'),dict(code='T-b',name='opens in place',text='The column opens; the line appears under the name.'),dict(code='T-c',name='spotlight',text='The other five dim; the line opens under the name.')]
for x in T: x['flag']='draft'
json.dump(dict(about='Study 48: the hover options per member and the hover treatments. Every option is verbatim from the source it names (src); a pairing marked "ours" is our choice of which member it goes with. Treatment lines are ours (draft). Codes are what Kahran picks by.',treatments=T,personas=out),open('options.json','w'),indent=1,ensure_ascii=False)
